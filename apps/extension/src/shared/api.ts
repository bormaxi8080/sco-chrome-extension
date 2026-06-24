import type { RiskCard } from "@sco/shared";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export const getRiskCard = async (domain: string): Promise<RiskCard> => {
  const response = await fetch(`${apiBaseUrl}/v1/domains/${encodeURIComponent(domain)}/risk-card`);
  if (!response.ok) {
    throw new Error(`Risk API returned ${response.status}`);
  }
  return await response.json() as RiskCard;
};

export const refreshRiskCard = async (domain: string): Promise<RiskCard> => {
  const response = await fetch(`${apiBaseUrl}/v1/domains/${encodeURIComponent(domain)}/refresh`, {
    method: "POST"
  });
  if (!response.ok) {
    throw new Error(`Risk API returned ${response.status}`);
  }
  return await response.json() as RiskCard;
};
