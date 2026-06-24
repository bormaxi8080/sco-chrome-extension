import { Pool } from "pg";
import type { RiskCard } from "@sco/shared";

export class RiskCardRepository {
  private pool?: Pool;

  constructor(databaseUrl?: string) {
    if (databaseUrl) {
      this.pool = new Pool({ connectionString: databaseUrl });
    }
  }

  async init(): Promise<void> {
    if (!this.pool) return;
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS domains (
        id BIGSERIAL PRIMARY KEY,
        normalized_domain TEXT NOT NULL UNIQUE,
        registrable_domain TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS domain_snapshots (
        id BIGSERIAL PRIMARY KEY,
        domain_id BIGINT NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
        risk_score INTEGER NOT NULL,
        risk_level TEXT NOT NULL,
        confidence TEXT NOT NULL,
        card_json JSONB NOT NULL,
        checked_at TIMESTAMPTZ NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_domain_snapshots_domain_expires
        ON domain_snapshots(domain_id, expires_at DESC);
    `);
  }

  async getFresh(normalizedDomain: string): Promise<RiskCard | null> {
    if (!this.pool) return null;
    const result = await this.pool.query(
      `
      SELECT ds.card_json
      FROM domain_snapshots ds
      JOIN domains d ON d.id = ds.domain_id
      WHERE d.normalized_domain = $1 AND ds.expires_at > now()
      ORDER BY ds.expires_at DESC
      LIMIT 1
      `,
      [normalizedDomain]
    );
    return (result.rows[0]?.card_json as RiskCard | undefined) ?? null;
  }

  async save(card: RiskCard): Promise<void> {
    if (!this.pool) return;
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const domainResult = await client.query<{ id: string }>(
        `
        INSERT INTO domains (normalized_domain, registrable_domain)
        VALUES ($1, $2)
        ON CONFLICT (normalized_domain)
        DO UPDATE SET registrable_domain = EXCLUDED.registrable_domain, updated_at = now()
        RETURNING id
        `,
        [card.normalizedDomain, card.registrableDomain]
      );
      await client.query(
        `
        INSERT INTO domain_snapshots
          (domain_id, risk_score, risk_level, confidence, card_json, checked_at, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          domainResult.rows[0].id,
          card.score,
          card.riskLevel,
          card.confidence,
          card,
          card.checkedAt,
          new Date(Date.now() + card.cacheTtlSeconds * 1000).toISOString()
        ]
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool?.end();
  }
}
