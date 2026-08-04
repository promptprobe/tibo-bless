"use client";

import { useEffect, useMemo, useState } from "react";
import { buildForecast, buildMercyCalendar, evaluateCapability, evaluateJuice, predictionPerformance } from "@/lib/monitor-logic";
import { monitorData, type Localized } from "./monitor-data";

type Language = "ko" | "en";
type View = "reset" | "juice" | "capability";
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const labels = {
  ko: {
    reset: "리셋", juice: "Juice", capability: "역량", alerts: "알림", installApp: "앱 설치", installHint: "브라우저 메뉴에서 ‘홈 화면에 추가’ 또는 ‘앱 설치’를 선택하세요.", language: "EN",
    eyebrow: "공개 근거 기반 CODEX 모니터", heroTitle: "Tibo의 자비는\n언제 올까요?",
    heroBody: "공개 게시물의 표현, 범위, 시점을 분류해 글로벌 Codex 리셋과 다음 24·48시간 가능성을 추적합니다.",
    heroCta: "최신 근거 보기", verified: "검증된 공개 근거", noGuarantee: "실험적 확률 · 보장값 아님",
    nextReset: "다음 리셋 가능성", lastReset: "마지막 확정 리셋", since: "경과", hours24: "24시간", hours48: "48시간",
    analysis: "계산 근거", trackRecord: "예측 기록", forecastReason: "왜 이 확률인가요?",
    baseline: "활성 예측 신호가 없어 보수적인 과거 리셋 간격 기준을 사용합니다.",
    waitingKicker: "THE WAITING GAME", waitingTitle: "우리는 기다렸고, Tibo는 리셋했다.", waitingBody: "최근 26주를 한눈에 봅니다. 검은 칸은 자비가 온 날, 숫자는 하루에 여러 번 리셋된 날입니다.",
    mercyDays: "자비가 온 날", currentWait: "현재 기다림", longestWait: "최장 기다림", less: "기다림", more: "자비", noReset: "리셋 없음", resetsOnDay: "회 리셋", calendarHint: "리셋된 날짜를 누르면 공개 근거로 이동합니다.",
    sourceLedger: "출처를 보존하는 공개 장부", timeline: "리셋 타임라인", timelineBody: "확정 리셋과 확률을 바꾼 공개 신호. 최신 항목부터 표시합니다.",
    confirmed: "확정 리셋", signal: "공개 신호", source: "원문 보기", scope: "범위",
    evidenceKicker: "최신 검증 근거", evidenceTitle: "완료형 + 광범위 범위", evidenceBody: "기대, 요청, 개인 한도가 아니라 광범위한 사용자에게 완료된 리셋이라고 명시해야 확정합니다.", whyConfirmed: "확정 이유",
    pipeline: "투명한 판정 파이프라인", how: "판정은 네 단계로 끝납니다.",
    steps: [["수집", "승인한 계정의 공개 게시물과 답글을 정기 조회합니다."], ["분류", "완료된 광범위 리셋, 미래 신호, 요청과 잡음을 나눕니다."], ["계산", "과거 간격의 위험률에 아직 유효한 신호만 더합니다."], ["보존", "표시되는 판단에 원문 링크와 이유를 남깁니다."]],
    juiceEyebrow: "매일 같은 조건으로 측정", juiceTitle: "여섯 effort의\nCodex Juice", juiceStable: "현재 변경 없음", juiceStableBody: "마지막 완전 sweep이 이전 측정과 같습니다.", lastChecked: "마지막 완전 sweep", effortComparison: "reasoning effort 비교", recent: "최근 측정", meaning: "이 숫자의 의미", juiceMeaning: "같은 커뮤니티 probe를 새 Codex 세션의 각 effort에 실행합니다. 여섯 값이 모두 수집된 sweep만 비교합니다.", communityMetric: "Juice는 공식 OpenAI 지표나 품질 점수가 아닙니다.",
    capabilityEyebrow: "독립 벤치마크 관측", capabilityTitle: "Codex가\n나빠지고 있나요?", stale: "신선한 데이터 대기", staleBody: "스냅샷이 6시간을 넘으면 점수는 유지하고 결론은 보류합니다.", stable: "동반 저하 없음", declining: "동반 하락 감지", improving: "동반 상승 감지", bestMeasured: "최고 측정", radarIq: "Radar IQ", effortToday: "오늘 가장 높게 측정된 effort", effortBody: "높은 effort가 항상 더 좋은 것은 아닙니다. 같은 벤치마크의 현재 측정값만 비교합니다.", trend: "최근 방향", rule: "판정 규칙", capRule: "신선한 데이터에서 최소 세 effort가 함께 2점 이상 움직일 때만 동반 상승 또는 하락으로 표시합니다.",
    footerBody: "공개 근거를 검증하고, 불확실성은 그대로 보여주는 독립 Codex 모니터.", disclaimer: "OpenAI와 제휴하지 않음 · 확률은 실험적 추정치 · 한국어 / English 제공",
    days: "일", hours: "시간", hit: "적중률", cases: "회 중", passed: "회 임계값 통과", sample: "관측 간격", mean: "절사 평균", method: "방법", adjustment: "활성 신호 조정",
  },
  en: {
    reset: "Reset", juice: "Juice", capability: "Capability", alerts: "Alerts", installApp: "Install app", installHint: "Choose ‘Install app’ or ‘Add to Home Screen’ from your browser menu.", language: "KO",
    eyebrow: "PUBLIC-EVIDENCE CODEX MONITOR", heroTitle: "When will Tibo\nshow mercy?",
    heroBody: "We classify the wording, scope, and timing of public posts to track global Codex resets and the next 24/48-hour probability.",
    heroCta: "See latest evidence", verified: "Verified public evidence", noGuarantee: "Experimental probability · not a guarantee",
    nextReset: "Next reset probability", lastReset: "Latest confirmed reset", since: "Elapsed", hours24: "24 hours", hours48: "48 hours",
    analysis: "Calculation", trackRecord: "Track record", forecastReason: "Why this estimate?",
    baseline: "No active predictive signal remains, so the conservative historical reset-interval baseline is used.",
    waitingKicker: "THE WAITING GAME", waitingTitle: "We waited. Tibo reset.", waitingBody: "A 26-week view of the wait. Black means mercy arrived; a number marks multiple resets on the same day.",
    mercyDays: "Mercy days", currentWait: "Current wait", longestWait: "Longest wait", less: "Waiting", more: "Mercy", noReset: "No reset", resetsOnDay: "resets", calendarHint: "Select a reset day to open its public evidence.",
    sourceLedger: "SOURCE-PRESERVING PUBLIC LEDGER", timeline: "Reset timeline", timelineBody: "Confirmed resets and public signals that changed the estimate. Latest first.",
    confirmed: "Confirmed reset", signal: "Public signal", source: "View source", scope: "Scope",
    evidenceKicker: "LATEST VERIFIED EVIDENCE", evidenceTitle: "Completed action + broad scope", evidenceBody: "A post must describe a completed reset for a broad group—not a hope, request, or personal limit—to be confirmed.", whyConfirmed: "Why it is confirmed",
    pipeline: "TRANSPARENT DECISION PIPELINE", how: "Every decision ends in four steps.",
    steps: [["Collect", "Check public posts and replies from approved accounts on a schedule."], ["Classify", "Separate completed broad resets, future signals, requests, and noise."], ["Calculate", "Add only unexpired signals to the historical interval hazard."], ["Preserve", "Keep the original source and the reason behind every displayed decision."]],
    juiceEyebrow: "SAME CONDITIONS, EVERY DAY", juiceTitle: "Codex Juice across\nsix efforts", juiceStable: "No current change", juiceStableBody: "The latest complete sweep matches the previous measurement.", lastChecked: "Latest complete sweep", effortComparison: "Reasoning effort comparison", recent: "Recent measurements", meaning: "What this number means", juiceMeaning: "The same community probe runs in fresh Codex sessions at each effort. Only sweeps with all six values are compared.", communityMetric: "Juice is not an official OpenAI metric or a quality score.",
    capabilityEyebrow: "INDEPENDENT BENCHMARK OBSERVATION", capabilityTitle: "Is Codex\ngetting worse?", stale: "Waiting for fresh data", staleBody: "After six hours, scores remain visible but the current conclusion is withheld.", stable: "No broad decline", declining: "Broad decline detected", improving: "Broad improvement detected", bestMeasured: "Best measured", radarIq: "Radar IQ", effortToday: "Which effort measures best today?", effortBody: "Higher effort is not automatically better. This compares only current results on the same benchmark.", trend: "Recent direction", rule: "Decision rule", capRule: "Only mark a broad rise or decline when at least three efforts move together by two points or more in fresh data.",
    footerBody: "An independent Codex monitor that verifies public evidence and keeps uncertainty visible.", disclaimer: "Not affiliated with OpenAI · Experimental estimates · 한국어 / English",
    days: "days", hours: "hours", hit: "hit rate", cases: "of", passed: "crossed threshold", sample: "Intervals", mean: "trimmed mean", method: "Method", adjustment: "Active-signal adjustment",
  },
};

