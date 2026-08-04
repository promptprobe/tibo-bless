"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buildForecast } from "@/lib/monitor-logic";
import { monitorData, type Localized } from "./monitor-data";

type Language = "ko" | "en";

const labels = {
  ko: {
    language: "EN",
    switchLanguage: "영어로 보기",
    monitor: "리셋 모니터",
    eyebrow: "CODEX RESET WATCH",
    heroTitle: "다음 리셋,\n언제 올까요?",
    heroBody: "공개된 리셋 기록을 바탕으로 앞으로 24시간과 48시간 안에 다시 리셋될 가능성을 보여드려요.",
    lastReset: "마지막 리셋 후",
    lastResetHint: "가장 최근에 확인된 시각",
    nextReset: "앞으로 리셋될 가능성",
    hours24: "24시간 안",
    hours48: "48시간 안",
    method: "지난 리셋 간격과 최근 공개 신호를 반영했어요.",
    noGuarantee: "참고용 추정치예요. 실제 리셋 시점은 달라질 수 있어요.",
    latestEvidence: "가장 최근에 확인된 리셋",
    confirmed: "확인됨",
    publicData: "공개 기록",
    source: "원문 보기",
    recent: "최근 리셋 기록",
    recentBody: "여러 사용자에게 실제로 적용된 것으로 확인된 리셋만 모았어요.",
    scope: "대상",
    snapshot: "데이터 기준",
    disclaimer: "OpenAI와 관련 없는 독립 프로젝트예요.",
    now: "현재",
    history: "기록",
    mobileNav: "빠른 이동",
    openLatest: "가장 최근 근거 열기",
  },
  en: {
    language: "KO",
    switchLanguage: "한국어로 보기",
    monitor: "Reset monitor",
    eyebrow: "CODEX RESET WATCH",
    heroTitle: "When might the\nnext reset land?",
    heroBody: "See the chance of another reset within 24 or 48 hours, based on verified public reset records.",
    lastReset: "Since the last reset",
    lastResetHint: "Most recently confirmed at",
    nextReset: "Next reset probability",
    hours24: "Within 24h",
    hours48: "Within 48h",
    method: "Based on past intervals and recent public signals.",
    noGuarantee: "An experimental estimate, not a guarantee of when a reset will happen.",
    latestEvidence: "Most recently confirmed reset",
    confirmed: "Confirmed",
    publicData: "Public data",
    source: "View source",
    recent: "Recent reset history",
    recentBody: "Only resets confirmed as completed for a broad group are included.",
    scope: "Scope",
    snapshot: "Data as of",
    disclaimer: "An independent project not affiliated with OpenAI.",
    now: "Now",
    history: "History",
    mobileNav: "Quick navigation",
    openLatest: "Open the latest source",
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
  const elapsedAmount = elapsedHours >= 48 ? Math.floor(elapsedHours / 24) : Math.floor(elapsedHours);
  const elapsed = language === "ko"
    ? `${elapsedAmount}${elapsedHours >= 48 ? "일" : "시간"}`
    : `${elapsedAmount} ${elapsedHours >= 48 ? `day${elapsedAmount === 1 ? "" : "s"}` : `hour${elapsedAmount === 1 ? "" : "s"}`}`;

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
          <span className="brand-copy">
            <strong>Tibo Bless</strong>
            <small>{copy.monitor}</small>
          </span>
        </Link>
        <div className="nav-actions">
          <span className="monitor-label"><i aria-hidden="true" />{copy.monitor}</span>
          <button
            type="button"
            aria-label={copy.switchLanguage}
            onClick={() => setLanguage((current) => current === "ko" ? "en" : "ko")}
          >
            {copy.language}
          </button>
        </div>
      </header>

      <main>
        <section className="hero container" id="status">
          <div className="hero-copy">
            <p className="eyebrow"><span />{copy.eyebrow}</p>
            <h1>{copy.heroTitle.split("\n").map((line) => <span key={line}>{line}</span>)}</h1>
            <p className="hero-body">{copy.heroBody}</p>
            <div className="reset-clock">
              <div>
                <span>{copy.lastReset}</span>
                <small>{copy.lastResetHint} · {formatDate(latest.dateTime)}</small>
              </div>
              <strong>{elapsed}</strong>
            </div>
          </div>

          <aside className="forecast-card" aria-label={copy.nextReset}>
            <div className="forecast-heading">
              <div>
                <span>{copy.nextReset}</span>
                <small>{copy.method}</small>
              </div>
              <b>{copy.publicData}</b>
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

        <section className="history-section" id="history">
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
                  <div className="reset-row-top">
                    <time>{formatDate(event.dateTime, false)}</time>
                    <span>{index === 0 ? copy.confirmed : `0${index + 1}`}</span>
                  </div>
                  <div className="reset-row-body">
                    <strong>{local(event.title, language)}</strong>
                    <small>{copy.scope} · {local(event.scope, language)}</small>
                  </div>
                  <b aria-hidden="true">↗</b>
                  <span className="sr-only">{copy.source}</span>
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

      <nav className="mobile-dock" aria-label={copy.mobileNav}>
        <a className="is-active" href="#status">
          <NowIcon />
          <span>{copy.now}</span>
        </a>
        <a href="#history">
          <HistoryIcon />
          <span>{copy.history}</span>
        </a>
        <a
          className="dock-source"
          href={latest.sourceUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={copy.openLatest}
        >
          <ArrowIcon />
        </a>
      </nav>
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

function NowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M5 10.5 12 5l7 5.5V19H5v-8.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9.5 19v-5h5v5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M5 7h14M5 12h14M5 17h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
