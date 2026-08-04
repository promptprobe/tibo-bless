const DAY = 86_400_000;
const HOUR = 3_600_000;

export const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

export function classifyPost(post) {
  const text = String(post.text ?? "").toLowerCase();
  const broadScope = /(all\s+(paid\s+)?(users|plans)|across\s+codex|global|codex\s+and\s+chatgpt\s+work|all\s+chatgpt\s+work\s+and\s+codex)/i.test(text);
  const completedReset = /(i\s+(have|'ve)\s+reset|limits?\s+(have|has)\s+been\s+reset|we\s+(have|'ve)\s+reset|reset\s+usage\s+limits)/i.test(text);
  const futureTiming = /(later\s+(today|in\s+the\s+day)|next\s+hour|within\s+\d+\s+hours?|tomorrow|still\s+time|coming\s+soon)/i.test(text);
  const explicitNegative = /(no\s+(codex\s+)?reset|not\s+(doing|sure|resetting)|calm\s+down|get\s+back\s+to\s+work)/i.test(text);
  const requestOnly = /(can\s+we\s+get|should\s+celebrate\s+with|please\s+reset|want\s+a\s+reset)/i.test(text);
  const mentionsReset = /reset|usage\s+limits?/.test(text);

  if (completedReset && broadScope) {
    return { classification: "confirmed-reset", confidence: "high", impact24h: 0, impact48h: 0 };
  }
  if (explicitNegative) {
    return { classification: "negative-signal", confidence: "moderate", impact24h: -2, impact48h: -3 };
  }
  if (futureTiming && mentionsReset) {
    return { classification: "upward-signal", confidence: "moderate", impact24h: 21, impact48h: 17 };
  }
  if (requestOnly || mentionsReset) {
    return { classification: "archived-signal", confidence: "low", impact24h: 0, impact48h: 0 };
  }
  return { classification: "irrelevant", confidence: "high", impact24h: 0, impact48h: 0 };
}

export function empiricalForecast(events) {
  const resetTimes = events
    .filter((event) => event.type === "confirmed-reset")
    .map((event) => new Date(event.dateTime).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  if (resetTimes.length < 3) {
    return { score24h: 14, score48h: 26, method: "fallback", sampleSize: Math.max(0, resetTimes.length - 1), meanIntervalDays: null };
  }

  const intervals = resetTimes.slice(1)
    .map((time, index) => (time - resetTimes[index]) / DAY)
    .filter((days) => days > 0 && days <= 30)
    .sort((a, b) => a - b);
  const trimmed = intervals.length >= 8 ? intervals.slice(1, -1) : intervals;
  const mean = trimmed.reduce((sum, value) => sum + value, 0) / trimmed.length;
  const conservativeMean = Math.max(3.5, mean * 1.35);
  const score = (hours) => Math.round((1 - Math.exp(-(hours / 24) / conservativeMean)) * 100);
  return {
    score24h: clamp(score(24), 5, 70),
    score48h: clamp(score(48), 10, 85),
    method: "smoothed-interval-hazard",
    sampleSize: intervals.length,
    meanIntervalDays: Number(mean.toFixed(2)),
  };
}

export function buildForecast(snapshot, now = new Date()) {
  const baseline = empiricalForecast(snapshot.events);
  const resetTimes = snapshot.events
    .filter((event) => event.type === "confirmed-reset")
    .map((event) => new Date(event.dateTime).getTime());
  const latestResetTime = Math.max(...resetTimes);
  const activeSignals = snapshot.signals.filter((signal) => {
    const signalTime = new Date(signal.createdAt).getTime();
    const expiresAt = signal.expiresAt
      ? new Date(signal.expiresAt).getTime()
      : signalTime + (signal.ttlHours ?? 48) * HOUR;
    return signalTime > latestResetTime && expiresAt > now.getTime();
  });
  const adjustment24h = activeSignals.reduce((sum, signal) => sum + (signal.impact24h ?? 0), 0);
  const adjustment48h = activeSignals.reduce((sum, signal) => sum + (signal.impact48h ?? 0), 0);
  const score24h = clamp(Math.round(baseline.score24h + adjustment24h), 1, 95);
  const score48h = clamp(Math.max(score24h, Math.round(baseline.score48h + adjustment48h)), 1, 98);
  return { ...baseline, score24h, score48h, adjustment24h, adjustment48h, activeSignals };
}
