import test from "node:test";
import assert from "node:assert/strict";
import { buildBlessCalendar, classifyPost, empiricalForecast, evaluateCapability, evaluateJuice } from "../lib/monitor-logic.js";

test("confirms only completed broad resets", () => {
  assert.equal(classifyPost({ text: "I have reset usage limits for all paid users of Codex and ChatGPT Work." }).classification, "confirmed-reset");
  assert.equal(classifyPost({ text: "Can we get a Codex reset today?" }).classification, "archived-signal");
});

test("uses a documented fallback when history is insufficient", () => {
  const result = empiricalForecast([{ type: "confirmed-reset", dateTime: "2026-08-01T00:00:00Z" }]);
  assert.deepEqual([result.score24h, result.score48h, result.method], [14, 26, "fallback"]);
});

test("compares only complete Juice sweeps", () => {
  const base = { complete: true, values: { Low: 18, Medium: 32 } };
  const incomplete = { complete: false, values: { Low: 20, Medium: null } };
  assert.equal(evaluateJuice([base, incomplete]).status, "initial");
});

test("withholds capability conclusion after six hours", () => {
  const result = evaluateCapability({ observedAt: "2026-08-01T00:00:00Z", efforts: [{ name: "High", score: 90, delta: -4 }] }, new Date("2026-08-01T07:00:00Z"));
  assert.equal(result.verdict, "stale");
});

test("builds a 26-week waiting game with evidence-bearing reset days", () => {
  const result = buildBlessCalendar([
    { type: "confirmed-reset", dateTime: "2026-07-10T05:30:00Z", sourceUrl: "https://example.com/one" },
    { type: "confirmed-reset", dateTime: "2026-07-10T19:03:00Z", sourceUrl: "https://example.com/two" },
    { type: "confirmed-reset", dateTime: "2026-08-01T03:32:00Z", sourceUrl: "https://example.com/three" },
    { type: "archived-signal", dateTime: "2026-08-02T00:00:00Z" },
  ], new Date("2026-08-04T08:00:00Z"), 26);
  assert.equal(result.days.length, 182);
  assert.equal(result.resetDays, 2);
  assert.equal(result.resetCount, 3);
  assert.equal(result.currentWaitDays, 3);
  assert.equal(result.days.find((day) => day.date === "2026-07-10").count, 2);
});
