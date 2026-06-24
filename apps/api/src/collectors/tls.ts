import tls from "node:tls";

export interface TlsResult {
  httpsAvailable: boolean;
  issuer?: string;
  validFrom?: string;
  validTo?: string;
  recentlyIssued?: boolean;
  error?: string;
}

const firstIssuerValue = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) return value[0];
  return value;
};

export const collectTls = (domain: string, timeoutMs: number): Promise<TlsResult> => {
  return new Promise((resolve) => {
    const socket = tls.connect({
      host: domain,
      port: 443,
      servername: domain,
      timeout: timeoutMs,
      rejectUnauthorized: false
    });

    const finish = (result: TlsResult) => {
      socket.destroy();
      resolve(result);
    };

    socket.once("secureConnect", () => {
      const cert = socket.getPeerCertificate();
      const validFromDate = cert.valid_from ? new Date(cert.valid_from) : undefined;
      const issuedDaysAgo = validFromDate
        ? Math.floor((Date.now() - validFromDate.getTime()) / 86_400_000)
        : undefined;

      finish({
        httpsAvailable: true,
        issuer: firstIssuerValue(cert.issuer?.O) ?? firstIssuerValue(cert.issuer?.CN),
        validFrom: validFromDate?.toISOString(),
        validTo: cert.valid_to ? new Date(cert.valid_to).toISOString() : undefined,
        recentlyIssued: issuedDaysAgo !== undefined ? issuedDaysAgo < 14 : undefined
      });
    });

    socket.once("timeout", () => finish({ httpsAvailable: false, error: "TLS lookup timed out" }));
    socket.once("error", (error) => finish({ httpsAvailable: false, error: error.message }));
  });
};
