"use client";
/* eslint-disable @next/next/no-img-element -- profile photos are locally bundled public assets. */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildForecast } from "@/lib/monitor-logic";
import { monitorData, type Localized, type MonitorSnapshot, type ResetEvent, type Signal } from "./monitor-data";

type Language = "ko" | "en";
type TimelineItem = { kind: "reset"; item: ResetEvent } | { kind: "signal"; item: Signal };
type LiveMonitorMeta = {
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  status: string;
  error: string | null;
};

const labels = {
  ko: {
    brand: "티보의 은총",
    language: "EN",
    switchLanguage: "영어로 보기",
    heroTitle: "티보의 다음\n은총은 언제?",
    lastReset: "마지막 은총 후",
    lastResetHint: "마지막 은총 날짜",
    nextReset: "은총 받을 확률",
    hours24: "24시간 안",
    hours48: "48시간 안",
    latestEvidence: "은총을 하사하시니",
    confirmed: "은총 기록",
    source: "원문 보기",
    analysis: "산출 근거 보기",
    closeAnalysis: "산출 근거 닫기",
    analysisTitle: "은총 확률은 이렇게 나왔어요",
    analysisIntro: "확인된 은총의 흐름을 먼저 보고, 마지막 은총 뒤에 나온 새 신호만 반영해요.",
    baseline: "기본 확률",
    baselineBody: "새 신호가 없다면 24시간 14%, 48시간 26%에서 시작해요.",
    signalAdjustment: "새로운 예고",
    signalBody: "마지막 은총 뒤에 나온 아직 유효한 신호만 더하거나 빼요.",
    finalEstimate: "최종 확률",
    finalBody: "기본 확률과 신호 점수를 합쳐 지금의 24·48시간 확률을 보여줘요.",
    timeline: "기쁘다 구주 오셨네",
    timelineBody: "좌우로 넘겨 티보의 은총을 확인해 보세요.",
    previous: "이전 기록",
    next: "다음 기록",
    replySignal: "X 예고 신호",
    parentPost: "답글을 단 글",
    impact: "당시 영향",
    scope: "대상",
    how: "은총 예측 원리",
    coverage: "은총 레이더",
    evidence: "검토한 근거",
    resetEvents: "확인된 리셋",
    archive: "기록 범위",
    refresh: "갱신 방식",
    days: "일",
    everyFourHours: "4시간마다",
    sources: "구세주 목록",
    referenceAccounts: "참고 계정",
    snapshot: "데이터 기준",
    disclaimer: "OpenAI와 관련 없는 독립 프로젝트예요.",
    now: "현재",
    history: "기록",
    info: "안내",
    mobileNav: "빠른 이동",
  },
  en: {
    brand: "Tibo Bless",
    language: "KO",
    switchLanguage: "한국어로 보기",
    heroTitle: "When is Tibo’s next blessing?",
    lastReset: "Since the last blessing",
    lastResetHint: "Last mercy date",
    nextReset: "Chance of mercy",
    hours24: "Within 24h",
    hours48: "Within 48h",
    latestEvidence: "Mercy was bestowed",
    confirmed: "Mercy record",
    source: "View source",
    analysis: "View analysis",
    closeAnalysis: "Close analysis",
    analysisTitle: "How we got this chance",
    analysisIntro: "Start with the flow of confirmed mercy, then apply only new hints since the last one.",
    baseline: "Base chance",
    baselineBody: "With no new hint, start at 14% for 24 hours and 26% for 48 hours.",
    signalAdjustment: "New hints",
    signalBody: "Only active hints posted after the last mercy can move the chance up or down.",
    finalEstimate: "Final chance",
    finalBody: "Combine the base chance and hint points into the current 24h and 48h chance.",
    timeline: "Joy to the world, mercy has come",
    timelineBody: "Swipe sideways to follow Tibo’s moments of mercy.",
    previous: "Previous entry",
    next: "Next entry",
    replySignal: "X forecast signal",
    parentPost: "Post being replied to",
    impact: "Impact at the time",
    scope: "Scope",
    how: "How it works",
    coverage: "Mercy radar",
    evidence: "Evidence assessed",
    resetEvents: "Reset events",
    archive: "Archive window",
    refresh: "Refresh",
    days: "days",
    everyFourHours: "Every 4h",
    sources: "Savior list",
    referenceAccounts: "Reference accounts",
    snapshot: "Data as of",
    disclaimer: "An independent project not affiliated with OpenAI.",
    now: "Now",
    history: "Timeline",
    info: "About",
    mobileNav: "Quick navigation",
  },
} as const;

