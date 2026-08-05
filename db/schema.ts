import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const monitorSyncState = sqliteTable("monitor_sync_state", {
  id: text("id").primaryKey(),
  snapshotJson: text("snapshot_json").notNull(),
  lastAttemptAt: text("last_attempt_at"),
  lastSuccessAt: text("last_success_at"),
  lastError: text("last_error"),
  keyFingerprint: text("key_fingerprint"),
});

export const mercyEmailSubscriptions = sqliteTable("mercy_email_subscriptions", {
  email: text("email").primaryKey(),
  unsubscribeToken: text("unsubscribe_token").notNull().unique(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  lastEventId: text("last_event_id"),
});
