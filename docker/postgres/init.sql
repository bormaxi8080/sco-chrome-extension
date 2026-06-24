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
