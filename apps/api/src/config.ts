export interface ApiConfig {
  host: string;
  port: number;
  databaseUrl?: string;
  redisUrl?: string;
  corsExtensionOrigins: string[];
  rdapTimeoutMs: number;
  dnsTimeoutMs: number;
  tlsTimeoutMs: number;
  pageFetchTimeoutMs: number;
  riskCardTtlSeconds: number;
}

const numberEnv = (name: string, fallback: number): number => {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config: ApiConfig = {
  host: process.env.API_HOST ?? "0.0.0.0",
  port: numberEnv("API_PORT", 8080),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  corsExtensionOrigins: (process.env.CORS_EXTENSION_ORIGINS ?? "chrome-extension://*")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  rdapTimeoutMs: numberEnv("RDAP_TIMEOUT_MS", 5000),
  dnsTimeoutMs: numberEnv("DNS_TIMEOUT_MS", 3000),
  tlsTimeoutMs: numberEnv("TLS_TIMEOUT_MS", 5000),
  pageFetchTimeoutMs: numberEnv("PAGE_FETCH_TIMEOUT_MS", 7000),
  riskCardTtlSeconds: numberEnv("RISK_CARD_TTL_SECONDS", 21600)
};
