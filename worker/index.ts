/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { monitorData } from "../app/monitor-data";
import { normalizeAlertEmail, saveAlertSubscription, sendMercyAlerts, unsubscribeFromAlerts } from "../lib/email-alerts";
import { refreshMonitorSnapshot } from "../lib/xai-monitor";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  XAI_API_KEY?: string;
  RESEND_API_KEY?: string;
  ALERT_FROM_EMAIL?: string;
  PUBLIC_SITE_URL?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/alerts" && request.method === "POST") {
      if (!env?.DB) return Response.json({ error: "Alert storage is unavailable" }, { status: 503 });
      try {
        const payload = await request.json() as { email?: unknown };
        const email = normalizeAlertEmail(payload.email);
        if (!email) return Response.json({ error: "Enter a valid email address" }, { status: 400 });
        const monitor = await refreshMonitorSnapshot(env);
        const latest = [...monitor.snapshot.events].sort((a, b) => b.dateTime.localeCompare(a.dateTime))[0];
        const result = await saveAlertSubscription(env, email, latest?.id ?? null);
        return Response.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
      } catch {
        return Response.json({ error: "Could not save the alert subscription" }, { status: 500 });
      }
    }

    if (url.pathname === "/api/alerts/unsubscribe" && request.method === "GET") {
      if (!env?.DB) return new Response("Alert storage is unavailable", { status: 503 });
      const token = url.searchParams.get("token") ?? "";
      const removed = /^[a-f0-9]{32}$/i.test(token) && await unsubscribeFromAlerts(env, token);
      return new Response(`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>티보의 은총 알림</title><body style="font-family:system-ui;padding:40px;background:#ebe8e4;color:#171716"><h1>${removed ? "이메일 알림을 해제했어요." : "유효한 알림 신청을 찾지 못했어요."}</h1><p><a href="/">티보의 은총으로 돌아가기</a></p></body></html>`, {
        status: removed ? 200 : 404,
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      });
    }

    if (url.pathname === "/api/monitor" && request.method === "GET") {
      if (!env?.DB) {
        return Response.json({
          snapshot: monitorData,
          meta: {
            source: "spacexai-x-search",
            intervalHours: 4,
            status: "missing-key",
            lastSuccessAt: null,
            lastAttemptAt: null,
            error: null,
          },
        }, { headers: { "Cache-Control": "no-store" } });
      }
      try {
        const result = await refreshMonitorSnapshot(env);
        return Response.json(result, {
          headers: { "Cache-Control": "no-store" },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Monitor data is unavailable";
        return Response.json({ error: message }, { status: 503 });
      }
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil((async () => {
      const result = await refreshMonitorSnapshot(env);
      await sendMercyAlerts(env, result.snapshot);
    })());
  },
};

export default worker;
