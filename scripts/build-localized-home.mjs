import fs from "node:fs";

const source = fs.readFileSync("public/index.html", "utf8");
const translations = {
  ja: {
    "Free Temporary Email with Security Checks — GetOpenInbox": "セキュリティチェック付き無料一時メール — GetOpenInbox",
    "Create a free temporary inbox with built-in SPF, DKIM and DMARC checks, suspicious-link detection and a raw email header viewer. No registration required.": "登録不要の無料一時メール。SPF、DKIM、DMARC、疑わしいリンクを確認し、メールの生ヘッダーを表示できます。",
    "Receive temporary email with SPF, DKIM, DMARC and suspicious-link checks, plus a raw email source viewer.": "SPF、DKIM、DMARC、疑わしいリンクを確認できる一時メール。元のメールソースも表示できます。",
    "A disposable inbox with email authentication checks and raw header inspection.": "メール認証チェックと生ヘッダー確認に対応した使い捨て受信箱。",
    "Temporary inbox": "一時受信箱", Comparisons: "比較", Developers: "開発者向け", Guides: "ガイド", Tools: "ツール", Language: "言語",
    "Free temporary email with security checks": "セキュリティチェック付き無料一時メール",
    "Get a disposable inbox instantly, inspect SPF, DKIM and DMARC results, and view raw email headers. No registration required.": "使い捨て受信箱をすぐに作成し、SPF・DKIM・DMARCの結果とメールの生ヘッダーを確認できます。登録は不要です。",
    "YOUR TEMPORARY EMAIL": "あなたの一時メール", "Creating your inbox…": "受信箱を作成しています…", Copy: "コピー", "Valid for 10 minutes": "10分間有効", "New address": "新しいアドレス",
    INBOX: "受信箱", "Incoming messages": "受信メール", "Automatically checking for new mail…": "新着メールを自動確認しています…", "Check for new mail": "新着メールを確認", "Your inbox is ready": "受信箱の準備ができました", "Use the address above, then select “Check for new mail” to retrieve messages.": "上のアドレスを使用し、「新着メールを確認」を選択して受信してください。",
    "HOW IT WORKS": "使い方", "A disposable inbox in seconds": "数秒で使える使い捨て受信箱", "Copy your address": "アドレスをコピー", "A temporary address is created when you open this page. No account or personal details are required.": "このページを開くと一時アドレスが作成されます。アカウントや個人情報は不要です。", "Use it online": "オンラインで使用", "Enter the address when a website asks for email, including for sign-ups and verification codes.": "登録や確認コードなど、Webサイトでメールアドレスを求められたときに入力します。", "Check the message": "メールを確認", "Open incoming mail to review its risk score, authentication results, suspicious-link warnings and raw source.": "受信メールを開き、リスクスコア、認証結果、疑わしいリンクの警告、元のソースを確認します。",
    "BUILT-IN ANALYSIS": "組み込み分析", "Incoming email security and SMTP authentication results": "受信メールの安全性とSMTP認証結果", "SPF, DKIM and DMARC results": "SPF・DKIM・DMARCの結果", "Review authentication results reported in the received headers and see whether common sender-verification checks passed, failed or were unavailable.": "受信ヘッダーの認証結果を確認し、一般的な送信者検証が成功、失敗、または利用不可だったかを把握できます。", "Suspicious-link and sender checks": "疑わしいリンクと送信者のチェック", "See warnings for sender-domain mismatches, shortened URLs, IP-address links, Punycode domains and potentially dangerous attachment names.": "送信者ドメインの不一致、短縮URL、IPアドレスリンク、Punycodeドメイン、危険な可能性がある添付ファイル名を警告します。", "Raw email source viewer": "メール生ソース表示", "Inspect the original RFC 5322 message source, including delivery headers and MIME structure, directly from the authenticated inbox session.": "認証済みの受信箱セッションから、配信ヘッダーとMIME構造を含むRFC 5322の元メッセージを確認できます。",
    "PRIVACY BY DEFAULT": "プライバシーを優先", "Why use a temporary email address?": "一時メールアドレスを使う理由", "Keep routine sign-ups separate": "日常的な登録を分離", "Use a disposable address for newsletters, product trials, downloads and other short-term registrations. Your personal inbox stays reserved for people and services you trust.": "ニュースレター、製品トライアル、ダウンロードなど短期の登録には使い捨てアドレスを使い、個人の受信箱を信頼する相手のために保てます。", "Receive codes without an account": "アカウントなしでコードを受信", "GetOpenInbox works in a modern browser and does not ask you to create a profile. Copy the generated address, use it on another site and return here to check for the message.": "GetOpenInboxは最新ブラウザで動作し、プロフィール作成は不要です。生成されたアドレスを別サイトで使用し、ここに戻ってメールを確認します。", "Use temporary mail responsibly": "一時メールを責任を持って使用", "Anyone with access to an inbox session may be able to read its messages. Never use temporary email for banking, healthcare, confidential documents or accounts that you may need to recover later.": "受信箱セッションにアクセスできる人はメールを読める可能性があります。銀行、医療、機密文書、後で復旧が必要なアカウントには使用しないでください。",
    "LEARN AND INVESTIGATE": "学習と調査", "Temporary email and email security resources": "一時メールとメールセキュリティの資料", "Learn when to use a disposable inbox, investigate incoming-message headers, and understand common email authentication results.": "使い捨て受信箱を使う場面、受信ヘッダーの調査方法、一般的なメール認証結果を学べます。", "Temporary email guides": "一時メールガイド", "Developer email testing": "開発者向けメールテスト", "Temporary email questions": "一時メールのよくある質問",
    "Email header analyzer": "メールヘッダー解析ツール",
    "Understand <a href=\"/guides/what-is-temporary-email/\">how disposable email works</a>, its privacy limits, and whether <a href=\"/guides/is-temporary-email-safe/\">temporary email is safe</a> for your task.": "<a href=\"/guides/what-is-temporary-email/\">使い捨てメールの仕組み</a>、プライバシー上の制限、目的に対して<a href=\"/guides/is-temporary-email-safe/\">一時メールが安全か</a>を確認できます。",
    "Receive a test message, review its raw source, and examine sender, link, SPF, DKIM, and DMARC warning signals.": "テストメールを受信し、元のソース、送信者、リンク、SPF、DKIM、DMARCの警告を確認します。",
    "Use <a href=\"/developers/temporary-email-for-testing/\">temporary email for manual QA</a> and learn <a href=\"/developers/analyze-email-headers/\">how to analyze email headers</a> step by step.": "<a href=\"/developers/temporary-email-for-testing/\">手動QAで一時メールを使う方法</a>と、<a href=\"/developers/analyze-email-headers/\">メールヘッダーを段階的に分析する方法</a>を学べます。",
    "Not sure which address type fits your needs? Compare <a href=\"/comparisons/burner-email-vs-temporary-email/\">burner email, temporary inboxes, aliases, and permanent accounts</a>.": "どの種類が適しているか分からない場合は、<a href=\"/comparisons/burner-email-vs-temporary-email/\">バーナーメール、一時受信箱、エイリアス、恒久アカウント</a>を比較してください。",
    "It is a short-lived inbox you can use without sharing your personal email address. It is useful for low-risk registrations, trials and receiving verification messages.": "個人のメールアドレスを共有せずに使える短期間の受信箱です。低リスクの登録、試用、確認メールの受信に役立ちます。",
    "No. GetOpenInbox creates an address immediately without asking for an account, password or personal email address.": "いいえ。GetOpenInboxはアカウント、パスワード、個人メールを求めず、すぐにアドレスを作成します。",
    "The current inbox session is active for 10 minutes. Create a new address when the timer expires.": "現在の受信箱セッションは10分間有効です。期限が切れたら新しいアドレスを作成してください。",
    "No. Temporary email is not suitable for banking, healthcare, password recovery or any account you may need to recover later.": "いいえ。銀行、医療、パスワード復旧、後で取り戻す必要があるアカウントには適していません。",
    "No. The score explains common authentication, sender, link and attachment signals. A low-risk result cannot prove that the sender or message content is trustworthy.": "いいえ。スコアは一般的な認証、送信者、リンク、添付ファイルの兆候を説明するだけで、低リスクでも信頼性は証明できません。",
    "What is a temporary email address?": "一時メールアドレスとは？", "Do I need to register?": "登録は必要ですか？", "How long does the inbox remain active?": "受信箱はどのくらい有効ですか？", "Should I use it for sensitive accounts?": "重要なアカウントに使えますか？", "Does the security score guarantee that an email is safe?": "セキュリティスコアはメールの安全を保証しますか？",
    "Temporary email content expires automatically from object storage. Do not use this service for sensitive information.": "一時メールの内容はオブジェクトストレージから自動的に削除されます。機密情報には使用しないでください。", Close: "閉じる"
  },
  zh: {
    "Free Temporary Email with Security Checks — GetOpenInbox": "带安全检查的免费临时邮箱 — GetOpenInbox",
    "Create a free temporary inbox with built-in SPF, DKIM and DMARC checks, suspicious-link detection and a raw email header viewer. No registration required.": "免费创建临时收件箱，内置 SPF、DKIM、DMARC 检查、可疑链接检测和原始邮件头查看，无需注册。",
    "Receive temporary email with SPF, DKIM, DMARC and suspicious-link checks, plus a raw email source viewer.": "接收临时邮件并检查 SPF、DKIM、DMARC 和可疑链接，也可查看原始邮件源码。",
    "A disposable inbox with email authentication checks and raw header inspection.": "支持邮件认证检查和原始邮件头分析的一次性收件箱。",
    "Temporary inbox": "临时邮箱", Comparisons: "对比", Developers: "开发者", Guides: "指南", Tools: "工具", Language: "语言",
    "Free temporary email with security checks": "带安全检查的免费临时邮箱",
    "Get a disposable inbox instantly, inspect SPF, DKIM and DMARC results, and view raw email headers. No registration required.": "立即获得一次性收件箱，检查 SPF、DKIM 和 DMARC 结果，并查看原始邮件头，无需注册。",
    "YOUR TEMPORARY EMAIL": "你的临时邮箱", "Creating your inbox…": "正在创建收件箱…", Copy: "复制", "Valid for 10 minutes": "有效期 10 分钟", "New address": "新地址",
    INBOX: "收件箱", "Incoming messages": "收到的邮件", "Automatically checking for new mail…": "正在自动检查新邮件…", "Check for new mail": "检查新邮件", "Your inbox is ready": "收件箱已准备好", "Use the address above, then select “Check for new mail” to retrieve messages.": "使用上方地址，然后选择“检查新邮件”收取邮件。",
    "HOW IT WORKS": "使用方式", "A disposable inbox in seconds": "几秒钟获得一次性收件箱", "Copy your address": "复制地址", "A temporary address is created when you open this page. No account or personal details are required.": "打开页面即会创建临时地址，无需账户或个人信息。", "Use it online": "在线使用", "Enter the address when a website asks for email, including for sign-ups and verification codes.": "网站要求填写邮箱时输入该地址，可用于注册和接收验证码。", "Check the message": "查看邮件", "Open incoming mail to review its risk score, authentication results, suspicious-link warnings and raw source.": "打开收到的邮件，查看风险评分、认证结果、可疑链接警告和原始源码。",
    "BUILT-IN ANALYSIS": "内置分析", "Incoming email security and SMTP authentication results": "收件安全与 SMTP 认证结果", "SPF, DKIM and DMARC results": "SPF、DKIM 和 DMARC 结果", "Review authentication results reported in the received headers and see whether common sender-verification checks passed, failed or were unavailable.": "查看收件头中的认证结果，了解常见发件人验证是通过、失败还是不可用。", "Suspicious-link and sender checks": "可疑链接与发件人检查", "See warnings for sender-domain mismatches, shortened URLs, IP-address links, Punycode domains and potentially dangerous attachment names.": "提示发件人域名不匹配、短链接、IP 地址链接、Punycode 域名以及可能危险的附件名称。", "Raw email source viewer": "原始邮件源码查看器", "Inspect the original RFC 5322 message source, including delivery headers and MIME structure, directly from the authenticated inbox session.": "直接在已认证的收件箱会话中检查原始 RFC 5322 邮件，包括投递头和 MIME 结构。",
    "PRIVACY BY DEFAULT": "默认保护隐私", "Why use a temporary email address?": "为什么使用临时邮箱？", "Keep routine sign-ups separate": "隔离日常注册", "Use a disposable address for newsletters, product trials, downloads and other short-term registrations. Your personal inbox stays reserved for people and services you trust.": "通过一次性地址订阅简报、试用产品、下载资源或进行短期注册，把个人邮箱留给信任的人和服务。", "Receive codes without an account": "无需账户即可接收验证码", "GetOpenInbox works in a modern browser and does not ask you to create a profile. Copy the generated address, use it on another site and return here to check for the message.": "GetOpenInbox 可在现代浏览器中使用，无需创建个人资料。复制生成的地址，在其他网站使用后返回这里查看邮件。", "Use temporary mail responsibly": "负责任地使用临时邮箱", "Anyone with access to an inbox session may be able to read its messages. Never use temporary email for banking, healthcare, confidential documents or accounts that you may need to recover later.": "任何能访问收件箱会话的人都可能读取邮件。不要将临时邮箱用于银行、医疗、机密文件或以后需要找回的账户。",
    "LEARN AND INVESTIGATE": "学习与分析", "Temporary email and email security resources": "临时邮箱与邮件安全资料", "Learn when to use a disposable inbox, investigate incoming-message headers, and understand common email authentication results.": "了解何时使用一次性收件箱、如何分析收件头以及常见邮件认证结果。", "Temporary email guides": "临时邮箱指南", "Developer email testing": "开发者邮件测试", "Temporary email questions": "临时邮箱常见问题",
    "Email header analyzer": "邮件头分析器",
    "Understand <a href=\"/guides/what-is-temporary-email/\">how disposable email works</a>, its privacy limits, and whether <a href=\"/guides/is-temporary-email-safe/\">temporary email is safe</a> for your task.": "了解<a href=\"/guides/what-is-temporary-email/\">一次性邮箱如何工作</a>、隐私限制，以及<a href=\"/guides/is-temporary-email-safe/\">临时邮箱对你的用途是否安全</a>。",
    "Receive a test message, review its raw source, and examine sender, link, SPF, DKIM, and DMARC warning signals.": "接收测试邮件，查看原始源码，并检查发件人、链接、SPF、DKIM 和 DMARC 警告信号。",
    "Use <a href=\"/developers/temporary-email-for-testing/\">temporary email for manual QA</a> and learn <a href=\"/developers/analyze-email-headers/\">how to analyze email headers</a> step by step.": "了解如何<a href=\"/developers/temporary-email-for-testing/\">在手动 QA 中使用临时邮箱</a>，并学习<a href=\"/developers/analyze-email-headers/\">逐步分析邮件头</a>。",
    "Not sure which address type fits your needs? Compare <a href=\"/comparisons/burner-email-vs-temporary-email/\">burner email, temporary inboxes, aliases, and permanent accounts</a>.": "不确定哪种地址适合？请对比<a href=\"/comparisons/burner-email-vs-temporary-email/\">备用邮箱、临时收件箱、邮箱别名和永久账户</a>。",
    "It is a short-lived inbox you can use without sharing your personal email address. It is useful for low-risk registrations, trials and receiving verification messages.": "这是一种无需分享个人邮箱即可使用的短期收件箱，适合低风险注册、试用和接收验证邮件。",
    "No. GetOpenInbox creates an address immediately without asking for an account, password or personal email address.": "不需要。GetOpenInbox 会立即创建地址，无需账户、密码或个人邮箱。",
    "The current inbox session is active for 10 minutes. Create a new address when the timer expires.": "当前收件箱会话有效期为 10 分钟，计时结束后请创建新地址。",
    "No. Temporary email is not suitable for banking, healthcare, password recovery or any account you may need to recover later.": "不可以。临时邮箱不适用于银行、医疗、密码找回或以后可能需要恢复的账户。",
    "No. The score explains common authentication, sender, link and attachment signals. A low-risk result cannot prove that the sender or message content is trustworthy.": "不能。评分只说明常见认证、发件人、链接和附件信号；低风险结果不能证明发件人或内容可信。",
    "What is a temporary email address?": "什么是临时邮箱地址？", "Do I need to register?": "需要注册吗？", "How long does the inbox remain active?": "收件箱可以使用多久？", "Should I use it for sensitive accounts?": "可以用于敏感账户吗？", "Does the security score guarantee that an email is safe?": "安全评分能保证邮件安全吗？",
    "Temporary email content expires automatically from object storage. Do not use this service for sensitive information.": "临时邮件内容会自动从对象存储中到期删除，请勿用于敏感信息。", Close: "关闭"
  }
};

function localize(language) {
  let html = source;
  for (const [english, translated] of Object.entries(translations[language]).sort(([a], [b]) => b.length - a.length)) html = html.replaceAll(english, translated);
  const prefix = `/${language}`;
  html = html.replace('<html lang="en">', `<html lang="${language === "zh" ? "zh-CN" : language}">`)
    .replace('<link rel="canonical" href="https://getopeninbox.com/" />', `<link rel="canonical" href="https://getopeninbox.com${prefix}/" />`)
    .replace('<meta property="og:url" content="https://getopeninbox.com/" />', `<meta property="og:url" content="https://getopeninbox.com${prefix}/" />`)
    .replace('<meta property="og:locale" content="en_US" />', `<meta property="og:locale" content="${language === "ja" ? "ja_JP" : "zh_CN"}" />`)
    .replaceAll(/href="\/(?!site\.min\.css|app\.min\.js|favicon\.svg|favicon-32\.png|apple-touch-icon\.png|og\.jpg)([^"]*)"/g, `href="${prefix}/$1"`);
  fs.mkdirSync(`public/${language}`, { recursive: true });
  fs.writeFileSync(`public/${language}/index.html`, html);
}

localize("ja");
localize("zh");
console.log("Generated localized home pages.");