function local(value: Localized, language: Language) {
  return value[language];
}

export function TibosMercy() {
  const [language, setLanguage] = useState<Language>("ko");
  const [view, setView] = useState<View>("reset");
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const copy = labels[language];
  const now = useMemo(() => new Date(), []);
  const forecast = useMemo(() => buildForecast(monitorData, now), [now]);
  const performance = useMemo(() => predictionPerformance(monitorData.forecastHistory, monitorData.events), []);
  const juice = useMemo(() => evaluateJuice(monitorData.juiceSweeps), []);
  const capability = useMemo(() => evaluateCapability(monitorData.capability, now), [now]);
  const mercyCalendar = useMemo(() => buildMercyCalendar(monitorData.events, now, 26), [now]);
  const resets = useMemo(() => [...monitorData.events].sort((a, b) => b.dateTime.localeCompare(a.dateTime)), []);
  const latest = resets[0];

  useEffect(() => {
    const saved = window.localStorage.getItem("tibos-mercy-language");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate the user preference after SSR
    if (saved === "ko" || saved === "en") setLanguage(saved);
    const hash = window.location.hash.slice(1);
    if (hash === "reset" || hash === "juice" || hash === "capability") setView(hash);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("tibos-mercy-language", language);
  }, [language]);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    const clearInstallPrompt = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", clearInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", clearInstallPrompt);
    };
  }, []);

  const selectView = (next: View) => {
    setView(next);
    window.history.replaceState(null, "", `#${next}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleLanguage = () => setLanguage((current) => current === "ko" ? "en" : "ko");
  const elapsedHours = Math.max(0, (now.getTime() - new Date(latest.dateTime).getTime()) / 3_600_000);
  const elapsed = elapsedHours >= 48
    ? `${Math.floor(elapsedHours / 24)} ${copy.days}`
    : `${Math.floor(elapsedHours)} ${copy.hours}`;

  const formatDate = (date: string, includeTime = true) => new Intl.DateTimeFormat(language === "ko" ? "ko-KR" : "en-US", {
    year: "numeric", month: "short", day: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "UTC",
  }).format(new Date(date)) + (includeTime ? " UTC" : "");

  const enableAlerts = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification("Tibos Mercy", { body: language === "ko" ? "브라우저 알림이 켜졌습니다." : "Browser alerts are enabled." });
    }
  };

  const installApp = async () => {
    if (!installPrompt) {
      window.alert(copy.installHint);
      return;
    }
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <div className="site-shell">
      <header className="top-nav">
        <button className="wordmark" onClick={() => selectView("reset")} aria-label="Tibos Mercy home">
          <span className="brand-mark">TM</span><strong>Tibos Mercy</strong>
        </button>
        <nav className="nav-pill" aria-label="Monitor views">
          {(["reset", "juice", "capability"] as View[]).map((item) => (
            <button key={item} className={view === item ? "active" : ""} onClick={() => selectView(item)}>
              {copy[item]}<small>{item === "reset" ? `${forecast.score48h}%` : item === "juice" ? "Stable" : "Watch"}</small>
            </button>
          ))}
        </nav>
        <div className="nav-actions">
          <button className="button-secondary compact install-button" onClick={installApp}>{copy.installApp}</button>
          <button className="button-secondary compact alerts-button" onClick={enableAlerts}>{copy.alerts}</button>
          <button className="button-primary compact language-button" onClick={toggleLanguage} aria-label="Switch language">{copy.language}</button>
        </div>
      </header>

      <main>
        {view === "reset" && (
          <>
            <section className="hero-band container">
              <div className="hero-copy">
                <p className="kicker"><span className="status-dot" />{copy.eyebrow}</p>
                <h1>{copy.heroTitle.split("\n").map((line) => <span key={line}>{line}</span>)}</h1>
                <p className="hero-body">{copy.heroBody}</p>
                <div className="hero-actions">
                  <a className="button-primary" href="#evidence">{copy.heroCta}</a>
                  <span>{copy.verified}</span>
                </div>
              </div>
              <div className="hero-product-card" aria-label={copy.nextReset}>
                <div className="product-window-bar"><span /><span /><span /><b>tibos-mercy / reset</b></div>
                <div className="product-panel-head"><div><small>{copy.nextReset}</small><strong>{forecast.score48h}%</strong></div><span className="status-badge">LIVE</span></div>
                <div className="probability-grid">
                  <ProbabilityRing value={forecast.score24h} label={copy.hours24} />
                  <ProbabilityRing value={forecast.score48h} label={copy.hours48} />
                </div>
                <div className="product-evidence-row"><span className="avatar">T</span><div><strong>{latest.author}</strong><small>{formatDate(latest.dateTime, false)} · {local(latest.scope, language)}</small></div><b>✓</b></div>
                <p className="product-note">{copy.noGuarantee}</p>
              </div>
            </section>

            <section className="summary-band">
              <div className="container summary-grid">
                <article className="summary-card primary-summary"><span>{copy.since}</span><strong>{elapsed}</strong><small>{formatDate(latest.dateTime)}</small></article>
                <article className="summary-card"><span>{copy.hours24}</span><strong>{forecast.score24h}%</strong><small>{copy.nextReset}</small></article>
                <article className="summary-card"><span>{copy.hours48}</span><strong>{forecast.score48h}%</strong><small>{copy.nextReset}</small></article>
                <article className="summary-card"><span>{copy.trackRecord}</span><strong>{performance.hitRate ?? "—"}%</strong><small>{performance.hits} {copy.cases} {performance.eligible} {copy.passed}</small></article>
              </div>
            </section>

            <section className="section container forecast-explain">
              <div><p className="kicker">{copy.forecastReason}</p><h2>{copy.baseline}</h2></div>
              <button className="button-secondary" onClick={() => setAnalysisOpen(true)}>{copy.analysis} →</button>
            </section>

            <section className="section waiting-game-band" id="waiting-game">
              <div className="container">
                <div className="waiting-game-heading">
                  <div className="section-heading"><p className="kicker">{copy.waitingKicker}</p><h2>{copy.waitingTitle}</h2><p>{copy.waitingBody}</p></div>
                  <div className="waiting-stats" aria-label={copy.waitingKicker}>
                    <div><strong>{mercyCalendar.resetDays}</strong><span>{copy.mercyDays}</span></div>
                    <div><strong>{mercyCalendar.currentWaitDays ?? "—"}</strong><span>{copy.currentWait} · {copy.days}</span></div>
                    <div><strong>{mercyCalendar.longestWaitDays ?? "—"}</strong><span>{copy.longestWait} · {copy.days}</span></div>
                  </div>
                </div>
                <MercyHeatmap calendar={mercyCalendar} language={language} copy={copy} />
                <p className="calendar-hint">{copy.calendarHint}</p>
              </div>
            </section>

            <section className="section timeline-section" id="timeline">
              <div className="container">
                <div className="section-heading"><p className="kicker">{copy.sourceLedger}</p><h2>{copy.timeline}</h2><p>{copy.timelineBody}</p></div>
                <div className="timeline-grid">
                  {resets.slice(0, 6).map((event, index) => (
                    <article className={`event-card ${index === 0 ? "featured" : ""}`} key={event.id}>
                      <div className="event-top"><span className="status-badge">{copy.confirmed}</span><time>{formatDate(event.dateTime, false)}</time></div>
                      <h3>{local(event.title, language)}</h3>
                      <p className="quote">“{event.text}”</p>
                      <dl><div><dt>{copy.scope}</dt><dd>{local(event.scope, language)}</dd></div><div><dt>Source</dt><dd>{event.author}</dd></div></dl>
                      <a href={event.sourceUrl} target="_blank" rel="noreferrer">{copy.source} ↗</a>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="section container evidence-band" id="evidence">
              <div className="section-heading"><p className="kicker">{copy.evidenceKicker}</p><h2>{copy.evidenceTitle}</h2><p>{copy.evidenceBody}</p></div>
              <article className="evidence-product-card">
                <div className="evidence-author"><span className="avatar">T</span><div><strong>{latest.author}</strong><small>{formatDate(latest.dateTime)}</small></div><span className="status-badge">{copy.confirmed}</span></div>
                <blockquote>“{latest.text}”</blockquote>
                <div className="reason-box"><b>{copy.whyConfirmed}</b><p>{local(latest.reason, language)}</p></div>
                <a className="button-secondary" href={latest.sourceUrl} target="_blank" rel="noreferrer">{copy.source} ↗</a>
              </article>
            </section>

            <section className="section pipeline-band">
              <div className="container"><div className="section-heading"><p className="kicker">{copy.pipeline}</p><h2>{copy.how}</h2></div>
                <div className="feature-grid">{copy.steps.map(([title, body], index) => <article className="feature-card" key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
              </div>
            </section>
          </>
        )}

        {view === "juice" && (
          <>
            <section className="hero-band container subpage-hero">
              <div className="hero-copy"><p className="kicker">{copy.juiceEyebrow}</p><h1>{copy.juiceTitle.split("\n").map((line) => <span key={line}>{line}</span>)}</h1><div className="decision-callout"><b>{copy.juiceStable}</b><p>{copy.juiceStableBody}</p></div><small>{copy.lastChecked} · {juice.current ? formatDate(juice.current.checkedAt) : "—"}</small></div>
              <div className="hero-product-card measurement-card"><div className="product-window-bar"><span /><span /><span /><b>gpt-5.6-sol / sweep</b></div><p className="kicker">{copy.effortComparison}</p><JuiceBars values={juice.current?.values ?? {}} /></div>
            </section>
            <section className="section soft-band"><div className="container two-column"><div><div className="section-heading"><p className="kicker">CHANGE LOG</p><h2>{copy.recent}</h2></div><div className="change-list">{[...monitorData.juiceSweeps].reverse().map((sweep, index, array) => { const previous = array[index + 1]; const changes = previous ? Object.keys(sweep.values).filter((key) => sweep.values[key as keyof typeof sweep.values] !== previous.values[key as keyof typeof previous.values]) : []; return <article key={sweep.id}><time>{formatDate(sweep.checkedAt, false)}</time><b>{!previous ? "BASELINE" : changes.length ? `${changes.length} CHANGED` : "NO CHANGE"}</b><p>{!previous ? (language === "ko" ? "첫 완전 sweep" : "First complete sweep") : changes.length ? changes.join(", ") : (language === "ko" ? "모든 effort 동일" : "All efforts matched")}</p></article>; })}</div></div><aside className="explain-card"><span className="mini-icon">i</span><h3>{copy.meaning}</h3><p>{copy.juiceMeaning}</p><small>{copy.communityMetric}</small></aside></div></section>
          </>
        )}

        {view === "capability" && (
          <>
            <section className="hero-band container subpage-hero">
              <div className="hero-copy"><p className="kicker">{copy.capabilityEyebrow}</p><h1>{copy.capabilityTitle.split("\n").map((line) => <span key={line}>{line}</span>)}</h1><div className="decision-callout"><b>{copy[capability.verdict as keyof typeof copy] as string}</b><p>{capability.verdict === "stale" ? copy.staleBody : copy.capRule}</p></div></div>
              <div className="score-product-card"><div><span>{copy.bestMeasured}</span><strong>{capability.best?.name ?? "—"}</strong></div><div><span>{copy.radarIq}</span><strong>{capability.best?.score?.toFixed(1) ?? "—"}</strong><small>{capability.best?.tasks}/{monitorData.capability.totalTasks} tasks</small></div></div>
            </section>
            <section className="section soft-band"><div className="container"><div className="section-heading"><p className="kicker">{copy.effortComparison}</p><h2>{copy.effortToday}</h2><p>{copy.effortBody}</p></div><div className="capability-grid">{monitorData.capability.efforts.map((effort) => <article className={`capability-card ${effort.name === capability.best?.name ? "featured" : ""}`} key={effort.name}><div><h3>{effort.name}</h3><span>{effort.tasks == null ? (language === "ko" ? "결과 없음" : "No result") : `${effort.tasks}/${monitorData.capability.totalTasks}`}</span></div><strong>{effort.score?.toFixed(1) ?? "—"}</strong><small className={(effort.delta ?? 0) < 0 ? "negative" : ""}>{effort.delta == null ? (language === "ko" ? "대기" : "Pending") : `${effort.delta > 0 ? "+" : ""}${effort.delta.toFixed(1)} vs previous`}</small></article>)}</div></div></section>
            <section className="section container two-column trend-band"><div><div className="section-heading"><p className="kicker">{copy.trend}</p><h2>{capability.best?.name} capability</h2></div><TrendBars values={monitorData.capability.trend} /></div><aside className="explain-card"><span className="mini-icon">↗</span><h3>{copy.rule}</h3><p>{copy.capRule}</p><a href="https://codexradar.com/en/" target="_blank" rel="noreferrer">Codex Radar ↗</a></aside></section>
          </>
        )}
      </main>

      <footer className="dark-footer"><div className="container footer-grid"><div><div className="footer-wordmark"><span className="brand-mark">TM</span><strong>Tibos Mercy</strong></div><p>{copy.footerBody}</p></div><div><span>Monitor</span><button onClick={() => selectView("reset")}>{copy.reset}</button><button onClick={() => selectView("juice")}>{copy.juice}</button><button onClick={() => selectView("capability")}>{copy.capability}</button></div><div><span>Sources</span><a href="https://x.com/thsottiaux" target="_blank" rel="noreferrer">Tibo on X</a><a href="https://status.openai.com" target="_blank" rel="noreferrer">OpenAI Status</a><a href="https://codexradar.com/en/" target="_blank" rel="noreferrer">Codex Radar</a></div></div><div className="container footer-bottom"><span>© 2026 Tibos Mercy</span><span>{copy.disclaimer}</span><button onClick={toggleLanguage}>한국어 / English</button></div></footer>

      {analysisOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setAnalysisOpen(false)}><section className="analysis-modal" role="dialog" aria-modal="true" aria-label={copy.analysis} onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setAnalysisOpen(false)} aria-label="Close">×</button><p className="kicker">FORECAST ANALYSIS</p><h2>{copy.analysis}</h2><dl><div><dt>{copy.method}</dt><dd>{forecast.method}</dd></div><div><dt>{copy.sample}</dt><dd>{forecast.sampleSize}</dd></div><div><dt>{copy.mean}</dt><dd>{forecast.meanIntervalDays} days</dd></div><div><dt>{copy.adjustment}</dt><dd>24h {forecast.adjustment24h >= 0 ? "+" : ""}{forecast.adjustment24h}pt · 48h {forecast.adjustment48h >= 0 ? "+" : ""}{forecast.adjustment48h}pt</dd></div></dl><button className="button-primary" onClick={() => setAnalysisOpen(false)}>OK</button></section></div>}
    </div>
  );
}

function ProbabilityRing({ value, label }: { value: number; label: string }) {
  return <div className="probability-item"><div className="probability-ring" style={{ "--score": `${value * 3.6}deg` } as React.CSSProperties}><span>{value}%</span></div><small>{label}</small></div>;
}

function JuiceBars({ values }: { values: Record<string, number> }) {
  const maximum = Math.max(1, ...Object.values(values));
  return <div className="juice-bars">{["Low", "Medium", "High", "XHigh", "Max", "Ultra"].map((effort) => <div key={effort}><span>{effort}</span><i><b style={{ width: `${Math.max(3, ((values[effort] ?? 0) / maximum) * 100)}%` }} /></i><strong>{values[effort] ?? "—"}</strong></div>)}</div>;
}

function TrendBars({ values }: { values: number[] }) {
  const minimum = Math.min(...values) - 4;
  const maximum = Math.max(...values) + 2;
  return <div className="trend-chart" role="img" aria-label="Capability trend">{values.map((value, index) => <i key={`${value}-${index}`} style={{ height: `${Math.max(10, ((value - minimum) / (maximum - minimum)) * 100)}%` }}><span>{value.toFixed(1)}</span></i>)}</div>;
}

function MercyHeatmap({ calendar, language, copy }: { calendar: ReturnType<typeof buildMercyCalendar>; language: Language; copy: typeof labels.ko | typeof labels.en }) {
  const locale = language === "ko" ? "ko-KR" : "en-US";
  const monthLabels = calendar.weeks.map((week, index) => {
    const firstVisible = week.find((day) => !day.future);
    if (!firstVisible) return "";
    const month = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(new Date(`${firstVisible.date}T00:00:00Z`));
    if (index === 0) return month;
    const previous = calendar.weeks[index - 1].find((day) => !day.future);
    return previous?.date.slice(5, 7) === firstVisible.date.slice(5, 7) ? "" : month;
  });
  const dayLabels = language === "ko" ? ["일", "월", "화", "수", "목", "금", "토"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const describe = (day: (typeof calendar.days)[number]) => {
    const date = new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${day.date}T00:00:00Z`));
    return day.count ? `${date} · ${day.count} ${copy.resetsOnDay}` : `${date} · ${copy.noReset}`;
  };

  return <div className="heatmap-shell">
    <div className="heatmap-scroll" role="group" aria-label={copy.waitingTitle}>
      <div className="heatmap-months" aria-hidden="true"><span />{monthLabels.map((month, index) => <b key={`${month}-${index}`}>{month}</b>)}</div>
      <div className="heatmap-content">
        <div className="heatmap-weekdays" aria-hidden="true">{dayLabels.map((day) => <span key={day}>{day}</span>)}</div>
        <div className="heatmap-weeks">
          {calendar.weeks.map((week, weekIndex) => <div className="heatmap-week" key={weekIndex}>{week.map((day) => {
            const label = describe(day);
            if (day.future) return <span className="heatmap-day future" key={day.date} aria-hidden="true" />;
            if (day.count) return <a className={`heatmap-day mercy level-${Math.min(day.count, 2)}`} key={day.date} href={day.events[0].sourceUrl} target="_blank" rel="noreferrer" title={label} aria-label={label}>{day.count > 1 ? day.count : ""}</a>;
            return <span className="heatmap-day" key={day.date} title={label} aria-label={label} />;
          })}</div>)}
        </div>
      </div>
    </div>
    <div className="heatmap-legend" aria-hidden="true"><span>{copy.less}</span><i /><i className="mercy" /><i className="mercy level-2">2</i><span>{copy.more}</span></div>
  </div>;
}
