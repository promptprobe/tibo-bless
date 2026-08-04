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

export function evaluateJuice(sweeps) {
  const complete = sweeps.filter(
    (sweep) => sweep.complete && Object.values(sweep.values).every(Number.isFinite),
  );
  if (!complete.length) return { status: "inconclusive", current: null, changes: [] };
  const current = complete.at(-1);
  if (complete.length === 1) return { status: "initial", current, changes: [] };
  const previous = complete.at(-2);
  const changes = Object.keys(current.values)
    .filter((effort) => current.values[effort] !== previous.values[effort])
    .map((effort) => ({ effort, from: previous.values[effort], to: current.values[effort] }));
  return { status: changes.length ? "changed" : "unchanged", current, changes };
}

export function evaluateCapability(snapshot, now = new Date()) {
  const ageHours = (now.getTime() - new Date(snapshot.observedAt).getTime()) / HOUR;
  const available = snapshot.efforts.filter((effort) => Number.isFinite(effort.score));
  const best = available.reduce(
    (winner, effort) => (!winner || effort.score > winner.score ? effort : winner),
    null,
  );
  const declines = available.filter((effort) => Number.isFinite(effort.delta) && effort.delta <= -2);
  const improvements = available.filter((effort) => Number.isFinite(effort.delta) && effort.delta >= 2);
  let verdict = "stable";
  if (ageHours > 6) verdict = "stale";
  else if (declines.length >= 3) verdict = "declining";
  else if (improvements.length >= 3) verdict = "improving";
  return { verdict, ageHours: Number(ageHours.toFixed(1)), best, declines, improvements };
}

export function predictionPerformance(forecasts, events, threshold = 50) {
  const confirmed = events.filter((event) => event.type === "confirmed-reset");
  let eligible = 0;
  let hits = 0;
  for (const event of confirmed) {
    const resetTime = new Date(event.dateTime).getTime();
    const candidates = forecasts.filter((forecast) => {
      const forecastTime = new Date(forecast.calculatedAt).getTime();
      return forecastTime < resetTime && forecastTime >= resetTime - 48 * HOUR;
    });
    if (!candidates.length) continue;
    eligible += 1;
    if (candidates.some((forecast) => forecast.score48h >= threshold)) hits += 1;
  }
  return { eligible, hits, hitRate: eligible ? Math.round((hits / eligible) * 100) : null };
}

export function buildBlessCalendar(events, endDate = new Date(), weekCount = 26) {
  const safeWeekCount = clamp(Math.trunc(weekCount) || 26, 1, 52);
  const end = new Date(endDate);
  end.setUTCHours(0, 0, 0, 0);

  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay() - ((safeWeekCount - 1) * 7));

  const confirmed = events
    .filter((event) => event.type === "confirmed-reset")
    .map((event) => ({ ...event, time: new Date(event.dateTime).getTime() }))
    .filter((event) => Number.isFinite(event.time))
    .sort((a, b) => a.time - b.time);

  const byDay = new Map();
  for (const event of confirmed) {
    const key = new Date(event.time).toISOString().slice(0, 10);
    const current = byDay.get(key) ?? [];
    current.push(event);
    byDay.set(key, current);
  }

  const days = Array.from({ length: safeWeekCount * 7 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    const dayEvents = byDay.get(key) ?? [];
    return { date: key, count: dayEvents.length, events: dayEvents, future: date > end };
  });

  const latestTime = confirmed.at(-1)?.time ?? null;
  const latestDay = latestTime == null ? null : new Date(`${new Date(latestTime).toISOString().slice(0, 10)}T00:00:00Z`).getTime();
  const currentWaitDays = latestDay == null ? null : Math.max(0, Math.floor((end.getTime() - latestDay) / DAY));
  const intervals = confirmed.slice(1).map((event, index) => Math.floor((event.time - confirmed[index].time) / DAY));

  return {
    days,
    weeks: Array.from({ length: safeWeekCount }, (_, index) => days.slice(index * 7, (index + 1) * 7)),
    resetDays: days.filter((day) => day.count > 0).length,
    resetCount: days.reduce((sum, day) => sum + day.count, 0),
    currentWaitDays,
    longestWaitDays: intervals.length ? Math.max(...intervals) : null,
  };
}
