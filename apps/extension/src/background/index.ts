import type { RiskCard } from "@sco/shared";
import { getRiskCard } from "../shared/api";
import { getHostname } from "../shared/domain";
import { readCachedCard, writeCachedCard } from "../shared/storage";

const badgeColor: Record<RiskCard["riskLevel"], string> = {
  low: "#2f9e44",
  medium: "#f08c00",
  high: "#e03131",
  unknown: "#868e96"
};

const badgeText: Record<RiskCard["riskLevel"], string> = {
  low: "L",
  medium: "M",
  high: "H",
  unknown: "?"
};

const updateBadge = async (tabId: number, card?: RiskCard): Promise<void> => {
  if (!card) {
    await chrome.action.setBadgeText({ tabId, text: "" });
    return;
  }
  await chrome.action.setBadgeText({ tabId, text: badgeText[card.riskLevel] });
  await chrome.action.setBadgeBackgroundColor({ tabId, color: badgeColor[card.riskLevel] });
};

const sendCardToTab = async (tabId: number, card: RiskCard): Promise<void> => {
  try {
    await chrome.tabs.sendMessage(tabId, { type: "SCO_RISK_CARD", card });
  } catch {
    // Content scripts are not available on every Chrome page.
  }
};

const analyzeTab = async (tabId: number, url?: string): Promise<void> => {
  const domain = getHostname(url);
  if (!domain) {
    await updateBadge(tabId);
    return;
  }

  const cached = await readCachedCard(domain);
  if (cached) {
    await updateBadge(tabId, cached);
    await sendCardToTab(tabId, cached);
    return;
  }

  try {
    const card = await getRiskCard(domain);
    await writeCachedCard(card);
    await updateBadge(tabId, card);
    await sendCardToTab(tabId, card);
  } catch {
    await chrome.action.setBadgeText({ tabId, text: "!" });
    await chrome.action.setBadgeBackgroundColor({ tabId, color: "#868e96" });
  }
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    void analyzeTab(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  await analyzeTab(tabId, tab.url);
});
