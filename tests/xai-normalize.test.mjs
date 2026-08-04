import assert from "node:assert/strict";
import test from "node:test";
import { extractVerifiedDiscoveries, getStatusId } from "../lib/xai-normalize.js";

const now = new Date("2026-08-05T12:00:00Z");

function discovery(overrides = {}) {
  return {
    source_url: "https://x.com/thsottiaux/status/1234567890",
    author: "Tibo Sottiaux",
    handle: "thsottiaux",
    created_at: "2026-08-05T08:00:00Z",
    text: "I have reset usage limits for all paid users of Codex and ChatGPT Work.",
    parent_text_en: "",
    parent_text_ko: "",
    kind: "confirmed_reset",
    title_en: "Global reset",
    title_ko: "전체 리셋",
    scope_en: "All paid Codex and ChatGPT Work users",
    scope_ko: "모든 유료 사용자",
    reason_en: "Completed wording and broad scope.",
    reason_ko: "완료 표현과 전체 범위가 확인됩니다.",
    ...overrides,
  };
}

function response(items, citations = []) {
  return {
    citations,
    output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ items }), annotations: [] }] }],
  };
}

test("accepts only X status URLs that are present in SpaceXAI citations", () => {
  const item = discovery();
  assert.equal(extractVerifiedDiscoveries(response([item], ["https://x.com/i/status/1234567890"]), now).length, 1);
  assert.equal(extractVerifiedDiscoveries(response([item], ["https://x.com/i/status/9999999999"]), now).length, 0);
});

test("rejects unmonitored handles and weak confirmed-reset claims", () => {
  const citation = ["https://x.com/i/status/1234567890"];
  assert.equal(extractVerifiedDiscoveries(response([discovery({ handle: "unknown" })], citation), now).length, 0);
  assert.equal(extractVerifiedDiscoveries(response([discovery({ text: "Can we get a reset?" })], citation), now).length, 0);
});

test("normalizes supported status URL shapes", () => {
  assert.equal(getStatusId("https://x.com/thsottiaux/status/123"), "123");
  assert.equal(getStatusId("https://x.com/i/status/456"), "456");
  assert.equal(getStatusId("https://example.com/status/123"), null);
});
