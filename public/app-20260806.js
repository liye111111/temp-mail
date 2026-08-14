// Versioned asset path avoids stale edge-cache entries after deployments.
const API = "https://api.getopeninbox.com";
const AUTO_POLL_INTERVAL_MS = 5000;
const AUTO_POLL_MAX_ATTEMPTS = 30;
const state = { inbox: null, countdownTimer: null, checkCooldownTimer: null, autoPollTimer: null, autoPollAttempts: 0, autoPollGeneration: 0, inboxVersion: 0 };
const address = document.querySelector("#address");
const copy = document.querySelector("#copy");
const expires = document.querySelector("#expires");
const messages = document.querySelector("#messages");
const checkMail = document.querySelector("#check-mail");
const pollStatus = document.querySelector("#poll-status");
const dialog = document.querySelector("#message-dialog");
const detail = document.querySelector("#message-detail");

function auth() { return { authorization: `Bearer ${state.inbox.token}` }; }

async function createInbox() {
  clearInterval(state.countdownTimer);
  clearInterval(state.checkCooldownTimer);
  stopAutoPolling();
  state.inboxVersion += 1;
  address.textContent = "Creating your inbox…";
  copy.disabled = true;
  const response = await fetch(`${API}/v1/inboxes`, { method: "POST" });
  if (!response.ok) throw new Error("Unable to create inbox");
  state.inbox = await response.json();
  sessionStorage.setItem("getopeninbox", JSON.stringify(state.inbox));
  address.textContent = state.inbox.address;
  copy.disabled = false;
  checkMail.textContent = "Check for new mail";
  checkMail.disabled = false;
  updateCountdown();
  state.countdownTimer = setInterval(updateCountdown, 1000);
  startAutoPolling();
}

function updateCountdown() {
  if (!state.inbox) return;
  const remaining = Math.max(0, state.inbox.expiresAt - Math.floor(Date.now() / 1000));
  expires.textContent = remaining ? `Expires in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}` : "Inbox expired";
  if (!remaining) {
    clearInterval(state.countdownTimer);
    stopAutoPolling();
    pollStatus.textContent = "This inbox has expired.";
    checkMail.textContent = "Inbox expired";
    checkMail.disabled = true;
  }
}

async function refresh(background = false) {
  if (!state.inbox) return null;
  const inboxId = state.inbox.id;
  const inboxVersion = state.inboxVersion;
  const cooldownUntil = Date.now() + 5000;
  if (!background) {
    checkMail.disabled = true;
    checkMail.textContent = "Checking…";
  }
  let response;
  try {
    response = await fetch(`${API}/v1/inboxes/${state.inbox.id}/messages`, { headers: auth() });
  } catch {
    if (!background) startCheckCooldown(cooldownUntil, "Try again");
    return { ok: false, hasReady: false };
  }
  if (inboxVersion !== state.inboxVersion || inboxId !== state.inbox?.id) return null;
  if (!response.ok) {
    if (!background) startCheckCooldown(cooldownUntil, "Try again");
    return { ok: false, hasReady: false };
  }
  const data = await response.json();
  const readyLabel = data.messages.length ? `Check again · ${data.messages.length} found` : "No mail yet · Check again";
  if (!background) startCheckCooldown(cooldownUntil, readyLabel);
  if (data.messages.length) renderMessages(data.messages);
  return { ok: true, hasReady: data.messages.some((mail) => mail.status !== "pending") };
}

function stopAutoPolling(clearAttention = true) {
  clearTimeout(state.autoPollTimer);
  state.autoPollTimer = null;
  state.autoPollGeneration += 1;
  if (clearAttention) {
    pollStatus.classList.remove("attention");
    checkMail.classList.remove("attention");
  }
}

function startAutoPolling() {
  stopAutoPolling();
  state.autoPollAttempts = 0;
  pollStatus.textContent = "Automatically checking for new mail…";
  scheduleAutoPoll();
}

function scheduleAutoPoll() {
  clearTimeout(state.autoPollTimer);
  state.autoPollTimer = setTimeout(runAutoPoll, AUTO_POLL_INTERVAL_MS);
}

