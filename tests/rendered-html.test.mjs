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
  assert.match(html, /<title>Tibo Bless — Codex Reset Monitor<\/title>/i);
  assert.match(html, /Tibo Bless/);
  assert.match(html, /티보의 다음 은총은 언제/);
  assert.match(html, /산출 근거 보기/);
  assert.match(html, /최근 리셋 타임라인/);
  assert.match(html, /어떻게 작동하나요/);
  assert.doesNotMatch(html, /CODEX RESET WATCH/);
  assert.doesNotMatch(html, /공개된 리셋 기록을 바탕으로/);
  assert.doesNotMatch(html, /Juice|Capability|역량/);
  assert.doesNotMatch(html, /\/Users\/|\.vinext\/fonts/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/);
});

test("ships an installable bilingual PWA shell", async () => {
  const manifest = JSON.parse(await readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
  const serviceWorker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.equal(manifest.short_name, "Tibo Bless");
  assert.equal(manifest.display, "standalone");
  assert.deepEqual(manifest.icons.map((icon) => icon.sizes), ["1254x1254"]);
  assert.match(serviceWorker, /tibo-bless-v9/);
  assert.match(serviceWorker, /tibo-bless-logo\.png/);
  assert.match(serviceWorker, /manifest\.webmanifest/);
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
