// Versioned asset path avoids stale edge-cache entries after deployments.
const API = "https://api.getopeninbox.com";
const locale = document.documentElement.lang === "ja" ? "ja" : document.documentElement.lang.startsWith("zh") ? "zh" : "en";
const translations = {
  en: {
    creating: "Creating your inbox…", createError: "Unable to create inbox", check: "Check for new mail", expired: "Inbox expired", expiredStatus: "This inbox has expired.", expires: "Expires in {time}", checking: "Checking…", retry: "Try again", found: "Check again · {count} found", none: "No mail yet · Check again", auto: "Automatically checking for new mail…", received: "New mail received.", paused: "Automatic checking has paused. Select “Check again now” to keep waiting.", checkNow: "Check again now", processing: "Processing message…", risk: "{level} risk", unknownSender: "Unknown sender", againIn: "Check again in {seconds}s", message: "Message", from: "From: {sender}", unknown: "Unknown", security: "Security check", noReport: "No security report is available for this message.", riskScore: "{level} risk · {score}/100", learnAuth: "Learn about {method} on Wikipedia", noWarnings: "No common warning signs were detected by the lightweight checks.", caution: "Automated checks can miss threats. Treat unexpected messages and links with caution.", htmlPreview: "HTML preview", plainText: "Plain text", raw: "Raw", rawView: "View the original RFC 5322 message source", rawUnavailable: "Raw source is unavailable for this message", noText: "This message has no plain-text content.", frameTitle: "Sandboxed HTML email preview", noHtml: "This message has no HTML content.", loadingRaw: "Loading raw message…", rawMissing: "Raw message source is unavailable.", rawError: "Unable to load the raw message source.", copied: "Copied", copy: "Copy",
    low: "low", medium: "medium", high: "high", pass: "pass", fail: "fail", softfail: "softfail", neutral: "neutral", noneVerdict: "none", temperror: "temporary error", permerror: "permanent error", unknownVerdict: "unknown"
  },
  ja: {
    creating: "受信箱を作成しています…", createError: "受信箱を作成できません", check: "新着メールを確認", expired: "受信箱の有効期限が切れました", expiredStatus: "この受信箱の有効期限は切れています。", expires: "有効期限まで {time}", checking: "確認中…", retry: "もう一度試す", found: "再確認 · {count}件", none: "メールはまだありません · 再確認", auto: "新着メールを自動確認しています…", received: "新着メールを受信しました。", paused: "自動確認を一時停止しました。「今すぐ再確認」を選択してください。", checkNow: "今すぐ再確認", processing: "メールを処理しています…", risk: "リスク：{level}", unknownSender: "送信者不明", againIn: "{seconds}秒後に再確認", message: "メッセージ", from: "送信者：{sender}", unknown: "不明", security: "セキュリティチェック", noReport: "このメールのセキュリティレポートはありません。", riskScore: "リスク：{level} · {score}/100", learnAuth: "Wikipediaで{method}を確認", noWarnings: "簡易チェックでは一般的な警告サインは検出されませんでした。", caution: "自動チェックですべての脅威を検出できるわけではありません。不審なメールやリンクには注意してください。", htmlPreview: "HTMLプレビュー", plainText: "プレーンテキスト", raw: "ソース", rawView: "元のRFC 5322メッセージソースを表示", rawUnavailable: "このメールのソースは利用できません", noText: "このメールにはプレーンテキスト本文がありません。", frameTitle: "サンドボックス化されたHTMLメールプレビュー", noHtml: "このメールにはHTML本文がありません。", loadingRaw: "メールソースを読み込み中…", rawMissing: "メールソースは利用できません。", rawError: "メールソースを読み込めません。", copied: "コピーしました", copy: "コピー",
    low: "低", medium: "中", high: "高", pass: "成功", fail: "失敗", softfail: "ソフトフェイル", neutral: "中立", noneVerdict: "なし", temperror: "一時エラー", permerror: "恒久エラー", unknownVerdict: "不明"
  },
  zh: {
    creating: "正在创建收件箱…", createError: "无法创建收件箱", check: "检查新邮件", expired: "收件箱已过期", expiredStatus: "此收件箱已过期。", expires: "剩余 {time}", checking: "正在检查…", retry: "重试", found: "再次检查 · 已找到 {count} 封", none: "暂无邮件 · 再次检查", auto: "正在自动检查新邮件…", received: "已收到新邮件。", paused: "自动检查已暂停。请选择“立即再次检查”继续等待。", checkNow: "立即再次检查", processing: "正在处理邮件…", risk: "{level}风险", unknownSender: "未知发件人", againIn: "{seconds} 秒后再次检查", message: "邮件", from: "发件人：{sender}", unknown: "未知", security: "安全检查", noReport: "此邮件暂无安全报告。", riskScore: "{level}风险 · {score}/100", learnAuth: "在维基百科了解 {method}", noWarnings: "轻量检查未发现常见警告信号。", caution: "自动检查可能遗漏威胁，请谨慎对待意外邮件和链接。", htmlPreview: "HTML 预览", plainText: "纯文本", raw: "原始邮件", rawView: "查看原始 RFC 5322 邮件源码", rawUnavailable: "此邮件没有可用的原始源码", noText: "此邮件没有纯文本内容。", frameTitle: "沙盒 HTML 邮件预览", noHtml: "此邮件没有 HTML 内容。", loadingRaw: "正在加载原始邮件…", rawMissing: "原始邮件源码不可用。", rawError: "无法加载原始邮件源码。", copied: "已复制", copy: "复制",
    low: "低", medium: "中", high: "高", pass: "通过", fail: "失败", softfail: "软失败", neutral: "中立", noneVerdict: "无", temperror: "临时错误", permerror: "永久错误", unknownVerdict: "未知"
  }
};
const securityMessages = {
  ja: {
    spf_failed: "SPF認証に失敗しました。", dkim_failed: "DKIM認証に失敗しました。", dmarc_failed: "DMARC認証に失敗しました。",
    spf_warning: "SPF認証で警告が返されました。", dkim_warning: "DKIM認証で警告が返されました。", dmarc_warning: "DMARC認証で警告が返されました。",
    authentication_unavailable: "受信ヘッダーに明確なSPF、DKIM、DMARCの結果がありません。", envelope_from_mismatch: "表示上のFromドメインとエンベロープ送信者ドメインが異なります。", reply_to_mismatch: "Reply-Toドメインと表示上の送信者ドメインが異なります。", missing_message_id: "Message-IDヘッダーがありません。", missing_date: "Dateヘッダーがありません。", ip_address_link: "ドメイン名ではなくIPアドレスを使うリンクが含まれています。", punycode_link: "別のドメインに似せた可能性がある国際化ドメインが含まれています。", credential_url: "認証情報を埋め込んだURLが含まれています。", shortened_link: "リンク先を隠す短縮URLが含まれています。", double_extension_attachment: "二重拡張子を使う不審な添付ファイルがあります。", dangerous_attachment: "実行コードを含む可能性がある添付ファイルがあります。"
  },
  zh: {
    spf_failed: "SPF 认证失败。", dkim_failed: "DKIM 认证失败。", dmarc_failed: "DMARC 认证失败。",
    spf_warning: "SPF 认证返回警告。", dkim_warning: "DKIM 认证返回警告。", dmarc_warning: "DMARC 认证返回警告。",
    authentication_unavailable: "收件头中没有明确的 SPF、DKIM 或 DMARC 结果。", envelope_from_mismatch: "可见 From 域名与信封发件人域名不同。", reply_to_mismatch: "Reply-To 域名与可见发件人域名不同。", missing_message_id: "邮件没有 Message-ID 头。", missing_date: "邮件没有 Date 头。", ip_address_link: "邮件包含使用 IP 地址而非域名的链接。", punycode_link: "邮件包含可能在视觉上模仿其他域名的国际化域名。", credential_url: "邮件包含嵌入凭据的 URL。", shortened_link: "邮件包含隐藏目标地址的短链接。", double_extension_attachment: "邮件包含使用可疑双扩展名的附件。", dangerous_attachment: "邮件包含可能执行代码的附件。"
  }
};
function t(key, values = {}) { return Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), translations[locale][key] ?? translations.en[key] ?? key); }
function verdict(value) { return t(value === "none" ? "noneVerdict" : `${value}Verdict`) === `${value}Verdict` ? t(value) : t(value === "none" ? "noneVerdict" : `${value}Verdict`); }
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
  address.textContent = t("creating");
  copy.disabled = true;
  const response = await fetch(`${API}/v1/inboxes`, { method: "POST" });
  if (!response.ok) throw new Error(t("createError"));
  state.inbox = await response.json();
  sessionStorage.setItem("getopeninbox", JSON.stringify(state.inbox));
  address.textContent = state.inbox.address;
  copy.disabled = false;
  checkMail.textContent = t("check");
  checkMail.disabled = false;
  updateCountdown();
  state.countdownTimer = setInterval(updateCountdown, 1000);
  startAutoPolling();
}

