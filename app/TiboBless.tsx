"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buildForecast } from "@/lib/monitor-logic";
import { monitorData, type Localized } from "./monitor-data";

type Language = "ko" | "en";

const labels = {
  ko: {
    language: "EN",
    eyebrow: "CODEX RESET MONITOR",
    heroTitle: "다음 Codex 리셋은\n언제일까요?",
    heroBody: "확인된 공개 리셋 기록을 바탕으로 다음 24·48시간 가능성만 간단히 보여줍니다.",
    lastReset: "마지막 확정 리셋 이후",
    nextReset: "다음 리셋 가능성",
    hours24: "24시간",
    hours48: "48시간",
    method: "과거 리셋 간격 + 아직 유효한 공개 신호",
    noGuarantee: "실험적 확률 · 보장값 아님",
    latestEvidence: "최신 공개 근거",
    confirmed: "확정",
    source: "원문 보기",
    recent: "최근 리셋",
    recentBody: "광범위한 사용자에게 완료됐다고 확인된 기록만 표시합니다.",
    scope: "범위",
    snapshot: "데이터 스냅샷",
    disclaimer: "OpenAI와 제휴하지 않음 · 확률은 실험적 추정치",
    days: "일",
    hours: "시간",
  },
  en: {
    language: "KO",
    eyebrow: "CODEX RESET MONITOR",
    heroTitle: "When is the next\nCodex reset?",
    heroBody: "A simple view of the next 24/48-hour probability, based only on verified public reset records.",
    lastReset: "Since the latest confirmed reset",
    nextReset: "Next reset probability",
    hours24: "24 hours",
    hours48: "48 hours",
    method: "Historical reset intervals + active public signals",
    noGuarantee: "Experimental probability · not a guarantee",
    latestEvidence: "Latest public evidence",
    confirmed: "Confirmed",
    source: "View source",
    recent: "Recent resets",
    recentBody: "Only completed resets confirmed for a broad group are shown.",
    scope: "Scope",
    snapshot: "Data snapshot",
    disclaimer: "Not affiliated with OpenAI · Experimental estimate",
    days: "days",
    hours: "hours",
  },
};

function local(value: Localized, language: Language) {
  return value[language];
}

export function TiboBless() {
  const [language, setLanguage] = useState<Language>("ko");
  const copy = labels[language];
  const now = useMemo(() => new Date(), []);
  const forecast = useMemo(() => buildForecast(monitorData, now), [now]);
  const resets = useMemo(
    () => [...monitorData.events].sort((a, b) => b.dateTime.localeCompare(a.dateTime)),
    [],
  );
  const latest = resets[0];

  useEffect(() => {
    const saved = window.localStorage.getItem("tibo-bless-language");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate the saved language after SSR
    if (saved === "ko" || saved === "en") setLanguage(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("tibo-bless-language", language);
  }, [language]);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  const elapsedHours = Math.max(0, (now.getTime() - new Date(latest.dateTime).getTime()) / 3_600_000);
  const elapsed = elapsedHours >= 48
    ? `${Math.floor(elapsedHours / 24)} ${copy.days}`
    : `${Math.floor(elapsedHours)} ${copy.hours}`;

  const formatDate = (date: string, includeTime = true) => new Intl.DateTimeFormat(
    language === "ko" ? "ko-KR" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
      timeZone: "UTC",
    },
  ).format(new Date(date)) + (includeTime ? " UTC" : "");

  return (
    <div className="site-shell">
      <header className="top-nav container">
        <Link className="wordmark" href="/" aria-label="Tibo Bless home">
          <span className="brand-mark">TB</span>
          <strong>Tibo Bless</strong>
        </Link>
        <div className="nav-actions">
          <span className="monitor-label"><i aria-hidden="true" />Reset monitor</span>
          <button type="button" onClick={() => setLanguage((current) => current === "ko" ? "en" : "ko")}>
            {copy.language}
          </button>
        </div>
      </header>

      <main>
        <section className="hero container">
          <div className="hero-copy">
            <p className="eyebrow"><span />{copy.eyebrow}</p>
            <h1>{copy.heroTitle.split("\n").map((line) => <span key={line}>{line}</span>)}</h1>
            <p className="hero-body">{copy.heroBody}</p>
            <div className="reset-clock">
              <span>{copy.lastReset}</span>
              <strong>{elapsed}</strong>
              <small>{formatDate(latest.dateTime)}</small>
            </div>
          </div>

          <aside className="forecast-card" aria-label={copy.nextReset}>
            <div className="forecast-heading">
              <div>
                <span>{copy.nextReset}</span>
                <small>{copy.method}</small>
              </div>
              <b>PUBLIC</b>
            </div>
            <div className="probability-grid">
              <Probability value={forecast.score24h} label={copy.hours24} />
              <Probability value={forecast.score48h} label={copy.hours48} />
            </div>
            <a className="latest-evidence" href={latest.sourceUrl} target="_blank" rel="noreferrer">
              <div>
                <span>{copy.latestEvidence}</span>
                <strong>{latest.author} · {formatDate(latest.dateTime, false)}</strong>
              </div>
              <b>{copy.confirmed} ↗</b>
            </a>
            <p className="forecast-note">{copy.noGuarantee}</p>
          </aside>
        </section>

        <section className="history-section">
          <div className="container">
            <div className="section-heading">
              <div>
                <p>{copy.recent}</p>
                <h2>{copy.recentBody}</h2>
              </div>
              <span>{resets.length}</span>
            </div>
            <div className="reset-list">
              {resets.slice(0, 4).map((event, index) => (
                <a key={event.id} className="reset-row" href={event.sourceUrl} target="_blank" rel="noreferrer">
                  <time>{formatDate(event.dateTime, false)}</time>
                  <div>
                    <span>{index === 0 ? copy.confirmed : `0${index + 1}`}</span>
                    <strong>{local(event.title, language)}</strong>
                    <small>{copy.scope} · {local(event.scope, language)}</small>
                  </div>
                  <b>{copy.source} ↗</b>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="container">
        <span>© 2026 Tibo Bless</span>
        <span>{copy.snapshot} · {formatDate(monitorData.generatedAt, false)}</span>
        <span>{copy.disclaimer}</span>
      </footer>
    </div>
  );
}

function Probability({ value, label }: { value: number; label: string }) {
  return (
    <div className="probability">
      <span>{label}</span>
      <strong>{value}<small>%</small></strong>
      <i aria-hidden="true"><b style={{ width: `${value}%` }} /></i>
    </div>
  );
}
