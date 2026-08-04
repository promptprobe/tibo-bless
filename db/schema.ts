import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const monitorSyncState = sqliteTable("monitor_sync_state", {
  id: text("id").primaryKey(),
  snapshotJson: text("snapshot_json").notNull(),
  lastAttemptAt: text("last_attempt_at"),
  lastSuccessAt: text("last_success_at"),
  lastError: text("last_error"),
});
