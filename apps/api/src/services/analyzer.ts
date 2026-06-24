import type { RiskCard } from "@sco/shared";
import type { ApiConfig } from "../config.js";
import { collectDns } from "../collectors/dns.js";
import { collectPage } from "../collectors/page.js";
import { collectRdap } from "../collectors/rdap.js";
import { collectTls } from "../collectors/tls.js";
import { buildRiskCard } from "../risk/scoring.js";
import { normalizeDomain } from "./domain.js";
import type { RiskCardRepository } from "../db/postgres.js";

export class DomainAnalyzer {
  constructor(
    private readonly config: ApiConfig,
    private readonly repository: RiskCardRepository
  ) {}

  async analyze(input: string, forceRefresh = false): Promise<RiskCard> {
    const domain = normalizeDomain(input);

    if (!forceRefresh) {
      const cached = await this.repository.getFresh(domain.normalizedDomain);
      if (cached) return cached;
    }

    const [rdap, dns, tls, page] = await Promise.all([
      collectRdap(domain.registrableDomain, this.config.rdapTimeoutMs),
      collectDns(domain.normalizedDomain, this.config.dnsTimeoutMs),
      collectTls(domain.normalizedDomain, this.config.tlsTimeoutMs),
      collectPage(domain.normalizedDomain, this.config.pageFetchTimeoutMs)
    ]);

    const card = buildRiskCard({
      domain: input,
      normalizedDomain: domain.normalizedDomain,
      registrableDomain: domain.registrableDomain,
      rdap,
      dns,
      tls,
      page,
      cacheTtlSeconds: this.config.riskCardTtlSeconds
    });

    await this.repository.save(card);
    return card;
  }
}
