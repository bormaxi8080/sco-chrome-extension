import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { RiskCard, RiskSignal } from "@sco/shared";
import { getRiskCard, refreshRiskCard } from "../shared/api";
import { getHostname } from "../shared/domain";
import { readCachedCard, writeCachedCard } from "../shared/storage";
import "./styles.css";

type LoadState =
  | { status: "loading"; domain?: string }
  | { status: "error"; message: string; domain?: string }
  | { status: "ready"; card: RiskCard };

const riskLabel = (level: RiskCard["riskLevel"]) => level[0].toUpperCase() + level.slice(1);

const useActiveDomain = () => {
  const [domain, setDomain] = useState<string | null>(null);

  useEffect(() => {
    void chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      setDomain(getHostname(tab?.url));
    });
  }, []);

  return domain;
};

const SignalItem = ({ signal }: { signal: RiskSignal }) => (
  <li className={`signal signal-${signal.severity}`}>
    <div>
      <strong>{signal.label}</strong>
      <span>{signal.evidence}</span>
    </div>
    <span className="impact">+{signal.scoreImpact}</span>
  </li>
);

const Fact = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="fact">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const App = () => {
  const activeDomain = useActiveDomain();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const load = useCallback(async (domain: string, forceRefresh = false) => {
    setState({ status: "loading", domain });
    try {
      const cached = forceRefresh ? null : await readCachedCard(domain);
      const card = cached ?? (forceRefresh ? await refreshRiskCard(domain) : await getRiskCard(domain));
      await writeCachedCard(card);
      setState({ status: "ready", card });
    } catch (error) {
      setState({
        status: "error",
        domain,
        message: error instanceof Error ? error.message : "Unable to load risk card"
      });
    }
  }, []);

  useEffect(() => {
    if (activeDomain) {
      void load(activeDomain);
    } else if (activeDomain === null) {
      setState({ status: "error", message: "Open an HTTP or HTTPS page to analyze this source." });
    }
  }, [activeDomain, load]);

  const topSignals = useMemo(() => {
    if (state.status !== "ready") return [];
    return state.card.signals.slice(0, 5);
  }, [state]);

  if (state.status === "loading") {
    return (
      <main className="popup">
        <header className="header">
          <h1>Source Credibility Overlay</h1>
          <p>{state.domain ?? "Current source"}</p>
        </header>
        <div className="loading">Loading risk signals...</div>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="popup">
        <header className="header">
          <h1>Source Credibility Overlay</h1>
          <p>{state.domain ?? "Current source"}</p>
        </header>
        <div className="error">{state.message}</div>
      </main>
    );
  }

  const { card } = state;

  return (
    <main className="popup">
      <header className="header">
        <h1>Source Credibility Overlay</h1>
        <p>{card.normalizedDomain}</p>
      </header>

      <section className={`risk-card risk-${card.riskLevel}`}>
        <div>
          <span className="eyebrow">Risk assessment</span>
          <h2>{riskLabel(card.riskLevel)} Risk</h2>
          <p>{card.summary}</p>
        </div>
        <div className="score">
          <strong>{card.score}</strong>
          <span>/100</span>
        </div>
      </section>

      <div className="meta-row">
        <span>Confidence: <strong>{riskLabel(card.confidence)}</strong></span>
        <span>Last checked: {new Date(card.checkedAt).toLocaleTimeString()}</span>
      </div>

      <section className="facts">
        <Fact label="Domain age" value={card.domainInfo.ageDays !== undefined ? `${card.domainInfo.ageDays} days` : "Unknown"} />
        <Fact label="Ownership" value={card.domainInfo.registrar ? "Registrar known" : "Not verified"} />
        <Fact label="HTTPS" value={card.tlsInfo.httpsAvailable ? "Available" : "Unavailable"} />
        <Fact label="Known lists" value={card.listMatches.length ? `${card.listMatches.length} match` : "No critical match"} />
      </section>

      <section className="signals">
        <h3>Top signals</h3>
        {topSignals.length ? (
          <ul>{topSignals.map((item) => <SignalItem key={item.id} signal={item} />)}</ul>
        ) : (
          <p className="empty">No major elevated-risk technical signals were detected.</p>
        )}
      </section>

      <footer className="actions">
        <button type="button" onClick={() => void load(card.normalizedDomain, true)}>Refresh</button>
        <button type="button" className="secondary" onClick={() => window.close()}>Close</button>
      </footer>
    </main>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
