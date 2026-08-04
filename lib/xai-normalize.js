import { classifyPost } from "./monitor-logic.js";

export const ALLOWED_HANDLES = ["thsottiaux", "OpenAI", "romainhuet", "gdb", "sama"];

export function extractVerifiedDiscoveries(payload, now = new Date()) {
  const text = payload?.output
    ?.find((item) => item?.type === "message")
    ?.content?.find((content) => content?.type === "output_text")?.text;
  if (!text) throw new Error("SpaceXAI response did not contain structured output");

  const parsed = JSON.parse(text);
  const citationIds = collectCitationStatusIds(payload);
  return (Array.isArray(parsed?.items) ? parsed.items : [])
    .filter((item) => validateDiscovery(item, citationIds, now));
}

export function getStatusId(value) {
  try {
    const url = new URL(value);
    const allowedHosts = new Set(["x.com", "www.x.com", "twitter.com", "www.twitter.com"]);
    if (!allowedHosts.has(url.hostname)) return null;
    return url.pathname.match(/\/(?:i\/)?status(?:es)?\/(\d+)/)?.[1] ?? null;
  } catch {
    return null;
  }
}

function collectCitationStatusIds(payload) {
  const urls = new Set(Array.isArray(payload?.citations) ? payload.citations : []);
  for (const output of payload?.output ?? []) {
    for (const content of output?.content ?? []) {
      for (const annotation of content?.annotations ?? []) {
        if (annotation?.url) urls.add(annotation.url);
      }
    }
  }
  return new Set([...urls].flatMap((url) => {
    const statusId = getStatusId(url);
    return statusId ? [statusId] : [];
  }));
}

function validateDiscovery(item, citationIds, now) {
  if (!item || typeof item !== "object") return false;
  const statusId = getStatusId(item.source_url);
  if (!statusId || !citationIds.has(statusId)) return false;
  const handle = String(item.handle ?? "").replace(/^@/, "").toLowerCase();
  if (!ALLOWED_HANDLES.some((allowed) => allowed.toLowerCase() === handle)) return false;
  const timestamp = new Date(item.created_at).getTime();
  const searchWindowMs = 9 * 86_400_000;
  if (!Number.isFinite(timestamp) || timestamp > now.getTime() + 5 * 60_000) return false;
  if (timestamp < now.getTime() - searchWindowMs) return false;
  if (typeof item.text !== "string" || !item.text.trim()) return false;

  const deterministic = classifyPost({
    text: `${item.text} ${item.parent_text_en ?? ""} ${item.scope_en ?? ""}`,
  }).classification;
  if (item.kind === "confirmed_reset" && deterministic !== "confirmed-reset") return false;
  if (item.kind !== "confirmed_reset" && deterministic === "irrelevant") return false;
  return true;
}
