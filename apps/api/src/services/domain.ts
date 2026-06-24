import { getDomain, parse } from "tldts";

export interface NormalizedDomain {
  input: string;
  normalizedDomain: string;
  registrableDomain: string;
}

export const normalizeDomain = (input: string): NormalizedDomain => {
  const candidate = input.includes("://") ? input : `https://${input}`;
  let hostname: string;

  try {
    hostname = new URL(candidate).hostname;
  } catch {
    throw new Error("Invalid domain");
  }

  const normalizedDomain = hostname.toLowerCase().replace(/\.$/, "");
  const parsed = parse(normalizedDomain);
  const registrableDomain = getDomain(normalizedDomain) ?? normalizedDomain;

  if (!normalizedDomain || parsed.isIp || normalizedDomain === "localhost") {
    throw new Error("Unsupported domain");
  }

  return {
    input,
    normalizedDomain,
    registrableDomain
  };
};

export const daysBetween = (fromIso: string, to = new Date()): number => {
  const from = new Date(fromIso);
  if (Number.isNaN(from.getTime())) return 0;
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86_400_000));
};
