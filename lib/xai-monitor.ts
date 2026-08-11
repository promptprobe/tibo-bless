import { monitorData, type MonitorSnapshot } from "@/app/monitor-data";

const SYNC_ID = "latest";

export type MonitorEnv = {
  DB: D1Database;
};

export type MonitorSyncMeta = {
  source: "stored-snapshot";
  intervalHours: null;
  status: "disabled";
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  error: null;
};

export type MonitorSyncResult = {
  snapshot: MonitorSnapshot;
  meta: MonitorSyncMeta;
};

type StoredState = {
  snapshotJson: string;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
};

/**
 * Return the bundled and previously persisted evidence without contacting X or
 * any other discovery API. Automated X crawling was retired on 2026-08-11.
 */
export async function readMonitorSnapshot(env: MonitorEnv): Promise<MonitorSyncResult> {
  await ensureMonitorSchema(env.DB);
  const stored = await readStoredState(env.DB);
  const snapshot = mergeSnapshots(monitorData, parseSnapshot(stored?.snapshotJson));

  return {
    snapshot,
    meta: {
      source: "stored-snapshot",
      intervalHours: null,
      status: "disabled",
      lastSuccessAt: stored?.lastSuccessAt ?? null,
      lastAttemptAt: stored?.lastAttemptAt ?? null,
      error: null,
    },
  };
}

async function ensureMonitorSchema(db: D1Database) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS monitor_sync_state (
      id TEXT PRIMARY KEY NOT NULL,
      snapshot_json TEXT NOT NULL,
      last_attempt_at TEXT,
      last_success_at TEXT,
      last_error TEXT,
      key_fingerprint TEXT
    )
  `).run();
}

async function readStoredState(db: D1Database): Promise<StoredState | null> {
  const row = await db.prepare(`
    SELECT
      snapshot_json AS snapshotJson,
      last_attempt_at AS lastAttemptAt,
      last_success_at AS lastSuccessAt
    FROM monitor_sync_state
    WHERE id = ?
  `).bind(SYNC_ID).first<StoredState>();
  return row ?? null;
}

function parseSnapshot(value: string | undefined): MonitorSnapshot | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<MonitorSnapshot>;
    if (!Array.isArray(parsed.events) || !Array.isArray(parsed.signals)) return null;
    return {
      generatedAt: typeof parsed.generatedAt === "string" ? parsed.generatedAt : monitorData.generatedAt,
      events: parsed.events,
      signals: parsed.signals,
    };
  } catch {
    return null;
  }
}

function mergeSnapshots(baseline: MonitorSnapshot, stored: MonitorSnapshot | null): MonitorSnapshot {
  if (!stored) return baseline;
  return {
    generatedAt: stored.generatedAt || baseline.generatedAt,
    events: dedupeById([...baseline.events, ...stored.events])
      .sort((a, b) => a.dateTime.localeCompare(b.dateTime)),
    signals: dedupeById([...baseline.signals, ...stored.signals])
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

function dedupeById<T extends { id: string }>(items: T[]) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}
