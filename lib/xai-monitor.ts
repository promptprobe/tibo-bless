import { ALLOWED_HANDLES, extractVerifiedDiscoveries, getStatusId } from "./xai-normalize.js";
import {
  monitorData,
  type MonitorSnapshot,
  type ResetEvent,
  type Signal,
} from "@/app/monitor-data";

export const REFRESH_INTERVAL_HOURS = 4;
export const REFRESH_INTERVAL_MS = REFRESH_INTERVAL_HOURS * 60 * 60 * 1000;

const SYNC_ID = "latest";
const LOCK_TIMEOUT_MS = 10 * 60 * 1000;
const SEARCH_WINDOW_DAYS = 8;
const RETAIN_LIVE_DAYS = 30;

export type MonitorEnv = {
  DB: D1Database;
  XAI_API_KEY?: string;
};

export type MonitorSyncMeta = {
  source: "spacexai-x-search";
  intervalHours: 4;
  status: "fresh" | "updated" | "refreshing" | "missing-key" | "error";
  lastSuccessAt: string | null;
};

export type MonitorSyncResult = {
  snapshot: MonitorSnapshot;
  meta: MonitorSyncMeta;
};

type StoredState = {
  snapshotJson: string;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
};

type Discovery = {
  source_url: string;
  author: string;
  handle: string;
  created_at: string;
  text: string;
  parent_text_en: string;
  parent_text_ko: string;
  kind: "confirmed_reset" | "upward_signal" | "negative_signal" | "archived_signal";
  title_en: string;
  title_ko: string;
  scope_en: string;
  scope_ko: string;
  reason_en: string;
  reason_ko: string;
};

export async function refreshMonitorSnapshot(
  env: MonitorEnv,
  options: { force?: boolean; now?: Date } = {},
): Promise<MonitorSyncResult> {
  const now = options.now ?? new Date();
  await ensureMonitorSchema(env.DB);

  const stored = await readStoredState(env.DB);
  const snapshot = mergeSnapshots(monitorData, parseSnapshot(stored?.snapshotJson), [], now);
  const lastSuccessAt = stored?.lastSuccessAt ?? null;
  const lastSuccessMs = lastSuccessAt ? new Date(lastSuccessAt).getTime() : Number.NaN;

  if (!options.force && Number.isFinite(lastSuccessMs) && now.getTime() - lastSuccessMs < REFRESH_INTERVAL_MS) {
    return result(snapshot, "fresh", lastSuccessAt);
  }

  if (!env.XAI_API_KEY) {
    return result(snapshot, "missing-key", lastSuccessAt);
  }

  const acquired = await acquireRefreshLock(env.DB, snapshot, now);
  if (!acquired) {
    return result(snapshot, "refreshing", lastSuccessAt);
  }

  try {
    const discoveries = await fetchDiscoveries(env.XAI_API_KEY, now);
    const nextSnapshot = mergeSnapshots(monitorData, snapshot, discoveries, now);
    const refreshedAt = now.toISOString();

    await env.DB.prepare(`
      UPDATE monitor_sync_state
      SET snapshot_json = ?, last_success_at = ?, last_error = NULL
      WHERE id = ?
    `).bind(JSON.stringify(nextSnapshot), refreshedAt, SYNC_ID).run();

    return result(nextSnapshot, "updated", refreshedAt);
  } catch (error) {
    const message = safeErrorMessage(error);
    await env.DB.prepare(`
      UPDATE monitor_sync_state
      SET last_error = ?
      WHERE id = ?
    `).bind(message, SYNC_ID).run();
    console.error("SpaceXAI monitor refresh failed", message);
    return result(snapshot, "error", lastSuccessAt);
  }
}

