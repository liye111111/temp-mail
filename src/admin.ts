import { createRemoteJWKSet, jwtVerify } from "jose";
import { json } from "./http";
import { sanitizeEmailHtml } from "./mail-html";
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
body{font:14px system-ui;margin:0;background:#f5f7fb;color:#18202c}main{max-width:1200px;margin:auto;padding:28px}h1{margin:0 0 18px}button{cursor:pointer;padding:8px 12px}table{width:100%;border-collapse:collapse;background:#fff}th,td{text-align:left;padding:10px;border-bottom:1px solid #e5e9f0;vertical-align:top}th{background:#eef2f7}.toolbar{display:flex;gap:8px;margin-bottom:14px}.muted{color:#64748b}.panel{background:#fff;padding:18px;margin-top:20px;overflow-wrap:anywhere}.message-meta{line-height:1.7}.message-text{padding:14px;background:#f8fafc;border:1px solid #e5e9f0;white-space:pre-wrap}.message-html{width:100%;min-height:420px;border:1px solid #e5e9f0;background:#fff}a{color:#0759c7}</style></head>
<body><main><h1>GetOpenInbox Admin</h1><div class="toolbar"><button id="reload">Reload</button><button id="previous" disabled>Previous</button><button id="next">Next</button><span id="status" class="muted"></span></div><section id="detail" class="panel" hidden></section><table><thead><tr><th>Inbox</th><th>Created / expires</th><th>Messages</th><th>Latest mail</th></tr></thead><tbody id="rows"></tbody></table></main><script src="/admin/app.js"></script></body></html>`;

export const adminJs = `let cursor=0;const limit=50;const rows=document.querySelector('#rows'),statusEl=document.querySelector('#status'),detail=document.querySelector('#detail');
const dt=v=>new Date(v*1000).toLocaleString();
async function load(){statusEl.textContent='Loading…';const r=await fetch('/admin/api/inboxes?limit='+limit+'&offset='+cursor);if(!r.ok){statusEl.textContent='Access denied or request failed';return}const d=await r.json();rows.innerHTML=d.inboxes.map(i=>'<tr><td><a href="#" data-inbox="'+i.id+'">'+esc(i.address)+'</a></td><td>'+dt(i.created_at)+'<br><span class="muted">'+dt(i.expires_at)+'</span></td><td>'+i.message_count+'</td><td>'+(i.latest_message_id?'<a href="#" data-message="'+i.latest_message_id+'">'+esc(i.latest_subject||'(no subject)')+'</a><br><span class="muted">'+esc(i.latest_sender||'unknown')+'</span>':'—')+'</td></tr>').join('');statusEl.textContent=d.inboxes.length?(cursor+1)+'–'+(cursor+d.inboxes.length):'No inboxes';previous.disabled=cursor===0;next.disabled=d.inboxes.length<limit}
function esc(v){const e=document.createElement('span');e.textContent=String(v);return e.innerHTML}
function renderMessage(d){detail.replaceChildren();const title=document.createElement('h2');title.textContent=d.subject||'(no subject)';const meta=document.createElement('p');meta.className='message-meta muted';meta.textContent='To: '+(d.inbox_address||d.envelope_to||'unknown')+'\\nFrom: '+(d.sender||d.envelope_from||'unknown')+'\\nReceived: '+dt(d.received_at);detail.append(title,meta);if(d.body&&d.body.html){const frame=document.createElement('iframe');frame.className='message-html';frame.title='Email HTML content';frame.setAttribute('sandbox','allow-popups allow-popups-to-escape-sandbox');frame.referrerPolicy='no-referrer';frame.srcdoc='<!doctype html><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src &apos;none&apos;; img-src data:; style-src &apos;unsafe-inline&apos;; form-action &apos;none&apos;; base-uri &apos;none&apos;"><style>body{margin:16px;overflow-wrap:anywhere;font:14px/1.55 system-ui;color:#18202c}img{max-width:100%;height:auto}</style>'+d.body.html;detail.append(frame)}else{const text=document.createElement('pre');text.className='message-text';text.textContent=d.body&&d.body.text?d.body.text:'No message body is available.';detail.append(text)}}
async function showMessage(id){detail.hidden=false;detail.textContent='Loading message…';detail.scrollIntoView({behavior:'smooth',block:'start'});try{const r=await fetch('/admin/api/messages/'+encodeURIComponent(id));const d=await r.json();if(r.ok)renderMessage(d);else detail.textContent=d.error||'Unable to load message'}catch{detail.textContent='Unable to load message'}}
rows.addEventListener('click',async e=>{const target=e.target.closest('[data-message],[data-inbox]');if(!target)return;e.preventDefault();const messageId=target.dataset.message,inboxId=target.dataset.inbox;if(messageId){await showMessage(messageId);return}detail.hidden=false;detail.textContent='Loading…';const r=await fetch('/admin/api/inboxes/'+encodeURIComponent(inboxId)+'/messages');const d=await r.json();if(!r.ok){detail.textContent=d.error||'Unable to load messages';return}detail.innerHTML='<h2>Messages</h2>'+(d.messages.length?d.messages.map(m=>'<p><a href="#" data-detail-message="'+m.id+'">'+esc(m.subject||'(no subject)')+'</a><br><span class="muted">'+esc(m.sender||m.envelope_from||'unknown')+' · '+dt(m.received_at)+' · '+esc(m.status)+'</span></p>').join(''):'No messages')});
detail.addEventListener('click',async e=>{const target=e.target.closest('[data-detail-message]');if(!target)return;e.preventDefault();await showMessage(target.dataset.detailMessage)});
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
  if (body && typeof body === "object" && "html" in body && typeof body.html === "string") {
    body.html = sanitizeEmailHtml(body.html);
  }
  return json({ ...message, body, body_available: body !== null });
}
