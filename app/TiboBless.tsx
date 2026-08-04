"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildForecast } from "@/lib/monitor-logic";
import { monitorData, type Localized, type MonitorSnapshot, type ResetEvent, type Signal } from "./monitor-data";

type Language = "ko" | "en";
type TimelineItem = { kind: "reset"; item: ResetEvent } | { kind: "signal"; item: Signal };
type LiveMonitorMeta = { lastSuccessAt: string | null; status: string };

const labels = {
  ko: {
    language: "EN",
    switchLanguage: "영어로 보기",
    heroTitle: "티보의 다음 은총은 언제?",
    lastReset: "마지막 은총 후",
    lastResetHint: "가장 최근에 확인된 리셋",
    nextReset: "다음 리셋 가능성",
    hours24: "24시간 안",
    hours48: "48시간 안",
    method: "예고 신호가 없을 때의 공개 기록 기준값이에요.",
    noGuarantee: "과거 기록을 설명하는 참고용 추정치이며, 실제 리셋을 보장하지 않아요.",
    latestEvidence: "가장 최근에 확인된 리셋",
    confirmed: "Confirmed Reset",
    publicData: "공개 기록",
    source: "원문 보기",
    analysis: "산출 근거 보기",
    closeAnalysis: "산출 근거 닫기",
    analysisTitle: "14%와 26%는 이렇게 계산해요",
    analysisIntro: "새로운 예고 신호가 없으면 공개 리셋 주기에서 보정한 기준값을 사용하고, 아직 유효한 X 신호의 영향만 더하거나 빼요.",
    baseline: "신호가 없을 때 기준값",
    signalAdjustment: "현재 유효한 신호 보정",
    finalEstimate: "현재 표시값",
    formula: "산출식",
    localRecord: "Tibo Bless 기록",
    localRecordBody: "확인된 리셋 간격은 기준값을 검토하는 보조 자료로 사용해요.",
    medianGap: "리셋 간격 중앙값",
    intervals: "확인한 간격",
    referenceCheck: "레퍼런스 분석 성과",
    referenceCheckBody: "48시간 예측이 있었던 리셋 6회 중 3회는 직전 예측이 30% 이상이었고, 리셋으로 이어지지 않은 고확률 구간은 1회였어요.",
    descriptive: "이 수치는 설명용 확률입니다. 미래의 리셋 시각을 약속하거나 보장하지 않습니다.",
    timeline: "최근 리셋 타임라인",
    timelineBody: "공개 X 신호와 확인된 리셋을 날짜순으로 모았어요. 좌우로 넘겨 흐름을 확인해보세요.",
    previous: "이전 기록",
    next: "다음 기록",
    replySignal: "X 예고 신호",
    parentPost: "답글을 단 글",
    impact: "당시 영향",
    scope: "대상",
    how: "어떻게 작동하나요?",
    howBody: "공개 근거를 모으고, 의미를 구분한 뒤, 재현 가능한 방식으로 확률에 반영해요.",
    coverage: "데이터 범위",
    coverageBody: "SpaceXAI X Search가 주요 계정의 공개 신호를 4시간마다 확인해요.",
    evidence: "검토한 근거",
    resetEvents: "확인된 리셋",
    archive: "기록 범위",
    refresh: "갱신 방식",
    days: "일",
    everyFourHours: "4시간마다",
    sources: "확인하는 계정",
    sourcesBody: "레퍼런스와 같은 주요 공개 계정을 우선 확인해요.",
    snapshot: "데이터 기준",
    disclaimer: "OpenAI와 관련 없는 독립 프로젝트예요.",
    now: "현재",
    history: "기록",
    info: "안내",
    mobileNav: "빠른 이동",
  },
  en: {
    language: "KO",
    switchLanguage: "한국어로 보기",
    heroTitle: "When is Tibo’s next blessing?",
    lastReset: "Since the last blessing",
    lastResetHint: "Most recently confirmed reset",
    nextReset: "Next reset probability",
    hours24: "Within 24h",
    hours48: "Within 48h",
    method: "The public-record baseline when there is no advance signal.",
    noGuarantee: "A descriptive estimate based on past records, not a promise of a reset.",
    latestEvidence: "Most recently confirmed reset",
    confirmed: "Confirmed Reset",
    publicData: "Public data",
    source: "View source",
    analysis: "View analysis",
    closeAnalysis: "Close analysis",
    analysisTitle: "How 14% and 26% are calculated",
    analysisIntro: "With no new advance signal, we use the public reset-cadence baseline, then add or subtract only active X-signal impacts.",
    baseline: "No-signal baseline",
    signalAdjustment: "Active signal adjustment",
    finalEstimate: "Current estimate",
    formula: "Formula",
    localRecord: "Tibo Bless records",
    localRecordBody: "Confirmed reset intervals are supporting context for reviewing the baseline.",
    medianGap: "Median reset gap",
    intervals: "Intervals reviewed",
    referenceCheck: "Reference analysis performance",
    referenceCheckBody: "Three of six resets with a prior 48h forecast were preceded by a 30%+ estimate; one settled elevated episode was not followed by a reset.",
    descriptive: "These are descriptive probabilities. They do not promise or guarantee a future reset time.",
    timeline: "Recent reset timeline",
    timelineBody: "Public X signals and confirmed resets, ordered by date. Move left or right to follow the sequence.",
    previous: "Previous entry",
    next: "Next entry",
    replySignal: "X forecast signal",
    parentPost: "Post being replied to",
    impact: "Impact at the time",
    scope: "Scope",
    how: "How it works",
    howBody: "We collect public evidence, classify its meaning, and apply it with a reproducible formula.",
    coverage: "Reset data coverage",
    coverageBody: "SpaceXAI X Search checks public signals from key accounts every four hours.",
    evidence: "Evidence assessed",
    resetEvents: "Reset events",
    archive: "Archive window",
    refresh: "Refresh",
    days: "days",
    everyFourHours: "Every 4h",
    sources: "Sources we monitor",
    sourcesBody: "We prioritize the same key public accounts as the reference monitor.",
    snapshot: "Data as of",
    disclaimer: "An independent project not affiliated with OpenAI.",
    now: "Now",
    history: "Timeline",
    info: "About",
    mobileNav: "Quick navigation",
  },
} as const;

