/**
 * Local-only email header paste analyzer for /tools/email-header-analyzer/.
 * Pasted content never leaves the browser (no fetch / XHR / Beacon).
 */
(() => {
  const mount = document.getElementById("header-analyzer-app");
  if (!mount) return;

  const locale = document.documentElement.lang === "ja"
    ? "ja"
    : document.documentElement.lang.startsWith("zh")
      ? "zh"
      : "en";

  const AUTH_VERDICTS = "pass|fail|softfail|neutral|none|temperror|permerror";

  const copy = {
    en: {
      pasteTab: "Paste headers",
      inboxTab: "Receive & analyze",
      privacy: "Processed in your browser. Pasted headers are not uploaded to GetOpenInbox.",
      pasteHint: "Paste full headers or a “Show original” message. Headers only are enough for SPF/DKIM/DMARC reading.",
      placeholder: "Paste email headers here…",
      analyze: "Analyze",
      clear: "Clear",
      sample: "Load sample",
      empty: "Paste headers, then select Analyze.",
      invalid: "No recognizable header fields found. Paste the full header block (or Show original).",
      identity: "Identity fields",
      auth: "Authentication results",
      authNote: "Values come from Authentication-Results in the pasted text (usually added by a receiving system). Pass ≠ safe.",
      received: "Received chain",
      receivedNote: "Servers typically prepend Received headers, so the top hop is usually the most recent. Earlier hops can be forged before a trusted receiver.",
      hop: "Hop {n} (top = newer)",
      hopBottom: "Hop {n} (bottom = older)",
      missing: "Not found",
      unknown: "unknown",
      caution: "Automated checks explain technical signals only. They cannot prove that a sender or message is safe.",
      noAuth: "No conclusive SPF, DKIM, or DMARC result was found in Authentication-Results.",
      inboxTitle: "Analyze a message in a temporary inbox",
      inboxBody: "Create a disposable address, send a test message to it, then review authentication, risk signals, and raw source in the inbox session (~10 minutes).",
      inboxCta: "Open temporary inbox",
      from: "From",
      returnPath: "Return-Path",
      replyTo: "Reply-To",
      subject: "Subject",
      messageId: "Message-ID",
      date: "Date",
    },
    ja: {
      pasteTab: "ヘッダーを貼り付け",
      inboxTab: "受信して解析",
      privacy: "ブラウザー内で処理します。貼り付けたヘッダーは GetOpenInbox にアップロードされません。",
      pasteHint: "完全なヘッダー、または「メッセージのソースを表示」の全文を貼り付けてください。認証の読み取りにはヘッダーだけで十分です。",
      placeholder: "メールヘッダーをここに貼り付け…",
      analyze: "解析",
      clear: "クリア",
      sample: "サンプルを読み込む",
      empty: "ヘッダーを貼り付けてから「解析」を選択してください。",
      invalid: "認識できるヘッダーが見つかりません。ヘッダー全体（またはソース表示）を貼り付けてください。",
      identity: "差出人まわりのフィールド",
      auth: "認証結果",
      authNote: "貼り付けテキスト内の Authentication-Results（通常は受信側が追加）から読み取ります。pass ≠ 安全。",
      received: "Received チェーン",
      receivedNote: "一般に Received は先頭に追加されるため、上側ほど新しいホップです。信頼できる受信前のホップは偽造され得ます。",
      hop: "ホップ {n}（上＝新しい）",
      hopBottom: "ホップ {n}（下＝古い）",
      missing: "なし",
      unknown: "不明",
      caution: "自動チェックは技術的な信号の説明に過ぎません。送信者や内容が安全であることの証明にはなりません。",
      noAuth: "Authentication-Results に明確な SPF / DKIM / DMARC 結果がありません。",
      inboxTitle: "一時受信箱でメールを解析",
      inboxBody: "使い捨てアドレスを作り、テストメールを送ると、認証・リスク信号・生ソースをセッション内（約10分）で確認できます。",
      inboxCta: "一時受信箱を開く",
      from: "From",
      returnPath: "Return-Path",
      replyTo: "Reply-To",
      subject: "Subject",
      messageId: "Message-ID",
      date: "Date",
    },
    zh: {
      pasteTab: "粘贴邮件头",
      inboxTab: "收信再分析",
      privacy: "在浏览器本地处理。粘贴的邮件头不会上传到 GetOpenInbox。",
      pasteHint: "粘贴完整邮件头，或「显示原始邮件 / Show original」全文。解读 SPF/DKIM/DMARC 通常只需邮件头。",
      placeholder: "在此粘贴邮件头…",
      analyze: "分析",
      clear: "清空",
      sample: "加载示例",
      empty: "请先粘贴邮件头，再选择「分析」。",
      invalid: "未识别到有效邮件头字段。请粘贴完整邮件头（或原始邮件）。",
      identity: "身份相关字段",
      auth: "认证结果",
      authNote: "数值来自粘贴文本中的 Authentication-Results（通常由接收方添加）。通过 ≠ 安全。",
      received: "Received 投递链",
      receivedNote: "服务器通常把 Received 加在顶部，因此上方多为较新的跳点。可信接收方之前的跳点可能被伪造。",
      hop: "第 {n} 跳（上=较新）",
      hopBottom: "第 {n} 跳（下=较早）",
      missing: "未找到",
      unknown: "未知",
      caution: "自动检查仅解释技术信号，不能证明发件人或内容安全。",
      noAuth: "Authentication-Results 中没有明确的 SPF、DKIM 或 DMARC 结果。",
      inboxTitle: "用临时收件箱分析邮件",
      inboxBody: "创建一次性地址并发送测试邮件后，可在会话内（约 10 分钟）查看认证、风险信号与原始源码。",
      inboxCta: "打开临时收件箱",
      from: "From",
      returnPath: "Return-Path",
      replyTo: "Reply-To",
      subject: "Subject",
      messageId: "Message-ID",
      date: "Date",
    },
  }[locale];

  const sampleHeaders = `Delivered-To: you@example.com
Return-Path: <bounce@mail.example-sender.com>
Received: from mx.example-receiver.net (mx.example-receiver.net [203.0.113.10])
        by inbox.example-receiver.net with ESMTPS id abc123
        for <you@example.com>; Fri, 27 Nov 2026 01:00:02 +0000
Received: from mail.example-sender.com (mail.example-sender.com [198.51.100.20])
        by mx.example-receiver.net with ESMTPS id def456
        for <you@example.com>; Fri, 27 Nov 2026 01:00:01 +0000
Authentication-Results: mx.example-receiver.net;
        dkim=pass header.d=example-sender.com header.s=s1;
        spf=pass smtp.mailfrom=bounce@mail.example-sender.com;
        dmarc=pass (p=none) header.from=example-sender.com
DKIM-Signature: v=1; a=rsa-sha256; d=example-sender.com; s=s1; c=relaxed/relaxed;
        h=from:to:subject:date:message-id; bh=abc; b=xyz
From: "Example Sender" <alerts@example-sender.com>
Reply-To: support@example-sender.com
To: you@example.com
Subject: Sample message for header analysis
Message-ID: <sample-20261127@example-sender.com>
Date: Fri, 27 Nov 2026 01:00:00 +0000
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8

This sample body is ignored by the header-only parser.
`;

  const homePath = locale === "en" ? "/" : `/${locale}/`;

  function t(key, vars = {}) {
    return String(copy[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");
  }

  function parseHeaderBlock(raw) {
    const text = String(raw ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const headerPart = text.split(/\n\n/)[0] ?? text;
    const unfolded = [];
    for (const line of headerPart.split("\n")) {
      if (/^[ \t]/.test(line) && unfolded.length) {
        unfolded[unfolded.length - 1] += " " + line.trim();
      } else if (line.trim()) {
        unfolded.push(line);
      }
    }
    /** @type {Record<string, string[]>} */
    const fields = {};
    for (const line of unfolded) {
      const match = line.match(/^([A-Za-z0-9-]+)\s*:\s*(.*)$/);
      if (!match) continue;
      const name = match[1].toLowerCase();
      (fields[name] ??= []).push(match[2].trim());
    }
    return fields;
  }

  function first(fields, name) {
    return fields[name]?.[0] ?? null;
  }

  function join(fields, name) {
    return fields[name]?.join("\n") ?? "";
  }

  function authenticationVerdict(authenticationResults, method) {
    const match = authenticationResults.match(new RegExp(`(?:^|[;\\s])${method}=(${AUTH_VERDICTS})(?:[;\\s]|$)`, "i"));
    return match?.[1]?.toLowerCase() ?? "unknown";
  }

  function analyze(raw) {
    const fields = parseHeaderBlock(raw);
    const names = Object.keys(fields);
    if (!names.length) return null;
    const authenticationResults = join(fields, "authentication-results");
    return {
      fields,
      identity: {
        from: first(fields, "from"),
        returnPath: first(fields, "return-path"),
        replyTo: first(fields, "reply-to"),
        subject: first(fields, "subject"),
        messageId: first(fields, "message-id"),
        date: first(fields, "date"),
      },
      authentication: {
        spf: authenticationVerdict(authenticationResults, "spf"),
        dkim: authenticationVerdict(authenticationResults, "dkim"),
        dmarc: authenticationVerdict(authenticationResults, "dmarc"),
        raw: authenticationResults || null,
      },
      received: fields.received ?? [],
    };
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderIdentity(report) {
    const section = el("section", "ha-panel");
    section.append(el("h3", null, t("identity")));
    const dl = el("dl", "ha-identity");
    const rows = [
      [t("from"), report.identity.from],
      [t("returnPath"), report.identity.returnPath],
      [t("replyTo"), report.identity.replyTo],
      [t("subject"), report.identity.subject],
      [t("messageId"), report.identity.messageId],
      [t("date"), report.identity.date],
    ];
    for (const [label, value] of rows) {
      dl.append(el("dt", null, label), el("dd", null, value || t("missing")));
    }
    section.append(dl);
    return section;
  }

  function renderAuth(report) {
    const section = el("section", "ha-panel security-report");
    const heading = el("div", "security-heading");
    heading.append(el("h3", null, t("auth")));
    section.append(heading);

    const auth = el("p", "authentication-results");
    const docs = {
      SPF: "https://en.wikipedia.org/wiki/Sender_Policy_Framework",
      DKIM: "https://en.wikipedia.org/wiki/DomainKeys_Identified_Mail",
      DMARC: "https://en.wikipedia.org/wiki/DMARC",
    };
    let index = 0;
    for (const [method, url] of Object.entries(docs)) {
      if (index++) auth.append(" · ");
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      const verdict = report.authentication[method.toLowerCase()] || "unknown";
      link.textContent = `${method}: ${verdict === "unknown" ? t("unknown") : verdict}`;
      auth.append(link);
    }
    section.append(auth);
    section.append(el("p", "ha-note", t("authNote")));

    const allUnknown = ["spf", "dkim", "dmarc"].every((key) => {
      const value = report.authentication[key];
      return value === "unknown" || value === "none";
    });
    if (allUnknown) section.append(el("p", null, t("noAuth")));
    if (report.authentication.raw) {
      const pre = el("pre", "ha-auth-raw", report.authentication.raw);
      section.append(pre);
    }
    section.append(el("small", null, t("caution")));
    return section;
  }

  function renderReceived(report) {
    const section = el("section", "ha-panel");
    section.append(el("h3", null, t("received")));
    section.append(el("p", "ha-note", t("receivedNote")));
    if (!report.received.length) {
      section.append(el("p", null, t("missing")));
      return section;
    }
    const list = el("ol", "ha-received");
    report.received.forEach((hop, index) => {
      const item = el("li");
      item.append(el("strong", null, t("hop", { n: index + 1 })));
      item.append(el("pre", "ha-hop", hop));
      list.append(item);
    });
    section.append(list);
    return section;
  }

  function setMode(mode) {
    pastePanel.hidden = mode !== "paste";
    inboxPanel.hidden = mode !== "inbox";
    pasteTab.classList.toggle("active", mode === "paste");
    inboxTab.classList.toggle("active", mode === "inbox");
    pasteTab.setAttribute("aria-selected", mode === "paste" ? "true" : "false");
    inboxTab.setAttribute("aria-selected", mode === "inbox" ? "true" : "false");
  }

  const shell = el("div", "header-analyzer");
  const tabs = el("div", "ha-tabs");
  tabs.setAttribute("role", "tablist");
  const pasteTab = el("button", "ha-tab active", t("pasteTab"));
  pasteTab.type = "button";
  pasteTab.setAttribute("role", "tab");
  pasteTab.setAttribute("aria-selected", "true");
  const inboxTab = el("button", "ha-tab", t("inboxTab"));
  inboxTab.type = "button";
  inboxTab.setAttribute("role", "tab");
  inboxTab.setAttribute("aria-selected", "false");
  tabs.append(pasteTab, inboxTab);

  const pastePanel = el("div", "ha-mode");
  pastePanel.setAttribute("role", "tabpanel");
  pastePanel.append(el("p", "ha-privacy", t("privacy")));
  pastePanel.append(el("p", "ha-hint", t("pasteHint")));

  const textarea = document.createElement("textarea");
  textarea.className = "ha-input";
  textarea.rows = 14;
  textarea.spellcheck = false;
  textarea.placeholder = t("placeholder");
  textarea.setAttribute("aria-label", t("pasteTab"));
  pastePanel.append(textarea);

  const actions = el("div", "ha-actions");
  const analyzeBtn = el("button", "ha-primary", t("analyze"));
  analyzeBtn.type = "button";
  const clearBtn = el("button", "ha-secondary", t("clear"));
  clearBtn.type = "button";
  const sampleBtn = el("button", "ha-secondary", t("sample"));
  sampleBtn.type = "button";
  actions.append(analyzeBtn, clearBtn, sampleBtn);
  pastePanel.append(actions);

  const results = el("div", "ha-results");
  results.append(el("p", "ha-empty", t("empty")));
  pastePanel.append(results);

  const inboxPanel = el("div", "ha-mode");
  inboxPanel.hidden = true;
  inboxPanel.setAttribute("role", "tabpanel");
  inboxPanel.append(el("h3", null, t("inboxTitle")));
  inboxPanel.append(el("p", null, t("inboxBody")));
  const inboxLink = document.createElement("a");
  inboxLink.className = "ha-inbox-cta";
  inboxLink.href = homePath;
  inboxLink.textContent = t("inboxCta");
  inboxPanel.append(inboxLink);

  shell.append(tabs, pastePanel, inboxPanel);
  mount.replaceChildren(shell);

  pasteTab.addEventListener("click", () => setMode("paste"));
  inboxTab.addEventListener("click", () => setMode("inbox"));

  function showReport(report) {
    results.replaceChildren();
    if (!report) {
      results.append(el("p", "ha-empty", t("invalid")));
      return;
    }
    results.append(renderIdentity(report), renderAuth(report), renderReceived(report));
  }

  analyzeBtn.addEventListener("click", () => {
    showReport(analyze(textarea.value));
  });
  clearBtn.addEventListener("click", () => {
    textarea.value = "";
    results.replaceChildren(el("p", "ha-empty", t("empty")));
  });
  sampleBtn.addEventListener("click", () => {
    textarea.value = sampleHeaders;
    showReport(analyze(sampleHeaders));
  });
})();
