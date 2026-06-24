import type { ConfidenceLevel, RiskCard, RiskLevel, RiskSignal } from "@sco/shared";
import type { DnsResult } from "../collectors/dns.js";
import type { PageResult } from "../collectors/page.js";
import type { RdapResult } from "../collectors/rdap.js";
import type { TlsResult } from "../collectors/tls.js";

export interface ScoreInput {
  domain: string;
  normalizedDomain: string;
  registrableDomain: string;
  rdap: RdapResult;
  dns: DnsResult;
  tls: TlsResult;
  page: PageResult;
  cacheTtlSeconds: number;
}

const signal = (
  id: string,
  label: string,
  severity: RiskSignal["severity"],
  scoreImpact: number,
  evidence: string,
  recommendation?: string
): RiskSignal => ({ id, label, severity, scoreImpact, evidence, recommendation });

const riskLevelFor = (score: number, confidence: ConfidenceLevel): RiskLevel => {
  if (confidence === "low" && score < 25) return "unknown";
  if (score >= 55) return "high";
  if (score >= 25) return "medium";
  return "low";
};

const confidenceFor = (input: ScoreInput): ConfidenceLevel => {
  const groups = [
    input.rdap.rdapAvailable,
    input.dns.recordsChecked,
    input.tls.httpsAvailable,
    input.page.reachable
  ].filter(Boolean).length;

  if (groups >= 3) return "high";
  if (groups >= 2) return "medium";
  return "low";
};

export const buildRiskCard = (input: ScoreInput): RiskCard => {
  const signals: RiskSignal[] = [];

  if (input.rdap.ageDays !== undefined && input.rdap.ageDays < 90) {
    signals.push(signal(
      "domain_recent_90",
      "Recently registered domain",
      "high",
      30,
      `Domain age is ${input.rdap.ageDays} days.`,
      "Verify ownership and corroborate the source with independent references."
    ));
  } else if (input.rdap.ageDays !== undefined && input.rdap.ageDays < 180) {
    signals.push(signal(
      "domain_recent_180",
      "Relatively new domain",
      "medium",
      20,
      `Domain age is ${input.rdap.ageDays} days.`
    ));
  }

  if (!input.rdap.rdapAvailable) {
    signals.push(signal(
      "rdap_unavailable",
      "RDAP data unavailable",
      "medium",
      15,
      input.rdap.error ?? "RDAP lookup did not return usable registration data."
    ));
  }

  if (!input.tls.httpsAvailable) {
    signals.push(signal(
      "https_unavailable",
      "HTTPS unavailable",
      "high",
      20,
      input.tls.error ?? "The site did not present a usable TLS certificate."
    ));
  } else if (input.tls.recentlyIssued) {
    signals.push(signal(
      "cert_recent",
      "Certificate issued recently",
      "medium",
      10,
      `Certificate valid from ${input.tls.validFrom ?? "an unknown recent date"}.`
    ));
  }

  if (input.page.reachable) {
    if (input.page.hasAboutPage === false) {
      signals.push(signal("about_missing", "About page not found", "medium", 10, "Common about page paths did not respond successfully."));
    }
    if (input.page.hasContactPage === false) {
      signals.push(signal("contact_missing", "Contact page not found", "medium", 10, "Common contact page paths did not respond successfully."));
    }
    if (input.page.hasPrivacyPage === false) {
      signals.push(signal("privacy_missing", "Privacy page not found", "low", 5, "Common privacy page paths did not respond successfully."));
    }
    if (!input.page.title && !input.page.description) {
      signals.push(signal("metadata_sparse", "Sparse page metadata", "low", 10, "No title or description metadata was found on the homepage."));
    }
  }

  if (input.page.redirects.crossDomainRedirects > 0) {
    signals.push(signal(
      "cross_domain_redirect",
      "Cross-domain redirect detected",
      "medium",
      15,
      `The initial domain redirects to ${input.page.finalUrl ?? "another host"}.`
    ));
  }

  const score = Math.min(100, Math.max(0, signals.reduce((total, item) => total + item.scoreImpact, 0)));
  const confidence = confidenceFor(input);
  const riskLevel = riskLevelFor(score, confidence);
  const summary = riskLevel === "unknown"
    ? "Available signals are insufficient for a reliable assessment. Manual verification recommended."
    : score >= 25
      ? "Signals indicate elevated risk. Manual verification recommended."
      : "No major elevated-risk technical signals were detected. Manual verification is still recommended.";

  return {
    domain: input.domain,
    normalizedDomain: input.normalizedDomain,
    registrableDomain: input.registrableDomain,
    finalUrl: input.page.finalUrl,
    status: confidence === "low" ? "partial" : "complete",
    riskLevel,
    score,
    confidence,
    summary,
    signals,
    domainInfo: {
      registrar: input.rdap.registrar,
      createdAt: input.rdap.createdAt,
      ageDays: input.rdap.ageDays,
      expiresAt: input.rdap.expiresAt,
      rdapAvailable: input.rdap.rdapAvailable
    },
    dnsInfo: {
      recordsChecked: input.dns.recordsChecked,
      hasMx: input.dns.hasMx,
      nameservers: input.dns.nameservers
    },
    tlsInfo: {
      httpsAvailable: input.tls.httpsAvailable,
      issuer: input.tls.issuer,
      validFrom: input.tls.validFrom,
      validTo: input.tls.validTo,
      recentlyIssued: input.tls.recentlyIssued
    },
    siteInfo: {
      reachable: input.page.reachable,
      hasAboutPage: input.page.hasAboutPage,
      hasContactPage: input.page.hasContactPage,
      hasPrivacyPage: input.page.hasPrivacyPage,
      title: input.page.title,
      description: input.page.description,
      language: input.page.language,
      socialLinks: input.page.socialLinks
    },
    redirects: input.page.redirects,
    listMatches: [],
    checkedAt: new Date().toISOString(),
    cacheTtlSeconds: input.cacheTtlSeconds
  };
};
