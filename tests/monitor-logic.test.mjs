import test from "node:test";
import assert from "node:assert/strict";
import { buildForecast, classifyPost, empiricalForecast } from "../lib/monitor-logic.js";

test("confirms only completed broad resets", () => {
  assert.equal(classifyPost({ text: "I have reset usage limits for all paid users of Codex and ChatGPT Work." }).classification, "confirmed-reset");
  assert.equal(classifyPost({ text: "Can we get a Codex reset today?" }).classification, "archived-signal");
});

test("uses the documented evidence-free cadence baseline", () => {
  const result = empiricalForecast([{ type: "confirmed-reset", dateTime: "2026-08-01T00:00:00Z" }]);
  assert.deepEqual([result.score24h, result.score48h, result.method], [14, 26, "evidence-free-cadence-baseline"]);
});

test("applies only unexpired signals created after the latest reset", () => {
  const result = buildForecast({
    events: [
      { type: "confirmed-reset", dateTime: "2026-07-20T00:00:00Z" },
      { type: "confirmed-reset", dateTime: "2026-07-25T00:00:00Z" },
      { type: "confirmed-reset", dateTime: "2026-08-01T00:00:00Z" },
    ],
    signals: [
      { createdAt: "2026-07-31T00:00:00Z", impact24h: 40, impact48h: 40, ttlHours: 240 },
      { createdAt: "2026-08-01T06:00:00Z", impact24h: 7, impact48h: 9, ttlHours: 48 },
      { createdAt: "2026-08-01T07:00:00Z", impact24h: 20, impact48h: 20, ttlHours: 1 },
    ],
  }, new Date("2026-08-02T00:00:00Z"));

  assert.equal(result.activeSignals.length, 1);
  assert.equal(result.adjustment24h, 7);
  assert.equal(result.adjustment48h, 9);
  assert.equal(result.score24h, 21);
  assert.equal(result.score48h, 35);
});
