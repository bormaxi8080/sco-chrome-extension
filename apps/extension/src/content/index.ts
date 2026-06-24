import type { RiskCard } from "@sco/shared";
import { dismissOverlay, isOverlayDismissed } from "../shared/storage";

const overlayId = "source-credibility-overlay-root";

const colorFor = (riskLevel: RiskCard["riskLevel"]) => ({
  low: "#2f9e44",
  medium: "#f08c00",
  high: "#e03131",
  unknown: "#868e96"
}[riskLevel]);

const renderOverlay = async (card: RiskCard): Promise<void> => {
  if (await isOverlayDismissed(card.normalizedDomain)) return;

  document.getElementById(overlayId)?.remove();
  const root = document.createElement("aside");
  root.id = overlayId;
  root.setAttribute("role", "status");
  root.style.cssText = `
    position: fixed;
    z-index: 2147483647;
    top: 16px;
    right: 16px;
    width: 340px;
    max-width: calc(100vw - 32px);
    box-sizing: border-box;
    background: #ffffff;
    color: #1f2937;
    border: 1px solid #d9dee7;
    border-left: 4px solid ${colorFor(card.riskLevel)};
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.16);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 13px;
    line-height: 1.4;
    padding: 12px;
  `;

  root.innerHTML = `
    <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
      <div>
        <div style="font-weight:700; color:#111827;">Source: ${card.riskLevel[0].toUpperCase()}${card.riskLevel.slice(1)} Risk</div>
        <div style="color:#64748b; margin-top:2px;">${card.normalizedDomain}</div>
      </div>
      <button type="button" data-sco-dismiss style="border:0; background:transparent; color:#64748b; cursor:pointer; font-size:16px; line-height:1;">×</button>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px;">
      <div><span style="color:#64748b;">Domain age:</span> ${card.domainInfo.ageDays ?? "unknown"} days</div>
      <div><span style="color:#64748b;">Ownership:</span> ${card.domainInfo.registrar ? "registrar known" : "not verified"}</div>
    </div>
    <p style="margin:10px 0 0; color:#374151;">${card.summary}</p>
    <div style="display:flex; gap:8px; margin-top:10px;">
      <button type="button" data-sco-details style="border:1px solid #cbd5e1; background:#ffffff; color:#111827; border-radius:6px; padding:5px 8px; cursor:pointer;">View details</button>
      <button type="button" data-sco-dismiss-text style="border:0; background:#f1f5f9; color:#334155; border-radius:6px; padding:5px 8px; cursor:pointer;">Dismiss</button>
    </div>
  `;

  root.querySelector("[data-sco-dismiss]")?.addEventListener("click", async () => {
    await dismissOverlay(card.normalizedDomain);
    root.remove();
  });
  root.querySelector("[data-sco-dismiss-text]")?.addEventListener("click", async () => {
    await dismissOverlay(card.normalizedDomain);
    root.remove();
  });
  root.querySelector("[data-sco-details]")?.addEventListener("click", () => {
    void chrome.runtime.sendMessage({ type: "SCO_OPEN_POPUP_REQUESTED" });
  });

  document.documentElement.appendChild(root);
};

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "SCO_RISK_CARD" && message.card) {
    void renderOverlay(message.card as RiskCard);
  }
});