async function runAutoPoll() {
  if (!state.inbox || state.inbox.expiresAt <= Math.floor(Date.now() / 1000)) {
    stopAutoPolling();
    return;
  }
  if (document.hidden || !navigator.onLine) {
    scheduleAutoPoll();
    return;
  }

  const inboxVersion = state.inboxVersion;
  const autoPollGeneration = state.autoPollGeneration;
  state.autoPollAttempts += 1;
  const result = await refresh(true);
  if (inboxVersion !== state.inboxVersion || autoPollGeneration !== state.autoPollGeneration) return;
  if (result?.hasReady) {
    stopAutoPolling();
    pollStatus.textContent = "New mail received.";
    return;
  }
  if (state.autoPollAttempts >= AUTO_POLL_MAX_ATTEMPTS) {
    stopAutoPolling(false);
    pollStatus.textContent = "Automatic checking has paused. Select “Check again now” to keep waiting.";
    pollStatus.classList.add("attention");
    checkMail.classList.add("attention");
    checkMail.textContent = "Check again now";
    checkMail.disabled = false;
    return;
  }
  scheduleAutoPoll();
}

function renderMessages(mailItems) {
  messages.replaceChildren(...mailItems.map((mail) => {
    const button = document.createElement("button");
    button.className = "message";
    const heading = document.createElement("span");
    heading.className = "message-heading";
    const subject = document.createElement("strong");
    subject.textContent = mail.subject || "Processing message…";
    heading.append(subject);
    if (mail.risk_level) {
      const risk = document.createElement("span");
      risk.className = `risk-badge ${mail.risk_level}`;
      risk.textContent = `${mail.risk_level} risk`;
      heading.append(risk);
    }
    const time = document.createElement("small");
    time.textContent = new Date(mail.received_at * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const sender = document.createElement("small");
    sender.textContent = mail.sender || mail.envelope_from || "Unknown sender";
    const code = document.createElement("span");
    code.className = "code";
    code.textContent = mail.verification_code || "";
    button.append(heading, time, sender, code);
    button.addEventListener("click", () => openMessage(mail.id));
    return button;
  }));
}

function startCheckCooldown(cooldownUntil, readyLabel) {
  clearInterval(state.checkCooldownTimer);
  const update = () => {
    const remaining = Math.ceil((cooldownUntil - Date.now()) / 1000);
    if (remaining <= 0) {
      clearInterval(state.checkCooldownTimer);
      if (!state.inbox || state.inbox.expiresAt <= Math.floor(Date.now() / 1000)) {
        checkMail.textContent = "Inbox expired";
        checkMail.disabled = true;
        return;
      }
      checkMail.textContent = readyLabel;
      checkMail.disabled = false;
      return;
    }
    checkMail.textContent = `Check again in ${remaining}s`;
    checkMail.disabled = true;
  };
  update();
  state.checkCooldownTimer = setInterval(update, 250);
}

async function openMessage(id) {
  const response = await fetch(`${API}/v1/inboxes/${state.inbox.id}/messages/${id}`, { headers: auth() });
  if (!response.ok) return;
  const mail = await response.json();
  detail.replaceChildren();
  const title = document.createElement("h2");
  title.textContent = mail.subject || "Message";
  const sender = document.createElement("p");
  sender.textContent = `From: ${mail.sender || mail.envelope_from || "Unknown"}`;
  const security = renderSecurityReport(mail.security);
  const rawUrl = mail.raw_available ? `${API}/v1/inboxes/${state.inbox.id}/messages/${id}/raw` : null;
  const body = renderMailBody(mail.body, rawUrl);
  detail.append(title, sender, security, body);
  dialog.showModal();
}

function renderSecurityReport(report) {
  const section = document.createElement("section");
  section.className = "security-report";
  const heading = document.createElement("div");
  heading.className = "security-heading";
  const title = document.createElement("h3");
  title.textContent = "Security check";
  heading.append(title);

  if (!report) {
    const unavailable = document.createElement("p");
    unavailable.textContent = "No security report is available for this message.";
    section.append(heading, unavailable);
    return section;
  }

  const badge = document.createElement("span");
  badge.className = `risk-badge ${report.riskLevel}`;
  badge.textContent = `${report.riskLevel} risk · ${report.riskScore}/100`;
  heading.append(badge);
  const auth = document.createElement("p");
  auth.className = "authentication-results";
  const authenticationDocs = {
    SPF: "https://en.wikipedia.org/wiki/Sender_Policy_Framework",
    DKIM: "https://en.wikipedia.org/wiki/DomainKeys_Identified_Mail",
    DMARC: "https://en.wikipedia.org/wiki/DMARC",
  };
  for (const [index, [method, url]] of Object.entries(authenticationDocs).entries()) {
    if (index) auth.append(" · ");
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = `${method}: ${report.authentication[method.toLowerCase()]}`;
    link.title = `Learn about ${method} on Wikipedia`;
    auth.append(link);
  }
  section.append(heading, auth);

  if (report.checks.length) {
    const list = document.createElement("ul");
    for (const check of report.checks) {
      const item = document.createElement("li");
      item.className = check.severity;
      item.textContent = check.message;
      list.append(item);
    }
    section.append(list);
  } else {
    const clear = document.createElement("p");
    clear.textContent = "No common warning signs were detected by the lightweight checks.";
    section.append(clear);
  }
  const note = document.createElement("small");
  note.textContent = "Automated checks can miss threats. Treat unexpected messages and links with caution.";
  section.append(note);
  return section;
}

function renderMailBody(content = {}, rawUrl = null) {
  const container = document.createElement("section");
  container.className = "mail-preview";
  const text = typeof content.text === "string" ? content.text : "";
  const html = typeof content.html === "string" ? content.html : "";

  const toolbar = document.createElement("div");
  toolbar.className = "mail-preview-toolbar";
  const htmlButton = document.createElement("button");
  htmlButton.type = "button";
  htmlButton.className = "preview-tab";
  htmlButton.textContent = "HTML preview";
  const textButton = document.createElement("button");
  textButton.type = "button";
  textButton.className = "preview-tab";
  textButton.textContent = "Plain text";
  const rawButton = document.createElement("button");
  rawButton.type = "button";
  rawButton.className = "preview-tab";
  rawButton.textContent = "Raw";
  rawButton.disabled = !rawUrl;
  rawButton.title = rawUrl ? "View the original RFC 5322 message source" : "Raw source is unavailable for this message";
  toolbar.append(htmlButton, textButton, rawButton);

  const textBody = document.createElement("div");
  textBody.className = "mail-body";
  textBody.textContent = text || "This message has no plain-text content.";

  const htmlFrame = document.createElement("iframe");
  htmlFrame.className = "mail-html-frame";
  htmlFrame.title = "Sandboxed HTML email preview";
  htmlFrame.setAttribute("sandbox", "");
  htmlFrame.referrerPolicy = "no-referrer";
  htmlFrame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: cid:; style-src 'unsafe-inline'; font-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'"><style>html{color-scheme:light}body{margin:16px;overflow-wrap:anywhere;font:14px/1.55 system-ui,-apple-system,sans-serif;color:#26322a;background:#fff}img{max-width:100%;height:auto}a{color:#166b43}</style></head><body>${html || "<p>This message has no HTML content.</p>"}</body></html>`;

  const rawBody = document.createElement("pre");
  rawBody.className = "mail-raw";
  rawBody.hidden = true;
  let rawLoaded = false;

  async function loadRaw() {
    if (rawLoaded || !rawUrl) return;
    rawLoaded = true;
    rawBody.textContent = "Loading raw message…";
    try {
      const response = await fetch(rawUrl, { headers: auth() });
      rawBody.textContent = response.ok ? await response.text() : "Raw message source is unavailable.";
    } catch {
      rawBody.textContent = "Unable to load the raw message source.";
    }
  }

  const show = (mode) => {
    const showHtml = mode === "html";
    const showRaw = mode === "raw";
    htmlFrame.hidden = !showHtml;
    textBody.hidden = showHtml || showRaw;
    rawBody.hidden = !showRaw;
    htmlButton.classList.toggle("active", showHtml);
    textButton.classList.toggle("active", !showHtml && !showRaw);
    rawButton.classList.toggle("active", showRaw);
    htmlButton.setAttribute("aria-pressed", String(showHtml));
    textButton.setAttribute("aria-pressed", String(!showHtml && !showRaw));
    rawButton.setAttribute("aria-pressed", String(showRaw));
    if (showRaw) loadRaw();
  };
  htmlButton.addEventListener("click", () => show("html"));
  textButton.addEventListener("click", () => show("text"));
  rawButton.addEventListener("click", () => show("raw"));
  if (!html) htmlButton.disabled = true;
  if (!text) textButton.disabled = true;

  container.append(toolbar, htmlFrame, textBody, rawBody);
  show(html ? "html" : "text");
  return container;
}

copy.addEventListener("click", async () => { await navigator.clipboard.writeText(state.inbox.address); copy.textContent = "Copied"; setTimeout(() => { copy.textContent = "Copy"; }, 1200); });
document.querySelector("#new-inbox").addEventListener("click", createInbox);
checkMail.addEventListener("click", async () => {
  stopAutoPolling();
  const result = await refresh(false);
  if (result && !result.hasReady) startAutoPolling();
});
document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());

try {
  const saved = JSON.parse(sessionStorage.getItem("getopeninbox"));
  if (saved?.expiresAt > Math.floor(Date.now() / 1000)) {
    state.inbox = saved; address.textContent = saved.address; copy.disabled = false; updateCountdown(); state.countdownTimer = setInterval(updateCountdown, 1000);
    startAutoPolling();
  } else createInbox();
} catch { createInbox(); }
