import type { RiskCard } from "@sco/shared";

const cardKey = (domain: string) => `risk-card:${domain}`;
const dismissKey = (domain: string) => `overlay-dismissed:${domain}`;

export const readCachedCard = async (domain: string): Promise<RiskCard | null> => {
  const result = await chrome.storage.local.get(cardKey(domain));
  const card = result[cardKey(domain)] as RiskCard | undefined;
  if (!card) return null;
  const expiresAt = new Date(card.checkedAt).getTime() + card.cacheTtlSeconds * 1000;
  return expiresAt > Date.now() ? card : null;
};

export const writeCachedCard = async (card: RiskCard): Promise<void> => {
  await chrome.storage.local.set({ [cardKey(card.normalizedDomain)]: card });
};

export const isOverlayDismissed = async (domain: string): Promise<boolean> => {
  const result = await chrome.storage.local.get(dismissKey(domain));
  return result[dismissKey(domain)] === true;
};

export const dismissOverlay = async (domain: string): Promise<void> => {
  await chrome.storage.local.set({ [dismissKey(domain)]: true });
};