const howItWorks: Localized[] = [
  { ko: "주요 계정의 공개 글과 확인된 리셋 기록을 모아요.", en: "Collect public posts and confirmed resets from key accounts." },
  { ko: "완료 여부, 적용 범위, 시점의 확실성을 나눠 판단해요.", en: "Classify completion, scope, timing, and confidence." },
  { ko: "유효한 신호의 가감점만 14%·26% 기준값에 반영해요.", en: "Apply only active signal points to the 14% / 26% baseline." },
  { ko: "누구나 다시 확인할 수 있도록 원문 링크를 남겨요.", en: "Preserve the original source so anyone can verify it." },
];

const monitoredSources = [
  { name: "Tibo Sottiaux", handle: "@thsottiaux", role: { ko: "최우선 소스", en: "Priority source" }, url: "https://x.com/thsottiaux" },
  { name: "OpenAI", handle: "@OpenAI", role: { ko: "공식 계정", en: "Official account" }, url: "https://x.com/OpenAI" },
  { name: "Romain Huet", handle: "@romainhuet", role: { ko: "개발자 경험", en: "Developer experience" }, url: "https://x.com/romainhuet" },
  { name: "Greg Brockman", handle: "@gdb", role: { ko: "OpenAI 공동 창업자", en: "OpenAI co-founder" }, url: "https://x.com/gdb" },
  { name: "Sam Altman", handle: "@sama", role: { ko: "OpenAI CEO", en: "OpenAI CEO" }, url: "https://x.com/sama" },
] as const;

function local(value: Localized, language: Language) {
  return value[language];
}

function signed(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

export function TiboBless() {
  const [language, setLanguage] = useState<Language>("ko");
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [liveData, setLiveData] = useState<MonitorSnapshot>(monitorData);
  const [liveMeta, setLiveMeta] = useState<LiveMonitorMeta | null>(null);
  const copy = labels[language];
  const now = useMemo(() => new Date(), []);
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
        <Link className="wordmark" href="/" aria-label="Tibo Bless home">
          {/* eslint-disable-next-line @next/next/no-img-element -- Cloudflare vinext does not provide Next's image optimizer in dev. */}
          <img className="brand-logo" src="/tibo-bless-logo.png" alt="" width="52" height="52" />
          <strong>Tibo Bless</strong>
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
            <h1>{copy.heroTitle}</h1>
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
            <p className="forecast-note">{copy.noGuarantee}</p>
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
                <div><p>{copy.how}</p><h2>{copy.howBody}</h2></div>
              </div>
              <ol className="how-grid">
                {howItWorks.map((step, index) => (
                  <li key={step.en}><span>{String(index + 1).padStart(2, "0")}</span><p>{local(step, language)}</p></li>
                ))}
              </ol>
            </div>

            <div className="info-block">
              <div className="section-heading compact">
                <div><p>{copy.coverage}</p><h2>{copy.coverageBody}</h2></div>
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
                <div><p>{copy.sources}</p><h2>{copy.sourcesBody}</h2></div>
              </div>
              <div className="sources-grid">
                {monitoredSources.map((source) => (
                  <a key={source.handle} href={source.url} target="_blank" rel="noreferrer" className="source-card">
                    <span className="source-avatar">{source.name.slice(0, 1)}</span>
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
        <span>© 2026 Tibo Bless</span>
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
            <p className="modal-kicker">Tibo Bless Analysis</p>
            <h2 id="analysis-title">{copy.analysisTitle}</h2>
            <p className="modal-intro">{copy.analysisIntro}</p>
            <div className="formula-card">
              <span>{copy.formula}</span>
              <code>P24 = clamp(14 + Σ signal24, 1, 95)</code>
              <code>P48 = clamp(max(P24, 26 + Σ signal48), 1, 98)</code>
            </div>
            <div className="analysis-math">
              <div><span>{copy.baseline}</span><strong>14% / 26%</strong></div>
              <div><span>{copy.signalAdjustment}</span><strong>{signed(forecast.adjustment24h)} / {signed(forecast.adjustment48h)}</strong></div>
              <div><span>{copy.finalEstimate}</span><strong>{forecast.score24h}% / {forecast.score48h}%</strong></div>
            </div>
            <div className="analysis-detail-grid">
              <div>
                <span>{copy.localRecord}</span>
                <p>{copy.localRecordBody}</p>
                <dl><div><dt>{copy.intervals}</dt><dd>{forecast.sampleSize}</dd></div><div><dt>{copy.medianGap}</dt><dd>{forecast.medianIntervalDays ?? "—"} {copy.days}</dd></div></dl>
              </div>
              <div>
                <span>{copy.referenceCheck}</span>
                <p>{copy.referenceCheckBody}</p>
                <a href="https://codexreset.org/#timeline" target="_blank" rel="noreferrer">codexreset.org ↗</a>
              </div>
            </div>
            <p className="analysis-disclaimer">{copy.descriptive}</p>
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
        <span className="timeline-avatar">{event.author.slice(0, 1)}</span>
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
        <span className="timeline-avatar">T</span>
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
