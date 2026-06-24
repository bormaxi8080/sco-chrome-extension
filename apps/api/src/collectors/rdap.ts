import { daysBetween } from "../services/domain.js";

export interface RdapResult {
  rdapAvailable: boolean;
  registrar?: string;
  createdAt?: string;
  expiresAt?: string;
  ageDays?: number;
  error?: string;
}

const firstEventDate = (events: unknown, actions: string[]): string | undefined => {
  if (!Array.isArray(events)) return undefined;
  for (const action of actions) {
    const event = events.find((item) => item?.eventAction === action);
    if (event?.eventDate) return event.eventDate;
  }
  return undefined;
};

export const collectRdap = async (domain: string, timeoutMs: number): Promise<RdapResult> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      signal: controller.signal,
      headers: { accept: "application/rdap+json, application/json" }
    });
    if (!response.ok) {
      return { rdapAvailable: false, error: `RDAP HTTP ${response.status}` };
    }
    const data = await response.json() as {
      events?: unknown[];
      registrar?: string;
      entities?: { roles?: string[]; vcardArray?: unknown[] }[];
    };

    const createdAt = firstEventDate(data.events, ["registration", "registered"]);
    const expiresAt = firstEventDate(data.events, ["expiration"]);
    const registrarEntity = data.entities?.find((entity) => entity.roles?.includes("registrar"));

    return {
      rdapAvailable: true,
      registrar: data.registrar ?? registrarEntity?.roles?.join(", "),
      createdAt,
      expiresAt,
      ageDays: createdAt ? daysBetween(createdAt) : undefined
    };
  } catch (error) {
    return {
      rdapAvailable: false,
      error: error instanceof Error ? error.message : "RDAP lookup failed"
    };
  } finally {
    clearTimeout(timeout);
  }
};
