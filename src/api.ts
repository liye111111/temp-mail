import { corsHeaders, json } from "./http";
import { createSessionToken, randomId, verifySessionToken } from "./security";
import type { BaseEnv, InboxRow, MessageRow } from "./types";
import { adminHtml, adminJs, authenticateAdmin, getAdminMessage, listAdminInboxes, listAdminMessages } from "./admin";

function bearer(request: Request): string {
  const value = request.headers.get("authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice(7) : "";
}

async function authorize(request: Request, env: BaseEnv, inboxId: string): Promise<boolean> {
  return verifySessionToken(bearer(request), inboxId, env.SESSION_HMAC_SECRET);
}

async function createInbox(env: BaseEnv): Promise<Response> {
  const now = Math.floor(Date.now() / 1000);
  const ttl = Number(env.INBOX_TTL_SECONDS);
  const id = crypto.randomUUID();
  const localPart = randomId(9);
  const address = `${localPart}@${env.INBOX_DOMAIN}`;
  const expiresAt = now + ttl;
  await env.DB.prepare(
    "INSERT INTO inboxes (id, address, local_part, domain, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).bind(id, address, localPart, env.INBOX_DOMAIN, now, expiresAt).run();
  return json({
    id,
    address,
    expiresAt,
    token: await createSessionToken(id, expiresAt, env.SESSION_HMAC_SECRET),
  }, 201);
}

async function getInbox(env: BaseEnv, inboxId: string): Promise<InboxRow | null> {
  return env.DB.prepare("SELECT id, address, expires_at FROM inboxes WHERE id = ? AND expires_at > ?")
    .bind(inboxId, Math.floor(Date.now() / 1000)).first<InboxRow>();
}

async function listMessages(request: Request, env: BaseEnv, inboxId: string): Promise<Response> {
  if (!(await authorize(request, env, inboxId))) return json({ error: "unauthorized" }, 401);
  const inbox = await getInbox(env, inboxId);
  if (!inbox) return json({ error: "inbox_expired" }, 410);
  const result = await env.DB.prepare(
    "SELECT id, sender, envelope_from, subject, verification_code, status, received_at, parsed_object_key, NULL AS text_body, NULL AS html_body FROM messages WHERE inbox_id = ? ORDER BY received_at DESC LIMIT ?",
  ).bind(inboxId, Number(env.MAX_MESSAGES_PER_INBOX)).all<MessageRow>();
  return json({ inbox, messages: result.results });
}

async function getMessage(request: Request, env: BaseEnv, inboxId: string, messageId: string): Promise<Response> {
  if (!(await authorize(request, env, inboxId))) return json({ error: "unauthorized" }, 401);
  const message = await env.DB.prepare(
    "SELECT id, sender, envelope_from, subject, verification_code, status, received_at, parsed_object_key, text_body, html_body FROM messages WHERE id = ? AND inbox_id = ?",
  ).bind(messageId, inboxId).first<MessageRow>();
  if (!message) return json({ error: "message_not_found" }, 404);
  let body: { text?: string; html?: string } = {};
  if (message.parsed_object_key && env.MAIL_BUCKET) {
    const object = await env.MAIL_BUCKET.get(message.parsed_object_key);
    if (object) body = await object.json<typeof body>();
  } else {
    body = { text: message.text_body ?? "", html: message.html_body ?? "" };
  }
  return json({ ...message, body });
}

async function deleteInbox(request: Request, env: BaseEnv, inboxId: string): Promise<Response> {
  if (!(await authorize(request, env, inboxId))) return json({ error: "unauthorized" }, 401);
  const keys = await env.DB.prepare("SELECT raw_object_key, parsed_object_key FROM messages WHERE inbox_id = ?")
    .bind(inboxId).all<{ raw_object_key: string; parsed_object_key: string | null }>();
  const objectKeys = keys.results.flatMap((row) => [row.raw_object_key, row.parsed_object_key].filter(Boolean) as string[]);
  if (objectKeys.length && env.MAIL_BUCKET) await env.MAIL_BUCKET.delete(objectKeys);
  await env.DB.prepare("DELETE FROM inboxes WHERE id = ?").bind(inboxId).run();
  return new Response(null, { status: 204 });
}

async function cleanup(env: BaseEnv): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  if (env.DELETE_EXPIRED_D1_DATA !== "false") {
    const expired = await env.DB.prepare(
      "SELECT m.raw_object_key, m.parsed_object_key FROM messages m JOIN inboxes i ON i.id = m.inbox_id WHERE i.expires_at <= ? LIMIT 500",
    ).bind(now).all<{ raw_object_key: string; parsed_object_key: string | null }>();
    const keys = expired.results.flatMap((row) => [row.raw_object_key, row.parsed_object_key].filter(Boolean) as string[]);
    if (keys.length && env.MAIL_BUCKET) await env.MAIL_BUCKET.delete(keys);
    await env.DB.prepare("DELETE FROM inboxes WHERE expires_at <= ?").bind(now).run();
  }
  await env.DB.prepare("DELETE FROM mail_rate_limits WHERE updated_at < ?").bind(now - 86400).run();
}

export default {
  async fetch(request: Request, env: BaseEnv): Promise<Response> {
    const origin = request.headers.get("origin");
    const cors = corsHeaders(origin, env.APP_BASE_URL);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url);
    let response: Response;
    try {
      const requestHostname = (request.headers.get("host") ?? url.hostname).split(":")[0].toLowerCase();
      const isAdminHost = Boolean(env.ADMIN_HOSTNAME) && requestHostname === env.ADMIN_HOSTNAME.toLowerCase();
      const isAdminRoute = (url.pathname === "/" && isAdminHost) || url.pathname.startsWith("/admin");
      if (isAdminRoute) {
        const identity = await authenticateAdmin(request, env);
        if (!identity) {
          response = json({ error: "admin_access_denied" }, 403);
        } else if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/admin" || url.pathname === "/admin/")) {
          response = new Response(adminHtml, { headers: { "content-type": "text/html; charset=utf-8" } });
        } else if (request.method === "GET" && url.pathname === "/admin/app.js") {
          response = new Response(adminJs, { headers: { "content-type": "text/javascript; charset=utf-8" } });
        } else if (request.method === "GET" && url.pathname === "/admin/api/inboxes") {
          response = await listAdminInboxes(url, env);
        } else {
          const adminMessageMatch = url.pathname.match(/^\/admin\/api\/messages\/([^/]+)$/);
          const adminInboxMessagesMatch = url.pathname.match(/^\/admin\/api\/inboxes\/([^/]+)\/messages$/);
          if (request.method === "GET" && adminMessageMatch) {
            response = await getAdminMessage(decodeURIComponent(adminMessageMatch[1]), env);
          } else if (request.method === "GET" && adminInboxMessagesMatch) {
            response = await listAdminMessages(decodeURIComponent(adminInboxMessagesMatch[1]), env);
          } else {
            response = json({ error: "not_found" }, 404);
          }
        }
      } else if (request.method === "GET" && url.pathname === "/health") {
        response = json({ ok: true, service: "getopeninbox-api" });
      } else if (request.method === "POST" && url.pathname === "/v1/inboxes") {
        response = await createInbox(env);
      } else {
        const messageMatch = url.pathname.match(/^\/v1\/inboxes\/([^/]+)\/messages\/([^/]+)$/);
        const inboxMatch = url.pathname.match(/^\/v1\/inboxes\/([^/]+)(?:\/messages)?$/);
        if (request.method === "GET" && messageMatch) {
          response = await getMessage(request, env, messageMatch[1], messageMatch[2]);
        } else if (request.method === "GET" && inboxMatch && url.pathname.endsWith("/messages")) {
          response = await listMessages(request, env, inboxMatch[1]);
        } else if (request.method === "DELETE" && inboxMatch && !url.pathname.endsWith("/messages")) {
          response = await deleteInbox(request, env, inboxMatch[1]);
        } else {
          response = json({ error: "not_found" }, 404);
        }
      }
    } catch (error) {
      console.error("api_error", error);
      response = json({ error: "internal_error" }, 500);
    }
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(cors)) headers.set(key, value);
    headers.set("x-content-type-options", "nosniff");
    headers.set("cache-control", "no-store");
    headers.set("referrer-policy", "no-referrer");
    headers.set("content-security-policy", "default-src 'self'; script-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
    return new Response(response.body, { status: response.status, headers });
  },
  async scheduled(_controller: ScheduledController, env: BaseEnv, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(cleanup(env));
  },
};
