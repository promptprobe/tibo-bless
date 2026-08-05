import type { MonitorSnapshot } from "@/app/monitor-data";

export const MERCY_EMAIL_SUBJECT = "티보의 은총이 도착했습니다";
export const MERCY_EMAIL_BODY = "티보가 은총을 하사하시니, 불쌍한 중생이여 미처 하지못한 작업을 마무리 해보거라";

type AlertEnv = {
  DB: D1Database;
  RESEND_API_KEY?: string;
  ALERT_FROM_EMAIL?: string;
  PUBLIC_SITE_URL?: string;
};

type Subscriber = {
  email: string;
  unsubscribeToken: string;
};

export function normalizeAlertEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export async function ensureAlertSchema(db: D1Database) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS mercy_email_subscriptions (
      email TEXT PRIMARY KEY NOT NULL,
      unsubscribe_token TEXT NOT NULL UNIQUE,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_event_id TEXT
    )
  `).run();
}

export async function saveAlertSubscription(
  env: AlertEnv,
  email: string,
  lastEventId: string | null,
) {
  await ensureAlertSchema(env.DB);
  const now = new Date().toISOString();
  const token = crypto.randomUUID().replaceAll("-", "");
  await env.DB.prepare(`
    INSERT INTO mercy_email_subscriptions (
      email, unsubscribe_token, active, created_at, updated_at, last_event_id
    ) VALUES (?, ?, 1, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      unsubscribe_token = excluded.unsubscribe_token,
      active = 1,
      updated_at = excluded.updated_at,
      last_event_id = excluded.last_event_id
  `).bind(email, token, now, now, lastEventId).run();
  return { mailReady: Boolean(env.RESEND_API_KEY && env.ALERT_FROM_EMAIL) };
}

export async function unsubscribeFromAlerts(env: AlertEnv, token: string) {
  await ensureAlertSchema(env.DB);
  const result = await env.DB.prepare(`
    UPDATE mercy_email_subscriptions
    SET active = 0, updated_at = ?
    WHERE unsubscribe_token = ?
  `).bind(new Date().toISOString(), token).run();
  return Number(result.meta?.changes ?? 0) > 0;
}

export async function sendMercyAlerts(env: AlertEnv, snapshot: MonitorSnapshot) {
  if (!env.RESEND_API_KEY || !env.ALERT_FROM_EMAIL) {
    return { sent: 0, skipped: "missing-mail-config" as const };
  }
  await ensureAlertSchema(env.DB);
  const latest = [...snapshot.events].sort((a, b) => b.dateTime.localeCompare(a.dateTime))[0];
  if (!latest) return { sent: 0, skipped: "no-event" as const };

  const rows = await env.DB.prepare(`
    SELECT email, unsubscribe_token AS unsubscribeToken
    FROM mercy_email_subscriptions
    WHERE active = 1
      AND (last_event_id IS NULL OR last_event_id != ?)
  `).bind(latest.id).all<Subscriber>();

  let sent = 0;
  for (const subscriber of rows.results ?? []) {
    const siteUrl = (env.PUBLIC_SITE_URL ?? "https://tibos-mercy.cloudy-gull-7634.chatgpt.site").replace(/\/$/, "");
    const unsubscribeUrl = `${siteUrl}/api/alerts/unsubscribe?token=${encodeURIComponent(subscriber.unsubscribeToken)}`;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.ALERT_FROM_EMAIL,
        to: [subscriber.email],
        subject: MERCY_EMAIL_SUBJECT,
        text: `${MERCY_EMAIL_BODY}\n\n알림 해제: ${unsubscribeUrl}`,
        html: `<p>${MERCY_EMAIL_BODY}</p><p><a href="${unsubscribeUrl}">알림 해제</a></p>`,
        headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
      }),
    });
    if (!response.ok) {
      console.error("Mercy email delivery failed", response.status);
      continue;
    }
    await env.DB.prepare(`
      UPDATE mercy_email_subscriptions
      SET last_event_id = ?, updated_at = ?
      WHERE email = ?
    `).bind(latest.id, new Date().toISOString(), subscriber.email).run();
    sent += 1;
  }
  return { sent };
}
