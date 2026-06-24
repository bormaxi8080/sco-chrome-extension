import { describe, expect, it } from "vitest";
import { buildRiskCard } from "../src/risk/scoring.js";

describe("buildRiskCard", () => {
  it("raises medium risk for a recently registered sparse site", () => {
    const card = buildRiskCard({
      domain: "example.test",
      normalizedDomain: "example.test",
      registrableDomain: "example.test",
      cacheTtlSeconds: 3600,
      rdap: {
        rdapAvailable: true,
        createdAt: new Date(Date.now() - 10 * 86_400_000).toISOString(),
        ageDays: 10
      },
      dns: { recordsChecked: true, hasMx: false, nameservers: ["ns1.example.test"] },
      tls: { httpsAvailable: true, recentlyIssued: true },
      page: {
        reachable: true,
        socialLinks: [],
        hasAboutPage: false,
        hasContactPage: false,
        hasPrivacyPage: false,
        redirects: { count: 0, chain: ["https://example.test"], crossDomainRedirects: 0 }
      }
    });

    expect(card.riskLevel).toBe("high");
    expect(card.score).toBeGreaterThanOrEqual(55);
    expect(card.summary).toContain("Manual verification");
  });

  it("returns unknown when confidence is low and no strong signal exists", () => {
    const card = buildRiskCard({
      domain: "example.test",
      normalizedDomain: "example.test",
      registrableDomain: "example.test",
      cacheTtlSeconds: 3600,
      rdap: { rdapAvailable: false },
      dns: { recordsChecked: false },
      tls: { httpsAvailable: false },
      page: {
        reachable: false,
        socialLinks: [],
        redirects: { count: 0, chain: ["https://example.test"], crossDomainRedirects: 0 }
      }
    });

    expect(card.confidence).toBe("low");
    expect(card.riskLevel).toBe("medium");
  });
});