function updateCountdown() {
  if (!state.inbox) return;
  const remaining = Math.max(0, state.inbox.expiresAt - Math.floor(Date.now() / 1000));
  expires.textContent = remaining ? t("expires", { time: `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}` }) : t("expired");
  if (!remaining) {
    clearInterval(state.countdownTimer);
    stopAutoPolling();
    pollStatus.textContent = t("expiredStatus");
    checkMail.textContent = t("expired");
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
    checkMail.textContent = t("checking");
  }
  let response;
  try {
    response = await fetch(`${API}/v1/inboxes/${state.inbox.id}/messages`, { headers: auth() });
  } catch {
    if (!background) startCheckCooldown(cooldownUntil, t("retry"));
    return { ok: false, hasMessages: false, hasPending: false };
  }
  if (inboxVersion !== state.inboxVersion || inboxId !== state.inbox?.id) return null;
  if (!response.ok) {
    if (!background) startCheckCooldown(cooldownUntil, t("retry"));
    return { ok: false, hasMessages: false, hasPending: false };
  }
  const data = await response.json();
  const readyLabel = data.messages.length ? t("found", { count: data.messages.length }) : t("none");
  if (!background) startCheckCooldown(cooldownUntil, readyLabel);
  if (data.messages.length) renderMessages(data.messages);
  return {
    ok: true,
    hasMessages: data.messages.length > 0,
    hasPending: data.messages.some((mail) => mail.status === "pending"),
  };
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
  pollStatus.textContent = t("auto");
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
  if (result?.ok && result.hasMessages && !result.hasPending) {
    stopAutoPolling();
    pollStatus.textContent = t("received");
    return;
  }
  if (state.autoPollAttempts >= AUTO_POLL_MAX_ATTEMPTS) {
    stopAutoPolling(false);
    pollStatus.textContent = t("paused");
    pollStatus.classList.add("attention");
    checkMail.classList.add("attention");
    checkMail.textContent = t("checkNow");
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
    subject.textContent = mail.subject || t("processing");
    heading.append(subject);
    if (mail.risk_level) {
      const risk = document.createElement("span");
      risk.className = `risk-badge ${mail.risk_level}`;
      risk.textContent = t("risk", { level: t(mail.risk_level) });
      heading.append(risk);
    }
    const time = document.createElement("small");
    time.textContent = new Date(mail.received_at * 1000).toLocaleTimeString(locale === "zh" ? "zh-CN" : locale, { hour: "2-digit", minute: "2-digit" });
    const sender = document.createElement("small");
    sender.textContent = mail.sender || mail.envelope_from || t("unknownSender");
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
        checkMail.textContent = t("expired");
        checkMail.disabled = true;
        return;
      }
      checkMail.textContent = readyLabel;
      checkMail.disabled = false;
      return;
    }
    checkMail.textContent = t("againIn", { seconds: remaining });
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
  title.textContent = mail.subject || t("message");
  const sender = document.createElement("p");
  sender.textContent = t("from", { sender: mail.sender || mail.envelope_from || t("unknown") });
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
  title.textContent = t("security");
  heading.append(title);

  if (!report) {
    const unavailable = document.createElement("p");
    unavailable.textContent = t("noReport");
    section.append(heading, unavailable);
    return section;
  }

  const badge = document.createElement("span");
  badge.className = `risk-badge ${report.riskLevel}`;
  badge.textContent = t("riskScore", { level: t(report.riskLevel), score: report.riskScore });
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
    link.textContent = `${method}: ${verdict(report.authentication[method.toLowerCase()])}`;
    link.title = t("learnAuth", { method });
    auth.append(link);
  }
  section.append(heading, auth);

  if (report.checks.length) {
    const list = document.createElement("ul");
    for (const check of report.checks) {
      const item = document.createElement("li");
      item.className = check.severity;
      item.textContent = securityMessages[locale]?.[check.code] ?? check.message;
      list.append(item);
    }
    section.append(list);
  } else {
    const clear = document.createElement("p");
    clear.textContent = t("noWarnings");
    section.append(clear);
  }
  const note = document.createElement("small");
  note.textContent = t("caution");
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
  htmlButton.textContent = t("htmlPreview");
  const textButton = document.createElement("button");
  textButton.type = "button";
  textButton.className = "preview-tab";
  textButton.textContent = t("plainText");
  const rawButton = document.createElement("button");
  rawButton.type = "button";
  rawButton.className = "preview-tab";
  rawButton.textContent = t("raw");
  rawButton.disabled = !rawUrl;
  rawButton.title = rawUrl ? t("rawView") : t("rawUnavailable");
  toolbar.append(htmlButton, textButton, rawButton);

  const textBody = document.createElement("div");
  textBody.className = "mail-body";
  textBody.textContent = text || t("noText");

  const htmlFrame = document.createElement("iframe");
  htmlFrame.className = "mail-html-frame";
  htmlFrame.title = t("frameTitle");
  htmlFrame.setAttribute("sandbox", "allow-popups allow-popups-to-escape-sandbox");
  htmlFrame.referrerPolicy = "no-referrer";
  htmlFrame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: cid:; style-src 'unsafe-inline'; font-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'"><style>html{color-scheme:light}body{margin:16px;overflow-wrap:anywhere;font:14px/1.55 system-ui,-apple-system,sans-serif;color:#26322a;background:#fff}img{max-width:100%;height:auto}a{color:#166b43}</style></head><body>${html || `<p>${t("noHtml")}</p>`}</body></html>`;

  const rawBody = document.createElement("pre");
  rawBody.className = "mail-raw";
  rawBody.hidden = true;
  let rawLoaded = false;

  async function loadRaw() {
    if (rawLoaded || !rawUrl) return;
    rawLoaded = true;
    rawBody.textContent = t("loadingRaw");
    try {
      const response = await fetch(rawUrl, { headers: auth() });
      rawBody.textContent = response.ok ? await response.text() : t("rawMissing");
    } catch {
      rawBody.textContent = t("rawError");
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

copy.addEventListener("click", async () => { await navigator.clipboard.writeText(state.inbox.address); copy.textContent = t("copied"); setTimeout(() => { copy.textContent = t("copy"); }, 1200); });
const languagePicker = document.querySelector("#language");
if (languagePicker) {
  languagePicker.value = locale;
  languagePicker.addEventListener("change", () => {
    const target = new URL(location.href);
    target.searchParams.set("language", languagePicker.value);
    location.assign(target.toString());
  });
}
document.querySelector("#new-inbox").addEventListener("click", createInbox);
checkMail.addEventListener("click", async () => {
  stopAutoPolling();
  const result = await refresh(false);
  if (result && (!result.ok || !result.hasMessages || result.hasPending)) startAutoPolling();
});
document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());

try {
  const saved = JSON.parse(sessionStorage.getItem("getopeninbox"));
  if (saved?.expiresAt > Math.floor(Date.now() / 1000)) {
    state.inbox = saved; address.textContent = saved.address; copy.disabled = false; updateCountdown(); state.countdownTimer = setInterval(updateCountdown, 1000);
    startAutoPolling();
  } else createInbox();
} catch { createInbox(); }
