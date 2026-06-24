export type RiskLevel = "low" | "medium" | "high" | "unknown";
export type ConfidenceLevel = "low" | "medium" | "high";
export type SignalSeverity = "info" | "low" | "medium" | "high";

export interface RiskSignal {
  id: string;
  label: string;
  severity: SignalSeverity;
  scoreImpact: number;
  evidence: string;
  recommendation?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  handle?: string;
}

export interface RiskCard {
  domain: string;
  normalizedDomain: string;
  registrableDomain: string;
  finalUrl?: string;
  status: "complete" | "partial" | "pending";
  riskLevel: RiskLevel;
  score: number;
  confidence: ConfidenceLevel;
  summary: string;
  signals: RiskSignal[];
  domainInfo: {
    registrar?: string;
    createdAt?: string;
    ageDays?: number;
    expiresAt?: string;
    rdapAvailable: boolean;
  };
  dnsInfo: {
    recordsChecked: boolean;
    hasMx?: boolean;
    nameservers?: string[];
  };
  tlsInfo: {
    httpsAvailable: boolean;
    issuer?: string;
    validFrom?: string;
    validTo?: string;
    recentlyIssued?: boolean;
  };
  siteInfo: {
    reachable?: boolean;
    hasAboutPage?: boolean;
    hasContactPage?: boolean;
    hasPrivacyPage?: boolean;
    title?: string;
    description?: string;
    language?: string;
    socialLinks?: SocialLink[];
  };
  redirects: {
    count: number;
    chain: string[];
    crossDomainRedirects: number;
  };
  listMatches: {
    source: string;
    category: string;
    severity: "info" | "warning" | "critical";
    matchedAt?: string;
  }[];
  checkedAt: string;
  cacheTtlSeconds: number;
}
