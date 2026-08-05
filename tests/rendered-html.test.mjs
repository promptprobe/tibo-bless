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
  const app = await readFile(new URL("../app/TiboBless.tsx", import.meta.url), "utf8");
  assert.match(html, /<title>티보의 은총 — Tibo Bless<\/title>/i);
  assert.match(html, /티보의 은총/);
  assert.match(html, /티보의 다음/);
  assert.match(html, /은총은 언제\?/);
  assert.match(html, /산출 근거 보기/);
  assert.match(app, /은총 확률 산출 방법/);
  assert.match(app, /시그널 포인트 산정 원리/);
  assert.match(app, /은총 시점 예고/);
  assert.match(app, /24h \+21pt · 48h \+17pt/);
  assert.match(html, /기쁘다 구주 오셨네/);
  assert.match(html, /좌우로 넘겨 티보의 은총을 확인해 보세요\./);
  assert.match(html, /은총 받을 확률/);
  assert.match(html, /24시간 이내/);
  assert.match(html, /48시간 이내/);
  assert.match(html, /은총을 하사하시니/);
  assert.match(html, /은총 기록/);
  assert.match(html, /은총 예측 원리/);
  assert.match(html, /은총 레이더/);
  assert.match(html, /구세주 목록/);
  assert.match(html, /마지막 은총 날짜/);
  assert.match(html, /마지막 은총으로부터/);
  assert.match(html, /구세주 시그널 수집/);
  assert.match(html, /구세주의 계시를 모아요/);
  assert.match(html, /티보의 은총을 이메일로 전달받기/);
  assert.match(html, /이메일 알림 신청/);
  assert.match(html, /홈 화면에 Tibo Bless 추가/);
  assert.match(html, /GPT 로그인 없이 누구나 홈 화면에서 앱처럼 열 수 있어요/);
  assert.match(html, /manifest\.webmanifest/);
  assert.match(html, /viewport-fit=cover/);
  assert.equal((html.match(/<meta name="viewport"/g) ?? []).length, 1);
  assert.match(html, /tibo-bless-apple-touch-icon\.png/);
  assert.match(html, /예수 그 자체/);
  assert.match(app, /pt는 퍼센트포인트예요/);
  assert.match(app, /시간이 흐른다고 자동으로 오르지는 않아요/);
  assert.match(app, /className="signal-scroll"/);
  assert.match(app, /beforeinstallprompt/);
  assert.match(html, /class="top-nav-actions"/);
  assert.match(html, /class="info-feature-grid"/);
  assert.match(html, /I have reset usage limits for Codex and ChatGPT Work\. Enjoy\./);
  assert.doesNotMatch(html, /class="mobile-dock"/);
  assert.doesNotMatch(html, /CODEX RESET WATCH/);
  assert.doesNotMatch(html, /공개된 리셋 기록을 바탕으로/);
  assert.doesNotMatch(html, /24시간 안|48시간 안|최우선 구세주|다음 은총이 확인되면 이메일로 한 번 알려드려요|Juice|Capability|역량/);
  assert.doesNotMatch(html, /\/Users\/|\.vinext\/fonts/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton|가장 최근에 확인된 리셋|최근 리셋 타임라인|다음 리셋 가능성|어떻게 작동하나요|레퍼런스 분석 성과|실제 리셋을 보장/);
});

test("ships an installable bilingual PWA shell", async () => {
  const manifest = JSON.parse(await readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
  const serviceWorker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  const icon192 = await readFile(new URL("../public/tibo-bless-icon-192.png", import.meta.url));
  const icon512 = await readFile(new URL("../public/tibo-bless-icon-512.png", import.meta.url));
  const appleIcon = await readFile(new URL("../public/tibo-bless-apple-touch-icon.png", import.meta.url));
  assert.equal(manifest.short_name, "Tibo Bless");
  assert.equal(manifest.id, "/");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.orientation, "portrait-primary");
  assert.deepEqual(manifest.icons.map((icon) => icon.sizes), ["192x192", "512x512"]);
  assert.deepEqual([icon192.readUInt32BE(16), icon192.readUInt32BE(20)], [192, 192]);
  assert.deepEqual([icon512.readUInt32BE(16), icon512.readUInt32BE(20)], [512, 512]);
  assert.deepEqual([appleIcon.readUInt32BE(16), appleIcon.readUInt32BE(20)], [180, 180]);
  assert.match(serviceWorker, /tibo-bless-v14/);
  assert.match(serviceWorker, /tibo-bless-logo\.png/);
  assert.match(serviceWorker, /tibo-bless-icon-192\.png/);
  assert.match(serviceWorker, /tibo-bless-apple-touch-icon\.png/);
  assert.match(serviceWorker, /manifest\.webmanifest/);
  assert.match(serviceWorker, /people\/tibo\.jpg/);
});

test("deploys the PWA on Vercel while preserving the Sites API backend", async () => {
  const vercel = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");

  assert.equal(vercel.framework, "nextjs");
  assert.match(vercel.buildCommand, /next build/);
  assert.deepEqual(vercel.rewrites, [
    {
      source: "/api/:path*",
      destination: "https://tibos-mercy.cloudy-gull-7634.chatgpt.site/api/:path*",
    },
  ]);
  assert.match(layout, /https:\/\/tibobless\.vercel\.app/);
});

test("documents the exact mercy email copy and provider boundary", async () => {
  const emailAlerts = await readFile(new URL("../lib/email-alerts.ts", import.meta.url), "utf8");
  const envExample = await readFile(new URL("../.env.example", import.meta.url), "utf8");
  assert.match(emailAlerts, /티보가 은총을 하사하시니, 불쌍한 중생이여 미처 하지못한 작업을 마무리 해보거라/);
  assert.match(envExample, /RESEND_API_KEY=/);
  assert.match(envExample, /ALERT_FROM_EMAIL=/);
});

test("fails closed when alert storage is unavailable", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(new Request("http://localhost/api/alerts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "reader@example.com" }),
  }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 503);
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

test("forces each scheduled four-hour X search slot", async () => {
  const workerSource = await readFile(new URL("../worker/index.ts", import.meta.url), "utf8");
  assert.match(workerSource, /scheduled[\s\S]*refreshMonitorSnapshot\(env, \{ force: true \}\)/);
});
