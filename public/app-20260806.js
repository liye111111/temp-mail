// Versioned asset path avoids stale edge-cache entries after deployments.
const API = "https://api.getopeninbox.com";
const state = { inbox: null, countdownTimer: null, checkCooldownTimer: null, pendingRefreshTimer: null };
const address = document.querySelector("#address");
const copy = document.querySelector("#copy");
const expires = document.querySelector("#expires");
const messages = document.querySelector("#messages");
const checkMail = document.querySelector("#check-mail");
const dialog = document.querySelector("#message-dialog");
const detail = document.querySelector("#message-detail");

function auth() { return { authorization: `Bearer ${state.inbox.token}` }; }

async function createInbox() {
  clearInterval(state.countdownTimer);
  clearInterval(state.checkCooldownTimer);
  clearTimeout(state.pendingRefreshTimer);
  address.textContent = "Creating your inbox…";
  copy.disabled = true;
  const response = await fetch(`${API}/v1/inboxes`, { method: "POST" });
  if (!response.ok) throw new Error("Unable to create inbox");
  state.inbox = await response.json();
  sessionStorage.setItem("getopeninbox", JSON.stringify(state.inbox));
  address.textContent = state.inbox.address;
  copy.disabled = false;
  updateCountdown();
  state.countdownTimer = setInterval(updateCountdown, 1000);
}

function updateCountdown() {
  if (!state.inbox) return;
  const remaining = Math.max(0, state.inbox.expiresAt - Math.floor(Date.now() / 1000));
  expires.textContent = remaining ? `Expires in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}` : "Inbox expired";
  if (!remaining) { clearInterval(state.countdownTimer); checkMail.disabled = true; }
}

async function refresh(background = false, pendingAttempt = 0) {
  if (!state.inbox) return;
  const cooldownUntil = Date.now() + 5000;
  if (!background) {
    clearTimeout(state.pendingRefreshTimer);
    checkMail.disabled = true;
    checkMail.textContent = "Checking…";
  }
  let response;
  try {
    response = await fetch(`${API}/v1/inboxes/${state.inbox.id}/messages`, { headers: auth() });
  } catch {
    if (!background) startCheckCooldown(cooldownUntil, "Try again");
    return;
  }
  if (!response.ok) {
    if (!background) startCheckCooldown(cooldownUntil, "Try again");
    return;
  }
  const data = await response.json();
  const readyLabel = data.messages.length ? `Check again · ${data.messages.length} found` : "No mail yet · Check again";
  if (!background) startCheckCooldown(cooldownUntil, readyLabel);
  if (!data.messages.length) return;
  renderMessages(data.messages);
  const hasPending = data.messages.some((mail) => mail.status === "pending");
  if (hasPending && pendingAttempt < 5) {
    clearTimeout(state.pendingRefreshTimer);
    state.pendingRefreshTimer = setTimeout(() => refresh(true, pendingAttempt + 1), 2000);
  }
}

function renderMessages(mailItems) {
  messages.replaceChildren(...mailItems.map((mail) => {
    const button = document.createElement("button");
    button.className = "message";
    const subject = document.createElement("strong");
    subject.textContent = mail.subject || "Processing message…";
    const time = document.createElement("small");
    time.textContent = new Date(mail.received_at * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const sender = document.createElement("small");
    sender.textContent = mail.sender || mail.envelope_from || "Unknown sender";
    const code = document.createElement("span");
    code.className = "code";
    code.textContent = mail.verification_code || "";
    button.append(subject, time, sender, code);
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
  const body = document.createElement("div");
  body.className = "mail-body";
  body.textContent = mail.body?.text || "This message has no plain-text content.";
  detail.append(title, sender, body);
  dialog.showModal();
}

copy.addEventListener("click", async () => { await navigator.clipboard.writeText(state.inbox.address); copy.textContent = "Copied"; setTimeout(() => { copy.textContent = "Copy"; }, 1200); });
document.querySelector("#new-inbox").addEventListener("click", createInbox);
checkMail.addEventListener("click", () => refresh(false, 0));
document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());

try {
  const saved = JSON.parse(sessionStorage.getItem("getopeninbox"));
  if (saved?.expiresAt > Math.floor(Date.now() / 1000)) {
    state.inbox = saved; address.textContent = saved.address; copy.disabled = false; updateCountdown(); state.countdownTimer = setInterval(updateCountdown, 1000);
  } else createInbox();
} catch { createInbox(); }
