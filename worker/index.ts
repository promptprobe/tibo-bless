/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { monitorData } from "../app/monitor-data";
import { refreshMonitorSnapshot } from "../lib/xai-monitor";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  XAI_API_KEY?: string;
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
    ctx.waitUntil(refreshMonitorSnapshot(env));
  },
};

export default worker;