const howItWorks: { title: Localized; body: Localized }[] = [
  { title: { ko: "공개 신호 수집", en: "Collect public signals" }, body: { ko: "주요 계정의 게시물과 답글을 모아요.", en: "Gather posts and replies from key accounts." } },
  { title: { ko: "뜻을 구분", en: "Separate the meaning" }, body: { ko: "실제 은총, 예고, 농담과 요청을 나눠요.", en: "Distinguish mercy, hints, jokes, and requests." } },
  { title: { ko: "확률 업데이트", en: "Update the chance" }, body: { ko: "기본 확률에 아직 유효한 새 신호만 더하거나 빼요.", en: "Add or subtract only active new hints from the base chance." } },
  { title: { ko: "원문 보존", en: "Preserve the source" }, body: { ko: "모든 판단에서 원문을 바로 확인할 수 있어요.", en: "Keep every original source one tap away." } },
];

const monitoredSources = [
  { name: "Tibo Sottiaux", handle: "@thsottiaux", avatar: "/people/tibo.jpg?v=10", role: { ko: "최우선 구세주", en: "Priority savior" }, url: "https://x.com/thsottiaux" },
  { name: "OpenAI", handle: "@OpenAI", avatar: "/people/openai.jpg?v=10", role: { ko: "공식 계정", en: "Official account" }, url: "https://x.com/OpenAI" },
  { name: "Romain Huet", handle: "@romainhuet", avatar: "/people/romain.jpg?v=10", role: { ko: "개발자 경험", en: "Developer experience" }, url: "https://x.com/romainhuet" },
  { name: "Greg Brockman", handle: "@gdb", avatar: "/people/greg.jpg?v=10", role: { ko: "OpenAI 공동 창업자", en: "OpenAI co-founder" }, url: "https://x.com/gdb" },
  { name: "Sam Altman", handle: "@sama", avatar: "/people/sam.jpg?v=10", role: { ko: "OpenAI CEO", en: "OpenAI CEO" }, url: "https://x.com/sama" },
] as const;

function local(value: Localized, language: Language) {
  return value[language];
}

