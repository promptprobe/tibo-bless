"use client";
/* eslint-disable @next/next/no-img-element -- profile photos are locally bundled public assets. */

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { buildForecast } from "@/lib/monitor-logic";
import { monitorData, type Localized, type MonitorSnapshot, type ResetEvent, type Signal } from "./monitor-data";

type Language = "ko" | "en";
type TimelineItem = { kind: "reset"; item: ResetEvent } | { kind: "signal"; item: Signal };
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};
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
    lastReset: "마지막 은총으로부터",
    lastResetHint: "마지막 은총 날짜",
    nextReset: "은총 받을 확률",
    hours24: "24시간 이내",
    hours48: "48시간 이내",
    latestEvidence: "은총을 하사하시니",
    confirmed: "은총 기록",
    source: "원문 보기",
    analysis: "산출 근거 보기",
    closeAnalysis: "산출 근거 닫기",
    analysisTitle: "은총 확률 산출 방법",
    analysisIntro: "새 신호가 없을 때의 고정 기준값에, 마지막 은총 이후 48시간 동안 유효한 구세주 시그널만 더하거나 빼요.",
    baseline: "고정 기준 확률",
    baselineBody: "24시간 14%, 48시간 26%는 레퍼런스 분석에서 정한 고정 기준값이에요. 기록이 늘거나 시간이 흐른다고 자동으로 오르지는 않아요.",
    signalAdjustment: "새로운 예고",
    signalBody: "마지막 은총 뒤에 나온 아직 유효한 신호만 더하거나 빼요.",
    finalEstimate: "최종 확률",
    finalBody: "기본 확률과 신호 점수를 합쳐 지금의 24·48시간 확률을 보여줘요.",
    pointRules: "시그널 포인트 산정 원리",
    pointRulePositive: "은총 시점 예고",
    pointRulePositiveBody: "리셋과 미래 시점이 함께 명시된 계시",
    pointRuleTentative: "가능성 암시",
    pointRuleTentativeBody: "시도 중이지만 확정하지 않은 답글",
    pointRuleNegative: "부정·진정 신호",
    pointRuleNegativeBody: "리셋을 부정하거나 기대를 낮추는 답글",
    pointRuleNeutral: "요청·농담",
    pointRuleNeutralBody: "구세주의 의도가 확인되지 않은 단순 요청",
    pointRuleReset: "은총 확정",
    pointRuleResetBody: "기존 시그널을 비우고 14%·26% 기준값으로 돌아감",
    scoreWindow: "유효 시간",
    scoreWindowBody: "시간 경과 자체에는 점수를 더하지 않으며, 마지막 은총 이후 작성된 시그널만 48시간 동안 반영합니다.",
    scoreFormula: "최종 확률 = 기본 확률 + 유효 시그널 포인트",
    pointDefinition: "pt는 퍼센트포인트예요. 예: 14%에 +3pt를 더하면 17%입니다.",
    timeline: "기쁘다 구주 오셨네",
    timelineBody: "좌우로 넘겨 티보의 은총을 확인해 보세요.",
    timelineLatest: "최근 은총",
    timelineConfirmed: "확인된 은총",
    timelineSignal: "확률 변경 시그널",
    timelineWindow: "기록 · 30일 범위",
    previous: "이전 기록",
    next: "다음 기록",
    replySignal: "X 예고 신호",
    parentPost: "답글을 단 글",
    signalDetails: "답글 전체 내용",
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
    alertTitle: "은총 소식 받기",
    alertBody: "티보의 은총을 이메일로 전달받기",
    alertPlaceholder: "you@example.com",
    alertSubmit: "이메일 알림 신청",
    alertSubmitting: "신청 중…",
    alertSuccess: "신청했어요. 다음 은총부터 알려드릴게요.",
    alertPendingSetup: "주소를 저장했어요. 발송 연결이 완료되면 다음 은총부터 알려드려요.",
    alertError: "신청하지 못했어요. 잠시 뒤 다시 시도해 주세요.",
    installTitle: "홈 화면에 Tibo Bless 추가",
    installBody: "GPT 로그인 없이 누구나 홈 화면에서 앱처럼 열 수 있어요.",
    installAction: "홈 화면에 추가",
    installIos: "Safari에서 공유 버튼을 누른 뒤 ‘홈 화면에 추가’를 선택하세요.",
    installAndroid: "Chrome 메뉴(⋮)에서 ‘홈 화면에 추가’ 또는 ‘앱 설치’를 선택하세요.",
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
    analysisIntro: "Start from fixed no-signal reference values, then add or subtract only savior signals that remain active for 48 hours after the latest mercy.",
    baseline: "Fixed baseline",
    baselineBody: "The 14% within 24 hours and 26% within 48 hours are fixed values adopted from the reference analysis. More records or elapsed time do not raise them automatically.",
    signalAdjustment: "New hints",
    signalBody: "Only active hints posted after the last mercy can move the chance up or down.",
    finalEstimate: "Final chance",
    finalBody: "Combine the base chance and hint points into the current 24h and 48h chance.",
    pointRules: "How signal points are assigned",
    pointRulePositive: "Timed mercy hint",
    pointRulePositiveBody: "A reset and a future time are stated together",
    pointRuleTentative: "Tentative hint",
    pointRuleTentativeBody: "Tibo is trying but does not confirm a reset",
    pointRuleNegative: "Negative signal",
    pointRuleNegativeBody: "A reply denies a reset or lowers expectations",
    pointRuleNeutral: "Request or joke",
    pointRuleNeutralBody: "A request with no confirmed intent from the savior",
    pointRuleReset: "Confirmed mercy",
    pointRuleResetBody: "Clear old signals and return to the 14% and 26% baseline",
    scoreWindow: "Active window",
    scoreWindowBody: "Elapsed time adds no points. Only signals posted after the latest mercy remain active, for 48 hours.",
    scoreFormula: "Final chance = base chance + active signal points",
    pointDefinition: "pt means percentage points. For example, 14% + 3pt = 17%.",
    timeline: "Joy to the world, mercy has come",
    timelineBody: "Swipe sideways to follow Tibo’s moments of mercy.",
    timelineLatest: "Latest mercy",
    timelineConfirmed: "Confirmed mercy",
    timelineSignal: "Forecast-changing signal",
    timelineWindow: "records · 30-day window",
    previous: "Previous entry",
    next: "Next entry",
    replySignal: "X forecast signal",
    parentPost: "Post being replied to",
    signalDetails: "Full reply content",
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
    alertTitle: "Get mercy alerts",
    alertBody: "Receive one email when the next mercy is confirmed.",
    alertPlaceholder: "you@example.com",
    alertSubmit: "Subscribe by email",
    alertSubmitting: "Subscribing…",
    alertSuccess: "Subscribed. We’ll email you after the next mercy.",
    alertPendingSetup: "Saved. Alerts will begin when mail delivery is connected.",
    alertError: "Could not subscribe. Please try again shortly.",
    installTitle: "Add Tibo Bless to your Home Screen",
    installBody: "Anyone can open it like an app—no GPT login required.",
    installAction: "Add to Home Screen",
    installIos: "In Safari, tap Share, then choose ‘Add to Home Screen.’",
    installAndroid: "In Chrome, open the ⋮ menu and choose ‘Add to Home screen’ or ‘Install app.’",
    snapshot: "Data as of",
    disclaimer: "An independent project not affiliated with OpenAI.",
    now: "Now",
    history: "Timeline",
    info: "About",
    mobileNav: "Quick navigation",
  },
} as const;

