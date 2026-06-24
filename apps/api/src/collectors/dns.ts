import { Resolver } from "node:dns/promises";

export interface DnsResult {
  recordsChecked: boolean;
  hasMx?: boolean;
  nameservers?: string[];
  error?: string;
}

export const collectDns = async (domain: string, timeoutMs: number): Promise<DnsResult> => {
  const resolver = new Resolver();
  resolver.setServers(["1.1.1.1", "8.8.8.8"]);
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("DNS lookup timed out")), timeoutMs);
  });

  try {
    const [mx, ns] = await Promise.race([
      Promise.all([
        resolver.resolveMx(domain).catch(() => []),
        resolver.resolveNs(domain).catch(() => [])
      ]),
      timeout
    ]);
    return {
      recordsChecked: true,
      hasMx: mx.length > 0,
      nameservers: ns
    };
  } catch (error) {
    return {
      recordsChecked: false,
      error: error instanceof Error ? error.message : "DNS lookup failed"
    };
  }
};
