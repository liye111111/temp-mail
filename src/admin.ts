import { createRemoteJWKSet, jwtVerify } from "jose";
import { json } from "./http";
import type { BaseEnv } from "./types";

type AdminIdentity = { email: string };

export async function authenticateAdmin(request: Request, env: BaseEnv): Promise<AdminIdentity | null> {
  if (env.ADMIN_ENABLED !== "true" || !env.ADMIN_ACCESS_TEAM_DOMAIN || !env.ADMIN_ACCESS_AUD) return null;
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) return null;
  try {
    const issuer = env.ADMIN_ACCESS_TEAM_DOMAIN.replace(/\/$/, "");
    const jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    const { payload } = await jwtVerify(token, jwks, { issuer, audience: env.ADMIN_ACCESS_AUD });
    const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
    const allowed = env.ADMIN_ALLOWED_EMAILS.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
    return email && allowed.includes(email) ? { email } : null;
  } catch (error) {
    console.warn("admin_access_rejected", error instanceof Error ? error.message : "invalid_token");
    return null;
  }
}

export const adminHtml = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>GetOpenInbox Admin</title><style>
body{font:14px system-ui;margin:0;background:#f5f7fb;color:#18202c}main{max-width:1200px;margin:auto;padding:28px}h1{margin:0 0 18px}button{cursor:pointer;padding:8px 12px}table{width:100%;border-collapse:collapse;background:#fff}th,td{text-align:left;padding:10px;border-bottom:1px solid #e5e9f0;vertical-align:top}th{background:#eef2f7}.toolbar{display:flex;gap:8px;margin-bottom:14px}.muted{color:#64748b}.panel{background:#fff;padding:18px;margin-top:20px;white-space:pre-wrap;overflow-wrap:anywhere}a{color:#0759c7}</style></head>
<body><main><h1>GetOpenInbox Admin</h1><div class="toolbar"><button id="reload">Reload</button><button id="previous" disabled>Previous</button><button id="next">Next</button><span id="status" class="muted"></span></div><table><thead><tr><th>Inbox</th><th>Created / expires</th><th>Messages</th><th>Latest mail</th></tr></thead><tbody id="rows"></tbody></table><section id="detail" class="panel" hidden></section></main><script src="/admin/app.js"></script></body></html>`;

export const adminJs = `let cursor=0;const limit=50;const rows=document.querySelector('#rows'),statusEl=document.querySelector('#status'),detail=document.querySelector('#detail');
const dt=v=>new Date(v*1000).toLocaleString();
async function load(){statusEl.textContent='Loading…';const r=await fetch('/admin/api/inboxes?limit='+limit+'&offset='+cursor);if(!r.ok){statusEl.textContent='Access denied or request failed';return}const d=await r.json();rows.innerHTML=d.inboxes.map(i=>'<tr><td><a href="#" data-inbox="'+i.id+'">'+esc(i.address)+'</a></td><td>'+dt(i.created_at)+'<br><span class="muted">'+dt(i.expires_at)+'</span></td><td>'+i.message_count+'</td><td>'+(i.latest_message_id?'<a href="#" data-message="'+i.latest_message_id+'">'+esc(i.latest_subject||'(no subject)')+'</a><br><span class="muted">'+esc(i.latest_sender||'unknown')+'</span>':'—')+'</td></tr>').join('');statusEl.textContent=d.inboxes.length?(cursor+1)+'–'+(cursor+d.inboxes.length):'No inboxes';previous.disabled=cursor===0;next.disabled=d.inboxes.length<limit}
function esc(v){const e=document.createElement('span');e.textContent=String(v);return e.innerHTML}
rows.addEventListener('click',async e=>{const messageId=e.target.dataset.message,inboxId=e.target.dataset.inbox;if(!messageId&&!inboxId)return;e.preventDefault();detail.hidden=false;detail.textContent='Loading…';if(messageId){const r=await fetch('/admin/api/messages/'+encodeURIComponent(messageId));const d=await r.json();detail.textContent=r.ok?JSON.stringify(d,null,2):(d.error||'Unable to load message');return}const r=await fetch('/admin/api/inboxes/'+encodeURIComponent(inboxId)+'/messages');const d=await r.json();if(!r.ok){detail.textContent=d.error||'Unable to load messages';return}detail.innerHTML='<h2>Messages</h2>'+(d.messages.length?d.messages.map(m=>'<p><a href="#" data-detail-message="'+m.id+'">'+esc(m.subject||'(no subject)')+'</a><br><span class="muted">'+esc(m.sender||m.envelope_from||'unknown')+' · '+dt(m.received_at)+' · '+esc(m.status)+'</span></p>').join(''):'No messages')});
detail.addEventListener('click',async e=>{const id=e.target.dataset.detailMessage;if(!id)return;e.preventDefault();detail.textContent='Loading message…';const r=await fetch('/admin/api/messages/'+encodeURIComponent(id));const d=await r.json();detail.textContent=r.ok?JSON.stringify(d,null,2):(d.error||'Unable to load message')});
reload.onclick=load;previous.onclick=()=>{cursor=Math.max(0,cursor-limit);load()};next.onclick=()=>{cursor+=limit;load()};load();`;

export async function listAdminInboxes(url: URL, env: BaseEnv): Promise<Response> {
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
  const result = await env.DB.prepare(`SELECT i.id, i.address, i.created_at, i.expires_at,
    COUNT(m.id) AS message_count,
    (SELECT id FROM messages WHERE inbox_id=i.id ORDER BY received_at DESC LIMIT 1) AS latest_message_id,
    (SELECT subject FROM messages WHERE inbox_id=i.id ORDER BY received_at DESC LIMIT 1) AS latest_subject,
    (SELECT sender FROM messages WHERE inbox_id=i.id ORDER BY received_at DESC LIMIT 1) AS latest_sender
    FROM inboxes i LEFT JOIN messages m ON m.inbox_id=i.id
    GROUP BY i.id ORDER BY i.created_at DESC LIMIT ? OFFSET ?`).bind(limit, offset).all();
  return json({ inboxes: result.results });
}

export async function listAdminMessages(inboxId: string, env: BaseEnv): Promise<Response> {
  const inbox = await env.DB.prepare("SELECT id, address, created_at, expires_at FROM inboxes WHERE id=?")
    .bind(inboxId).first();
  if (!inbox) return json({ error: "inbox_not_found" }, 404);
  const result = await env.DB.prepare(`SELECT id, sender, envelope_from, subject, verification_code,
    status, size_bytes, received_at, parsed_at FROM messages WHERE inbox_id=?
    ORDER BY received_at DESC LIMIT 500`).bind(inboxId).all();
  return json({ inbox, messages: result.results });
}

export async function getAdminMessage(messageId: string, env: BaseEnv): Promise<Response> {
  const message = await env.DB.prepare(`SELECT m.*, i.address AS inbox_address FROM messages m
    JOIN inboxes i ON i.id=m.inbox_id WHERE m.id=?`).bind(messageId).first<Record<string, unknown>>();
  if (!message) return json({ error: "message_not_found" }, 404);
  let body: unknown = null;
  if (typeof message.parsed_object_key === "string" && env.MAIL_BUCKET) {
    const object = await env.MAIL_BUCKET.get(message.parsed_object_key);
    if (object) body = await object.json();
  } else if (message.text_body || message.html_body) {
    body = { text: message.text_body ?? "", html: message.html_body ?? "" };
  }
  return json({ ...message, body, body_available: body !== null });
}