const howItWorks: { title: Localized; body: Localized }[] = [
  { title: { ko: "구세주 시그널 수집", en: "Collect savior signals" }, body: { ko: "구세주의 계시를 모아요.", en: "Gather revelations from the savior." } },
  { title: { ko: "계시 해석", en: "Interpret the revelation" }, body: { ko: "은총인지 아닌지 구분해요.", en: "Decide whether it is mercy or not." } },
  { title: { ko: "확률 업데이트", en: "Update the chance" }, body: { ko: "은총 가능성을 업데이트 해요.", en: "Update the chance of mercy." } },
  { title: { ko: "은총 기록 남기기", en: "Preserve the mercy" }, body: { ko: "구세주의 은총을 고이 간직해요.", en: "Keep the savior’s mercy safe." } },
];

const monitoredSources = [
  { name: "Tibo Sottiaux", handle: "@thsottiaux", avatar: "/people/tibo.jpg?v=10", role: { ko: "예수 그 자체", en: "Jesus himself" }, url: "https://x.com/thsottiaux" },
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

function formatTimelineDate(value: string, language: Language) {
  const date = new Date(value);
  const month = date.getUTCMonth();
  return {
    day: language === "ko"
      ? `${month + 1}월 ${date.getUTCDate()}일`
      : `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month]} ${String(date.getUTCDate()).padStart(2, "0")}`,
    time: `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")} UTC`,
  };
}

export function TiboBless() {
  const [language, setLanguage] = useState<Language>("ko");
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [alertEmail, setAlertEmail] = useState("");
  const [alertStatus, setAlertStatus] = useState<"idle" | "submitting" | "success" | "pending" | "error">("idle");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installHelpOpen, setInstallHelpOpen] = useState(false);
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
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setInstallPrompt(null);
      setInstallHelpOpen(false);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
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

  const subscribeToAlerts = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAlertStatus("submitting");
    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: alertEmail }),
      });
      const result = await response.json() as { ok?: boolean; mailReady?: boolean };
      if (!response.ok || !result.ok) throw new Error("Subscription failed");
      setAlertStatus(result.mailReady ? "success" : "pending");
    } catch {
      setAlertStatus("error");
    }
  };

  const requestInstall = async () => {
    if (!installPrompt) {
      setInstallHelpOpen((current) => !current);
      return;
    }
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstallPrompt(null);
        setInstallHelpOpen(false);
      } else {
        setInstallHelpOpen(true);
      }
    } catch {
      setInstallHelpOpen(true);
    }
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

        <section className="alert-panel container" aria-labelledby="alert-title">
          <div>
            <p id="alert-title">{copy.alertTitle}</p>
            <span>{copy.alertBody}</span>
          </div>
          <form onSubmit={subscribeToAlerts}>
            <label className="sr-only" htmlFor="alert-email">Email</label>
            <input
              id="alert-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              placeholder={copy.alertPlaceholder}
              value={alertEmail}
              onChange={(event) => { setAlertEmail(event.target.value); setAlertStatus("idle"); }}
            />
            <button type="submit" disabled={alertStatus === "submitting"}>
              {alertStatus === "submitting" ? copy.alertSubmitting : copy.alertSubmit}
            </button>
          </form>
          {alertStatus !== "idle" && alertStatus !== "submitting" && (
            <small role="status" className={alertStatus === "error" ? "is-error" : ""}>
              {alertStatus === "success" ? copy.alertSuccess : alertStatus === "pending" ? copy.alertPendingSetup : copy.alertError}
            </small>
          )}
        </section>

        <section className="install-panel container" aria-labelledby="install-title">
          <img src="/tibo-bless-icon-192.png" alt="" width="54" height="54" />
          <div className="install-copy">
            <p id="install-title">{copy.installTitle}</p>
            <span>{copy.installBody}</span>
          </div>
          <button
            type="button"
            aria-expanded={installHelpOpen}
            aria-controls="install-help"
            onClick={requestInstall}
          >
            {copy.installAction}
          </button>
          <div className="install-help" id="install-help" hidden={!installHelpOpen}>
            <p><b>iPhone</b><span>{copy.installIos}</span></p>
            <p><b>Android</b><span>{copy.installAndroid}</span></p>
          </div>
        </section>

        <section className="timeline-section" id="timeline">
          <div className="container section-heading">
            <div>
              <p>{copy.timeline}</p>
              <h2>{copy.timelineBody}</h2>
            </div>
            <span>{timeline.length}</span>
          </div>
          <div className="container timeline-meta" aria-label={copy.timelineWindow}>
            <span className="is-latest">● {copy.timelineLatest} · {formatTimelineDate(latest.dateTime, language).day}</span>
            <span>● {copy.timelineConfirmed}</span>
            <span className="is-signal">○ {copy.timelineSignal}</span>
            <b>{timeline.length} {copy.timelineWindow}</b>
          </div>
          <div className="timeline-shell">
            <button className="timeline-nav timeline-nav-left" type="button" aria-label={copy.previous} disabled={selectedTimeline === 0} onClick={() => moveTimeline(-1)}>
              <ChevronIcon direction="left" />
            </button>
            <div className="timeline-viewport" ref={timelineViewport} onScroll={syncTimelineSelection}>
              <div className="timeline-track">
                {timeline.map((entry, index) => {
                  const dateTime = entry.kind === "reset" ? entry.item.dateTime : entry.item.createdAt;
                  const timelineDate = formatTimelineDate(dateTime, language);
                  return (
                    <div
                      className={`timeline-entry ${index === selectedTimeline ? "is-selected" : ""}`}
                      key={entry.item.id}
                      ref={(element) => { timelineCards.current[index] = element; }}
                    >
                      <article
                        className={`timeline-card ${entry.kind === "signal" ? "is-signal" : "is-reset"} ${index === selectedTimeline ? "is-selected" : ""}`}
                      >
                        {entry.kind === "reset" ? (
                          <ResetTimelineCard event={entry.item} language={language} copy={copy} formatDate={formatDate} />
                        ) : (
                          <SignalTimelineCard signal={entry.item} copy={copy} formatDate={formatDate} />
                        )}
                      </article>
                      <time dateTime={dateTime}><i /><strong>{timelineDate.day}</strong><small>{timelineDate.time}</small></time>
                    </div>
                  );
                })}
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
            <section className="point-rules" aria-labelledby="point-rules-title">
              <h3 id="point-rules-title">{copy.pointRules}</h3>
              <div className="point-rule-list">
                <article><span><b>{copy.pointRulePositive}</b><small>{copy.pointRulePositiveBody}</small></span><strong>24h +21pt · 48h +17pt</strong></article>
                <article><span><b>{copy.pointRuleTentative}</b><small>{copy.pointRuleTentativeBody}</small></span><strong>24h +3pt · 48h +3pt</strong></article>
                <article><span><b>{copy.pointRuleNegative}</b><small>{copy.pointRuleNegativeBody}</small></span><strong>24h −2pt · 48h −3pt</strong></article>
                <article><span><b>{copy.pointRuleNeutral}</b><small>{copy.pointRuleNeutralBody}</small></span><strong>0pt</strong></article>
                <article><span><b>{copy.pointRuleReset}</b><small>{copy.pointRuleResetBody}</small></span><strong>RESET</strong></article>
              </div>
              <p><b>{copy.scoreWindow}</b> · {copy.scoreWindowBody}</p>
              <code>{copy.scoreFormula}</code>
              <p className="point-definition">{copy.pointDefinition}</p>
            </section>
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
        <p>{event.text}</p>
        <dl><div><dt>{copy.scope}</dt><dd>{local(event.scope, language)}</dd></div><div><dt>Source</dt><dd>{event.sourceUrl.includes("x.com/") ? `${event.author} on X` : event.author}</dd></div></dl>
      </div>
      <a className="timeline-source" href={event.sourceUrl} target="_blank" rel="noreferrer">{copy.source}<span>↗</span></a>
    </>
  );
}

function SignalTimelineCard({ signal, copy, formatDate }: {
  signal: Signal;
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
      <div className="signal-scroll" tabIndex={0} role="region" aria-label={copy.signalDetails}>
        <div className="parent-post"><span>{copy.parentPost}</span><p>{signal.parentText.en}</p></div>
        <blockquote>“{signal.text}”</blockquote>
      </div>
      <div className="signal-impact"><span>{copy.impact}</span><strong>24h {signed(signal.impact24h)}pt</strong><strong>48h {signed(signal.impact48h)}pt</strong></div>
      <a className="timeline-source" href={signal.sourceUrl} target="_blank" rel="noreferrer">{copy.source}<span>↗</span></a>
    </>
  );
}

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" style={{ transform: direction === "right" ? "rotate(180deg)" : undefined }}><path d="m14.5 5-7 7 7 7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
