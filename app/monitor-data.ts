export type Localized = { ko: string; en: string };

export type ResetEvent = {
  id: string;
  type: "confirmed-reset";
  dateTime: string;
  title: Localized;
  text: string;
  scope: Localized;
  author: string;
  sourceUrl: string;
  reason: Localized;
};

export type Signal = {
  id: string;
  createdAt: string;
  text: string;
  author: string;
  sourceUrl: string;
  classification: "archived-signal" | "negative-signal" | "upward-signal";
  impact24h: number;
  impact48h: number;
  ttlHours: number;
};

export const monitorData = {
  generatedAt: "2026-08-04T08:00:00Z",
  events: [
    {
      id: "reset-2026-06-29", type: "confirmed-reset", dateTime: "2026-06-29T00:00:00Z",
      title: { ko: "사용량 한도 보상 리셋", en: "Usage depletion compensation" },
      text: "A broad usage-limit compensation reset was recorded after service depletion.",
      scope: { ko: "Codex 유료 사용자", en: "Paid Codex users" }, author: "OpenAI Status",
      sourceUrl: "https://status.openai.com/incidents/6enf4645",
      reason: { ko: "공식 상태 기록에 광범위한 사용량 보상이 명시됐습니다.", en: "The official status record documents broad usage compensation." },
    },
    {
      id: "reset-2026-07-10-a", type: "confirmed-reset", dateTime: "2026-07-10T05:30:00Z",
      title: { ko: "출시 기념 리셋", en: "Launch reset window" },
      text: "A launch-period reset applied to paid Codex users.",
      scope: { ko: "Codex 유료 사용자", en: "Paid Codex users" }, author: "Codex Radar",
      sourceUrl: "https://codex-reset-radar.pages.dev/en/",
      reason: { ko: "복수 사용자에게 적용된 완료 리셋 기록입니다.", en: "The source records a completed reset across paid users." },
    },
    {
      id: "reset-2026-07-10-b", type: "confirmed-reset", dateTime: "2026-07-10T19:03:00Z",
      title: { ko: "전체 Codex 한도 리셋", en: "Global Codex quota reset" },
      text: "We have reset usage limits across Codex and ChatGPT Work.",
      scope: { ko: "Codex와 ChatGPT Work의 공용 한도", en: "Shared Codex and ChatGPT Work limits" }, author: "OpenAI",
      sourceUrl: "https://x.com/OpenAI/status/2075657265508647008",
      reason: { ko: "완료형 표현과 제품 전반의 범위가 함께 명시됐습니다.", en: "Completed-action wording and broad product scope appear together." },
    },
    {
      id: "reset-2026-07-12", type: "confirmed-reset", dateTime: "2026-07-12T17:59:00Z",
      title: { ko: "활성 사용자 달성 기념 리셋", en: "Active-user milestone reset" },
      text: "A new usage reset was announced for Plus, Business, and Pro plans.",
      scope: { ko: "모든 유료 플랜", en: "All paid plans" }, author: "Tibo",
      sourceUrl: "https://x.com/thsottiaux/status/2076365965915467978",
      reason: { ko: "여러 유료 플랜에 대한 완료된 사용량 리셋입니다.", en: "A completed usage reset covers multiple paid plans." },
    },
    {
      id: "reset-2026-07-14", type: "confirmed-reset", dateTime: "2026-07-14T19:34:00Z",
      title: { ko: "마일스톤 기념 리셋", en: "Milestone celebration reset" },
      text: "Usage limits were reset for all after an active-user milestone.",
      scope: { ko: "모든 유료 플랜", en: "All paid plans" }, author: "Tibo",
      sourceUrl: "https://x.com/thsottiaux/status/2077114635308986427",
      reason: { ko: "모든 대상에 대한 완료 상태가 명확합니다.", en: "The source clearly states a completed reset for all users." },
    },
    {
      id: "reset-2026-07-16", type: "confirmed-reset", dateTime: "2026-07-16T04:14:00Z",
      title: { ko: "주간 한도 전체 리셋", en: "Weekly limit hard reset" },
      text: "A Codex and ChatGPT Work reset returned weekly usage to 100%.",
      scope: { ko: "Codex와 ChatGPT Work 사용자", en: "Codex and ChatGPT Work users" }, author: "Tibo",
      sourceUrl: "https://x.com/thsottiaux/status/2077607697487188198",
      reason: { ko: "광범위한 주간 사용량 회복이 완료형으로 확인됩니다.", en: "Broad weekly usage recovery is described as completed." },
    },
    {
      id: "reset-2026-07-18", type: "confirmed-reset", dateTime: "2026-07-18T03:28:00Z",
      title: { ko: "주말 전체 리셋", en: "Global weekend reset" },
      text: "Enjoy reset usage limits for all paid users for Codex and ChatGPT Work.",
      scope: { ko: "모든 유료 사용자", en: "All paid users" }, author: "Tibo",
      sourceUrl: "https://x.com/thsottiaux/status/2078320950488297917",
      reason: { ko: "모든 유료 사용자와 완료된 리셋을 함께 명시합니다.", en: "All paid users and a completed reset are explicitly stated." },
    },
    {
      id: "reset-2026-07-21", type: "confirmed-reset", dateTime: "2026-07-21T17:47:00Z",
      title: { ko: "마일스톤 기념 사용량 리셋", en: "Milestone usage reset" },
      text: "New day, new usage reset for paid users of Codex and ChatGPT Work.",
      scope: { ko: "유료 사용자", en: "Paid users" }, author: "Tibo",
      sourceUrl: "https://x.com/thsottiaux/status/2079609157934886975",
      reason: { ko: "유료 사용자 전체를 대상으로 리셋을 명시합니다.", en: "The reset explicitly covers paid users broadly." },
    },
    {
      id: "reset-2026-07-25", type: "confirmed-reset", dateTime: "2026-07-25T03:37:00Z",
      title: { ko: "장애 보상 리셋", en: "Outage compensation reset" },
      text: "We have reset usage limits for all Codex and ChatGPT Work users.",
      scope: { ko: "Codex와 ChatGPT Work의 모든 사용자", en: "All Codex and ChatGPT Work users" }, author: "Tibo",
      sourceUrl: "https://x.com/thsottiaux/status/2081096447718723984",
      reason: { ko: "장애 보상으로 전체 사용자 리셋을 완료형으로 명시합니다.", en: "A completed reset for all users is stated as outage compensation." },
    },
    {
      id: "reset-2026-07-28", type: "confirmed-reset", dateTime: "2026-07-28T03:09:00Z",
      title: { ko: "전체 Codex 한도 리셋", en: "Global Codex quota reset" },
      text: "The usage limits have been reset for all paid users of Codex and ChatGPT Work.",
      scope: { ko: "모든 유료 사용자", en: "All paid users" }, author: "Tibo",
      sourceUrl: "https://x.com/thsottiaux/status/2081940052154933696",
      reason: { ko: "완료형 표현과 모든 유료 사용자 범위가 명시됩니다.", en: "Completed wording and all-paid-user scope are explicit." },
    },
    {
      id: "reset-2026-07-29", type: "confirmed-reset", dateTime: "2026-07-29T04:09:00Z",
      title: { ko: "효율 개선 후 전체 리셋", en: "Efficiency update reset" },
      text: "I've reset usage limits for all ChatGPT Work and Codex users.",
      scope: { ko: "ChatGPT Work와 Codex의 모든 사용자", en: "All ChatGPT Work and Codex users" }, author: "Tibo",
      sourceUrl: "https://x.com/thsottiaux/status/2082317452755751098",
      reason: { ko: "명시적 완료형과 전체 범위가 함께 존재합니다.", en: "Explicit completed-action language and broad scope appear together." },
    },
    {
      id: "reset-2026-08-01", type: "confirmed-reset", dateTime: "2026-08-01T03:32:00Z",
      title: { ko: "전체 Codex 한도 리셋", en: "Global Codex quota reset" },
      text: "I have reset usage limits for Codex and ChatGPT Work. Enjoy.",
      scope: { ko: "Codex와 ChatGPT Work의 공용 한도", en: "Shared Codex and ChatGPT Work limits" }, author: "Tibo",
      sourceUrl: "https://x.com/thsottiaux/status/2083395449814229287",
      reason: { ko: "‘I have reset’ 완료형과 Codex 전체 범위가 명시됩니다.", en: "The completed phrase ‘I have reset’ and broad Codex scope are explicit." },
    },
  ] as ResetEvent[],
  signals: [
    { id: "signal-2026-07-25", createdAt: "2026-07-25T19:17:00Z", text: "Trying, but not sure this time", author: "Tibo", sourceUrl: "https://x.com/thsottiaux/status/2081446159361675631", classification: "archived-signal", impact24h: 3, impact48h: 3, ttlHours: 48 },
    { id: "signal-2026-07-30", createdAt: "2026-07-30T18:24:00Z", text: "Calm down, calm down", author: "Tibo", sourceUrl: "https://x.com/thsottiaux/status/2082895176696221738", classification: "negative-signal", impact24h: -2, impact48h: -3, ttlHours: 48 },
  ] as Signal[],
};