export async function ensureMonitorSchema(db: D1Database) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS monitor_sync_state (
      id TEXT PRIMARY KEY NOT NULL,
      snapshot_json TEXT NOT NULL,
      last_attempt_at TEXT,
      last_success_at TEXT,
      last_error TEXT
    )
  `).run();
}

async function readStoredState(db: D1Database): Promise<StoredState | null> {
  const row = await db.prepare(`
    SELECT
      snapshot_json AS snapshotJson,
      last_attempt_at AS lastAttemptAt,
      last_success_at AS lastSuccessAt,
      last_error AS lastError
    FROM monitor_sync_state
    WHERE id = ?
  `).bind(SYNC_ID).first<StoredState>();
  return row ?? null;
}

async function acquireRefreshLock(db: D1Database, snapshot: MonitorSnapshot, now: Date) {
  const lockCutoff = new Date(now.getTime() - LOCK_TIMEOUT_MS).toISOString();
  const lock = await db.prepare(`
    INSERT INTO monitor_sync_state (id, snapshot_json, last_attempt_at)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET last_attempt_at = excluded.last_attempt_at
    WHERE monitor_sync_state.last_attempt_at IS NULL
       OR monitor_sync_state.last_attempt_at < ?
  `).bind(SYNC_ID, JSON.stringify(snapshot), now.toISOString(), lockCutoff).run();
  return Number(lock.meta?.changes ?? 0) > 0;
}

async function fetchDiscoveries(apiKey: string, now: Date): Promise<Discovery[]> {
  const fromDate = formatIsoDate(new Date(now.getTime() - SEARCH_WINDOW_DAYS * 86_400_000));
  const toDate = formatIsoDate(now);
  const response = await fetch("https://api.x.ai/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-4.5",
      store: false,
      include: ["no_inline_citations"],
      input: [
        {
          role: "system",
          content: "You are a strict evidence collector. Never invent a post, URL, timestamp, quote, author, context, or scope. Exclude anything that cannot be tied to an X status URL returned by X Search. Preserve post text verbatim. A confirmed reset requires completed-action wording and broad Codex or ChatGPT Work scope; requests and jokes are signals, not confirmed resets.",
        },
        {
          role: "user",
          content: `Search X posts from the allowed handles between ${fromDate} and ${toDate}. Return only posts materially related to Codex or ChatGPT Work usage-limit resets, quota resets, reset timing, or direct replies to reset requests. Include exact timestamps and original status URLs. Translate only the title, scope, parent context, and reason fields; keep text verbatim. Return an empty items array when no qualifying post is found.`,
        },
      ],
      tools: [{
        type: "x_search",
        allowed_x_handles: [...ALLOWED_HANDLES],
        from_date: fromDate,
        to_date: toDate,
      }],
      text: {
        format: {
          type: "json_schema",
          name: "codex_reset_evidence",
          strict: true,
          schema: discoverySchema,
        },
      },
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    throw new Error(`SpaceXAI returned HTTP ${response.status}`);
  }

  const payload = await response.json();
  return extractVerifiedDiscoveries(payload, now) as Discovery[];
}

function mergeSnapshots(
  baseline: MonitorSnapshot,
  stored: MonitorSnapshot | null,
  discoveries: Discovery[],
  now: Date,
): MonitorSnapshot {
  const liveEvents = discoveries.flatMap((item) => item.kind === "confirmed_reset" ? [toResetEvent(item)] : []);
  const liveSignals = discoveries.flatMap((item) => item.kind !== "confirmed_reset" ? [toSignal(item)] : []);
  const retentionCutoff = now.getTime() - RETAIN_LIVE_DAYS * 86_400_000;
  const baselineEventIds = new Set(baseline.events.map((item) => item.id));
  const baselineSignalIds = new Set(baseline.signals.map((item) => item.id));
  const retainedEvents = stored?.events.filter((item) => baselineEventIds.has(item.id) || new Date(item.dateTime).getTime() >= retentionCutoff) ?? [];
  const retainedSignals = stored?.signals.filter((item) => baselineSignalIds.has(item.id) || new Date(item.createdAt).getTime() >= retentionCutoff) ?? [];

  return {
    generatedAt: discoveries.length > 0 ? now.toISOString() : stored?.generatedAt ?? baseline.generatedAt,
    events: dedupeById([...baseline.events, ...retainedEvents, ...liveEvents])
      .sort((a, b) => a.dateTime.localeCompare(b.dateTime)),
    signals: dedupeById([...baseline.signals, ...retainedSignals, ...liveSignals])
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

function toResetEvent(item: Discovery): ResetEvent {
  const statusId = getStatusId(item.source_url)!;
  return {
    id: `xai-${statusId}`,
    type: "confirmed-reset",
    dateTime: new Date(item.created_at).toISOString(),
    title: { ko: item.title_ko, en: item.title_en },
    text: item.text,
    scope: { ko: item.scope_ko, en: item.scope_en },
    author: item.author,
    sourceUrl: item.source_url,
    reason: { ko: item.reason_ko, en: item.reason_en },
  };
}

function toSignal(item: Discovery): Signal {
  const statusId = getStatusId(item.source_url)!;
  const classification = item.kind === "upward_signal"
    ? "upward-signal"
    : item.kind === "negative_signal"
      ? "negative-signal"
      : "archived-signal";
  const impacts = classification === "upward-signal"
    ? { impact24h: 21, impact48h: 17 }
    : classification === "negative-signal"
      ? { impact24h: -2, impact48h: -3 }
      : { impact24h: 0, impact48h: 0 };

  return {
    id: `xai-${statusId}`,
    createdAt: new Date(item.created_at).toISOString(),
    text: item.text,
    author: item.author,
    handle: `@${item.handle.replace(/^@/, "")}`,
    parentText: { ko: item.parent_text_ko, en: item.parent_text_en },
    sourceUrl: item.source_url,
    classification,
    ...impacts,
    ttlHours: 48,
  };
}

function parseSnapshot(value?: string | null): MonitorSnapshot | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as MonitorSnapshot;
    if (!parsed || typeof parsed.generatedAt !== "string" || !Array.isArray(parsed.events) || !Array.isArray(parsed.signals)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function dedupeById<T extends { id: string }>(items: T[]) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function result(snapshot: MonitorSnapshot, status: MonitorSyncMeta["status"], lastSuccessAt: string | null): MonitorSyncResult {
  return {
    snapshot,
    meta: { source: "spacexai-x-search", intervalHours: 4, status, lastSuccessAt },
  };
}

function safeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown refresh error";
  return message.replace(/[\r\n]+/g, " ").slice(0, 400);
}

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

const discoverySchema = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      maxItems: 40,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "source_url", "author", "handle", "created_at", "text",
          "parent_text_en", "parent_text_ko", "kind", "title_en", "title_ko",
          "scope_en", "scope_ko", "reason_en", "reason_ko",
        ],
        properties: {
          source_url: { type: "string", format: "uri" },
          author: { type: "string", minLength: 1, maxLength: 100 },
          handle: { type: "string", minLength: 1, maxLength: 30 },
          created_at: { type: "string", format: "date-time" },
          text: { type: "string", minLength: 1, maxLength: 1000 },
          parent_text_en: { type: "string", maxLength: 1000 },
          parent_text_ko: { type: "string", maxLength: 1000 },
          kind: { type: "string", enum: ["confirmed_reset", "upward_signal", "negative_signal", "archived_signal"] },
          title_en: { type: "string", minLength: 1, maxLength: 120 },
          title_ko: { type: "string", minLength: 1, maxLength: 120 },
          scope_en: { type: "string", minLength: 1, maxLength: 200 },
          scope_ko: { type: "string", minLength: 1, maxLength: 200 },
          reason_en: { type: "string", minLength: 1, maxLength: 300 },
          reason_ko: { type: "string", minLength: 1, maxLength: 300 },
        },
      },
    },
  },
} as const;
