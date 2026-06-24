import type { SocialLink } from "@sco/shared";

export interface PageResult {
  reachable: boolean;
  finalUrl?: string;
  title?: string;
  description?: string;
  language?: string;
  socialLinks: SocialLink[];
  hasAboutPage?: boolean;
  hasContactPage?: boolean;
  hasPrivacyPage?: boolean;
  redirects: {
    count: number;
    chain: string[];
    crossDomainRedirects: number;
  };
  error?: string;
}

const textMatch = (html: string, pattern: RegExp): string | undefined => {
  const match = html.match(pattern);
  return match?.[1]?.replace(/\s+/g, " ").trim();
};

const extractSocialLinks = (html: string): SocialLink[] => {
  const platforms = [
    ["x", /https?:\/\/(?:www\.)?(?:x|twitter)\.com\/[A-Za-z0-9_./-]+/gi],
    ["facebook", /https?:\/\/(?:www\.)?facebook\.com\/[A-Za-z0-9_./-]+/gi],
    ["instagram", /https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9_./-]+/gi],
    ["youtube", /https?:\/\/(?:www\.)?youtube\.com\/[A-Za-z0-9_./-]+/gi],
    ["linkedin", /https?:\/\/(?:www\.)?linkedin\.com\/[A-Za-z0-9_./-]+/gi],
    ["telegram", /https?:\/\/t\.me\/[A-Za-z0-9_./-]+/gi]
  ] as const;

  return platforms.flatMap(([platform, pattern]) =>
    [...html.matchAll(pattern)].slice(0, 3).map((match) => ({ platform, url: match[0] }))
  ).slice(0, 12);
};

const checkPath = async (origin: string, paths: string[], timeoutMs: number): Promise<boolean> => {
  for (const path of paths) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${origin}${path}`, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal
      });
      if (response.ok) return true;
    } catch {
      // Try next common path.
    } finally {
      clearTimeout(timeout);
    }
  }
  return false;
};

export const collectPage = async (domain: string, timeoutMs: number): Promise<PageResult> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const chain: string[] = [`https://${domain}`];

  try {
    const response = await fetch(`https://${domain}`, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "SourceCredibilityOverlay/0.1 (+https://localhost)"
      }
    });
    const finalUrl = response.url;
    if (finalUrl && finalUrl !== chain[0]) chain.push(finalUrl);
    const html = await response.text();
    const origin = new URL(finalUrl).origin;
    const originalHost = new URL(`https://${domain}`).hostname;
    const finalHost = new URL(finalUrl).hostname;

    const [hasAboutPage, hasContactPage, hasPrivacyPage] = await Promise.all([
      checkPath(origin, ["/about", "/about-us"], Math.min(timeoutMs, 3000)),
      checkPath(origin, ["/contact", "/contact-us"], Math.min(timeoutMs, 3000)),
      checkPath(origin, ["/privacy", "/privacy-policy"], Math.min(timeoutMs, 3000))
    ]);

    return {
      reachable: response.ok,
      finalUrl,
      title: textMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
      description: textMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i)
        ?? textMatch(html, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i),
      language: textMatch(html, /<html[^>]+lang=["']([^"']+)["']/i),
      socialLinks: extractSocialLinks(html),
      hasAboutPage,
      hasContactPage,
      hasPrivacyPage,
      redirects: {
        count: Math.max(0, chain.length - 1),
        chain,
        crossDomainRedirects: originalHost === finalHost ? 0 : 1
      }
    };
  } catch (error) {
    return {
      reachable: false,
      socialLinks: [],
      redirects: { count: 0, chain, crossDomainRedirects: 0 },
      error: error instanceof Error ? error.message : "Page fetch failed"
    };
  } finally {
    clearTimeout(timeout);
  }
};