function signed(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function sourceAvatar(author: string) {
  return author.toLowerCase().includes("tibo") ? "/people/tibo.jpg?v=10" : "/people/openai.jpg?v=10";
}

function formatUtcDate(value: string, language: Language, includeTime = true) {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const dateLabel = language === "ko"
    ? `${year}년 ${month + 1}월 ${day}일`
    : `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month]} ${String(day).padStart(2, "0")}, ${year}`;
  return includeTime
    ? `${dateLabel} ${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")} UTC`
    : dateLabel;
}

export function TiboBless() {
  const [language, setLanguage] = useState<Language>("ko");
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [liveData, setLiveData] = useState<MonitorSnapshot>(monitorData);
  const [liveMeta, setLiveMeta] = useState<LiveMonitorMeta | null>(null);
  const copy = labels[language];
  const [now, setNow] = useState(() => new Date(monitorData.generatedAt));
  const forecast = useMemo(() => buildForecast(liveData, now), [liveData, now]);
  const resets = useMemo(
    () => [...liveData.events].sort((a, b) => b.dateTime.localeCompare(a.dateTime)),
    [liveData.events],
  );
  const timeline = useMemo<TimelineItem[]>(() => [
    ...liveData.events.map((item) => ({ kind: "reset" as const, item })),
    ...liveData.signals.map((item) => ({ kind: "signal" as const, item })),
  ].sort((a, b) => {
    const aDate = a.kind === "reset" ? a.item.dateTime : a.item.createdAt;
    const bDate = b.kind === "reset" ? b.item.dateTime : b.item.createdAt;
    return aDate.localeCompare(bDate);
  }), [liveData.events, liveData.signals]);
  const [selectedTimeline, setSelectedTimeline] = useState(() => Math.max(0, timeline.length - 1));
  const timelineViewport = useRef<HTMLDivElement>(null);
  const timelineCards = useRef<(HTMLElement | null)[]>([]);
  const timelineReady = useRef(false);
  const timelineTimer = useRef<number | undefined>(undefined);
  const latest = resets[0];

  useEffect(() => {
    const saved = window.localStorage.getItem("tibo-bless-language");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate the saved language after SSR
    if (saved === "ko" || saved === "en") setLanguage(saved);
    setNow(new Date());
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("tibo-bless-language", language);
  }, [language]);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/monitor", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Monitor refresh failed");
        return response.json() as Promise<{ snapshot: MonitorSnapshot; meta: LiveMonitorMeta }>;
      })
      .then(({ snapshot, meta }) => {
        if (!active || !snapshot?.events?.length) return;
        setLiveData(snapshot);
        setLiveMeta(meta);
        setSelectedTimeline(Math.max(0, snapshot.events.length + snapshot.signals.length - 1));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const viewport = timelineViewport.current;
    const card = timelineCards.current[selectedTimeline];
    if (!viewport || !card) return;
    timelineReady.current = false;
    window.clearTimeout(timelineTimer.current);
    viewport.scrollTo({
      left: card.offsetLeft - (viewport.clientWidth - card.clientWidth) / 2,
      behavior: timelineTimer.current === undefined ? "auto" : "smooth",
    });
    timelineTimer.current = window.setTimeout(() => {
      timelineReady.current = true;
    }, 420);
    return () => window.clearTimeout(timelineTimer.current);
  }, [selectedTimeline]);

  useEffect(() => {
    if (!analysisOpen) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAnalysisOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [analysisOpen]);

  const elapsedHours = Math.max(0, (now.getTime() - new Date(latest.dateTime).getTime()) / 3_600_000);
  const elapsedAmount = elapsedHours >= 48 ? Math.floor(elapsedHours / 24) : Math.floor(elapsedHours);
  const elapsed = language === "ko"
    ? `${elapsedAmount}${elapsedHours >= 48 ? "일" : "시간"}`
    : `${elapsedAmount} ${elapsedHours >= 48 ? `day${elapsedAmount === 1 ? "" : "s"}` : `hour${elapsedAmount === 1 ? "" : "s"}`}`;
  const archiveDays = Math.ceil((new Date(latest.dateTime).getTime() - new Date(resets.at(-1)!.dateTime).getTime()) / 86_400_000);

  const formatDate = (date: string, includeTime = true) => formatUtcDate(date, language, includeTime);

  const moveTimeline = (direction: -1 | 1) => {
    setSelectedTimeline((current) => Math.min(timeline.length - 1, Math.max(0, current + direction)));
  };

  const syncTimelineSelection = () => {
    if (!timelineReady.current) return;
    const viewport = timelineViewport.current;
    if (!viewport) return;
    const center = viewport.getBoundingClientRect().left + viewport.clientWidth / 2;
    let nearest = selectedTimeline;
    let distance = Number.POSITIVE_INFINITY;
    timelineCards.current.forEach((card, index) => {
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const nextDistance = Math.abs(rect.left + rect.width / 2 - center);
      if (nextDistance < distance) {
        distance = nextDistance;
        nearest = index;
      }
    });
    if (nearest !== selectedTimeline) setSelectedTimeline(nearest);
  };

  return (
    <div className="site-shell">
      <header className="top-nav container">
        <Link className="wordmark" href="/" aria-label={`${copy.brand} home`}>
          <img className="brand-logo" src="/tibo-bless-logo.png" alt="" width="52" height="52" />
          <strong>{copy.brand}</strong>
        </Link>
        <button
          className="language-button"
          type="button"
          aria-label={copy.switchLanguage}
          onClick={() => setLanguage((current) => current === "ko" ? "en" : "ko")}
        >
          {copy.language}
        </button>
      </header>

      <main>
        <section className="hero container" id="status">
          <div className="hero-copy">
            <h1>{copy.heroTitle.split("\n").map((line) => <span key={line}>{line}</span>)}</h1>
            <div className="reset-clock">
              <div>
                <span>{copy.lastReset}</span>
                <small>{copy.lastResetHint} · {formatDate(latest.dateTime)}</small>
              </div>
              <strong>{elapsed}</strong>
            </div>
            <div className="reference-strip" aria-label={copy.referenceAccounts}>
              <span>{copy.referenceAccounts}</span>
              <div>{monitoredSources.slice(0, 3).map((source) => <img key={source.handle} src={source.avatar} alt={source.name} />)}</div>
              <small>Tibo · OpenAI · Romain</small>
            </div>
          </div>

          <aside className="forecast-card" aria-label={copy.nextReset}>
            <div className="forecast-heading">
              <div><span>{copy.nextReset}</span></div>
            </div>
            <div className="probability-grid">
              <Probability value={forecast.score24h} label={copy.hours24} />
              <Probability value={forecast.score48h} label={copy.hours48} />
            </div>
            <button className="analysis-trigger" type="button" onClick={() => setAnalysisOpen(true)}>
              <span>{copy.analysis}</span><ArrowIcon />
            </button>
            <a className="latest-evidence" href={latest.sourceUrl} target="_blank" rel="noreferrer">
              <div>
                <span>{copy.latestEvidence}</span>
                <strong>{latest.author} · {formatDate(latest.dateTime, false)}</strong>
              </div>
              <b>{copy.confirmed} ↗</b>
            </a>
          </aside>
        </section>

        <section className="timeline-section" id="timeline">
          <div className="container section-heading">
            <div>
              <p>{copy.timeline}</p>
              <h2>{copy.timelineBody}</h2>
            </div>
            <span>{timeline.length}</span>
          </div>
          <div className="timeline-shell">
            <button className="timeline-nav timeline-nav-left" type="button" aria-label={copy.previous} disabled={selectedTimeline === 0} onClick={() => moveTimeline(-1)}>
              <ChevronIcon direction="left" />
            </button>
            <div className="timeline-viewport" ref={timelineViewport} onScroll={syncTimelineSelection}>
              <div className="timeline-track">
                {timeline.map((entry, index) => (
                  <article
                    key={entry.item.id}
                    className={`timeline-card ${entry.kind === "signal" ? "is-signal" : "is-reset"} ${index === selectedTimeline ? "is-selected" : ""}`}
                    ref={(element) => { timelineCards.current[index] = element; }}
                  >
                    {entry.kind === "reset" ? (
                      <ResetTimelineCard event={entry.item} language={language} copy={copy} formatDate={formatDate} />
                    ) : (
                      <SignalTimelineCard signal={entry.item} language={language} copy={copy} formatDate={formatDate} />
                    )}
                  </article>
                ))}
              </div>
            </div>
            <button className="timeline-nav timeline-nav-right" type="button" aria-label={copy.next} disabled={selectedTimeline === timeline.length - 1} onClick={() => moveTimeline(1)}>
              <ChevronIcon direction="right" />
            </button>
          </div>
        </section>

        <section className="info-section" id="info">
          <div className="container info-stack">
            <div className="info-block">
              <div className="section-heading compact">
                <div><p>{copy.how}</p></div>
              </div>
              <ol className="how-grid">
                {howItWorks.map((step, index) => (
                  <li key={step.title.en}><span>{index + 1}</span><div><h3>{local(step.title, language)}</h3><p>{local(step.body, language)}</p></div></li>
                ))}
              </ol>
            </div>

            <div className="info-block">
              <div className="section-heading compact">
                <div><p>{copy.coverage}</p></div>
              </div>
              <dl className="coverage-grid">
                <div><dt>{copy.evidence}</dt><dd>{liveData.events.length + liveData.signals.length}</dd></div>
                <div><dt>{copy.resetEvents}</dt><dd>{liveData.events.length}</dd></div>
                <div><dt>{copy.archive}</dt><dd>{archiveDays}<small>{copy.days}</small></dd></div>
                <div><dt>{copy.refresh}</dt><dd className="coverage-word">{copy.everyFourHours}</dd></div>
              </dl>
            </div>

            <div className="info-block sources-block">
              <div className="section-heading compact">
                <div><p>{copy.sources}</p></div>
              </div>
              <div className="sources-grid">
                {monitoredSources.map((source) => (
                  <a key={source.handle} href={source.url} target="_blank" rel="noreferrer" className="source-card">
                    <img className="source-avatar" src={source.avatar} alt={source.name} />
                    <span><strong>{source.name}</strong><small>{source.handle} · {local(source.role, language)}</small></span>
                    <b>↗</b>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="container">
        <span>© 2026 {copy.brand}</span>
        <span>{copy.snapshot} · {formatDate(liveMeta?.lastSuccessAt ?? liveData.generatedAt, false)}</span>
        <span>{copy.disclaimer}</span>
      </footer>

      <nav className="mobile-dock" aria-label={copy.mobileNav}>
        <a className="is-active" href="#status"><NowIcon /><span>{copy.now}</span></a>
        <a href="#timeline"><HistoryIcon /><span>{copy.history}</span></a>
        <a href="#info"><InfoIcon /><span>{copy.info}</span></a>
      </nav>

      {analysisOpen && (
        <div className="analysis-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setAnalysisOpen(false);
        }}>
          <section className="analysis-modal" role="dialog" aria-modal="true" aria-labelledby="analysis-title">
            <button className="modal-close" type="button" aria-label={copy.closeAnalysis} onClick={() => setAnalysisOpen(false)}>×</button>
            <p className="modal-kicker">MERCY ANALYSIS</p>
            <h2 id="analysis-title">{copy.analysisTitle}</h2>
            <p className="modal-intro">{copy.analysisIntro}</p>
            <div className="analysis-easy-steps">
              <article><span>1</span><div><b>{copy.baseline}</b><p>{copy.baselineBody}</p><strong>24h 14% · 48h 26%</strong></div></article>
              <article><span>2</span><div><b>{copy.signalAdjustment}</b><p>{copy.signalBody}</p><strong>24h {signed(forecast.adjustment24h)}pt · 48h {signed(forecast.adjustment48h)}pt</strong></div></article>
              <article><span>3</span><div><b>{copy.finalEstimate}</b><p>{copy.finalBody}</p><strong>24h {forecast.score24h}% · 48h {forecast.score48h}%</strong></div></article>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Probability({ value, label }: { value: number; label: string }) {
  return <div className="probability"><span>{label}</span><strong>{value}<small>%</small></strong><i aria-hidden="true"><b style={{ width: `${value}%` }} /></i></div>;
}

function ResetTimelineCard({ event, language, copy, formatDate }: {
  event: ResetEvent;
  language: Language;
  copy: typeof labels[Language];
  formatDate: (date: string, includeTime?: boolean) => string;
}) {
  return (
    <>
      <div className="timeline-card-head">
        <img className="timeline-avatar" src={sourceAvatar(event.author)} alt={event.author} />
        <span><strong>{event.author}</strong><small>{formatDate(event.dateTime)}</small></span>
        <b className="event-badge">{copy.confirmed}</b>
      </div>
      <div className="timeline-card-body">
        <h3>{local(event.title, language)}</h3>
        <p>{local(event.reason, language)}</p>
        <small>{copy.scope} · {local(event.scope, language)}</small>
      </div>
      <a className="timeline-source" href={event.sourceUrl} target="_blank" rel="noreferrer">{copy.source}<span>↗</span></a>
    </>
  );
}

function SignalTimelineCard({ signal, language, copy, formatDate }: {
  signal: Signal;
  language: Language;
  copy: typeof labels[Language];
  formatDate: (date: string, includeTime?: boolean) => string;
}) {
  return (
    <>
      <div className="timeline-card-head">
        <img className="timeline-avatar" src="/people/tibo.jpg?v=10" alt="Tibo Sottiaux" />
        <span><strong>{signal.author}</strong><small>{signal.handle} · {formatDate(signal.createdAt)}</small></span>
        <b className="signal-badge">{copy.replySignal}</b>
      </div>
      <div className="parent-post"><span>{copy.parentPost}</span><p>{local(signal.parentText, language)}</p></div>
      <blockquote>“{signal.text}”</blockquote>
      <div className="signal-impact"><span>{copy.impact}</span><strong>24h {signed(signal.impact24h)}pt</strong><strong>48h {signed(signal.impact48h)}pt</strong></div>
      <a className="timeline-source" href={signal.sourceUrl} target="_blank" rel="noreferrer">{copy.source}<span>↗</span></a>
    </>
  );
}

function NowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 10.5 12 5l7 5.5V19H5v-8.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M9.5 19v-5h5v5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
}

function HistoryIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 7h14M5 12h14M5 17h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function InfoIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" /><path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" style={{ transform: direction === "right" ? "rotate(180deg)" : undefined }}><path d="m14.5 5-7 7 7 7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
