import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

async function render() {
  const worker = await loadWorker();
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
}

test("server-renders Tibo Bless without starter metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>티보의 은총 — Tibo Bless<\/title>/i);
  assert.match(html, /티보의 은총/);
  assert.match(html, /티보의 다음/);
  assert.match(html, /은총은 언제\?/);
  assert.match(html, /산출 근거 보기/);
  assert.match(html, /기쁘다 구주 오셨네/);
  assert.match(html, /좌우로 넘겨 티보의 은총을 확인해 보세요\./);
  assert.match(html, /은총 받을 확률/);
  assert.match(html, /은총을 하사하시니/);
  assert.match(html, /은총 기록/);
  assert.match(html, /은총 예측 원리/);
  assert.match(html, /은총 레이더/);
  assert.match(html, /구세주 목록/);
  assert.match(html, /마지막 은총 날짜/);
  assert.doesNotMatch(html, /CODEX RESET WATCH/);
  assert.doesNotMatch(html, /공개된 리셋 기록을 바탕으로/);
  assert.doesNotMatch(html, /Juice|Capability|역량/);
  assert.doesNotMatch(html, /\/Users\/|\.vinext\/fonts/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton|가장 최근에 확인된 리셋|최근 리셋 타임라인|다음 리셋 가능성|어떻게 작동하나요|레퍼런스 분석 성과|실제 리셋을 보장/);
});

test("ships an installable bilingual PWA shell", async () => {
  const manifest = JSON.parse(await readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
  const serviceWorker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.equal(manifest.short_name, "Tibo Bless");
  assert.equal(manifest.display, "standalone");
  assert.deepEqual(manifest.icons.map((icon) => icon.sizes), ["1254x1254"]);
  assert.match(serviceWorker, /tibo-bless-v10/);
  assert.match(serviceWorker, /tibo-bless-logo\.png/);
  assert.match(serviceWorker, /manifest\.webmanifest/);
  assert.match(serviceWorker, /people\/tibo\.jpg/);
});

test("keeps unrelated reference branding out of repository-facing copy", async () => {
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  const app = await readFile(new URL("../app/TiboBless.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(`${readme}\n${app}`, /codexreset\.org/i);
});

test("serves the baseline monitor safely when hosted secrets are unavailable", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(new Request("http://localhost/api/monitor"), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.meta.intervalHours, 4);
  assert.equal(payload.meta.status, "missing-key");
  assert.equal(payload.meta.lastAttemptAt, null);
  assert.equal(payload.meta.error, null);
  assert.equal(payload.snapshot.events.length, 12);
  assert.equal(payload.snapshot.signals.length, 2);
});
