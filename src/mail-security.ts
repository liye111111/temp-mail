import type { Email } from "postal-mime";

export type SecuritySeverity = "info" | "low" | "medium" | "high";
export type AuthenticationVerdict = "pass" | "fail" | "softfail" | "neutral" | "none" | "temperror" | "permerror" | "unknown";

export interface SecurityCheck {
  code: string;
  severity: SecuritySeverity;
  message: string;
}

export interface MailSecurityReport {
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  authentication: {
    spf: AuthenticationVerdict;
    dkim: AuthenticationVerdict;
    dmarc: AuthenticationVerdict;
  };
  checks: SecurityCheck[];
}

const AUTH_VERDICTS = "pass|fail|softfail|neutral|none|temperror|permerror";
const DANGEROUS_EXTENSIONS = new Set(["app", "bat", "cmd", "com", "exe", "hta", "js", "jse", "lnk", "msi", "ps1", "scr", "vbe", "vbs"]);
const SHORTENER_DOMAINS = new Set(["bit.ly", "cutt.ly", "is.gd", "ow.ly", "rebrand.ly", "t.co", "tinyurl.com"]);

function domainOf(address: string | undefined | null): string | null {
  const match = address?.trim().toLowerCase().match(/@([^>\s]+)>?$/);
  return match?.[1]?.replace(/\.$/, "") ?? null;
}

function mailboxAddress(value: Email["from"]): string | null {
  return value && typeof value.address === "string" ? value.address.toLowerCase() : null;
}

function headerValues(email: Email, name: string): string {
  return email.headers.filter((header) => header.key === name).map((header) => header.value).join("\n");
}

function authenticationVerdict(authenticationResults: string, method: "spf" | "dkim" | "dmarc"): AuthenticationVerdict {
  const match = authenticationResults.match(new RegExp(`(?:^|[;\\s])${method}=(${AUTH_VERDICTS})(?:[;\\s]|$)`, "i"));
  return (match?.[1]?.toLowerCase() as AuthenticationVerdict | undefined) ?? "unknown";
}

function addCheck(checks: SecurityCheck[], code: string, severity: SecuritySeverity, message: string): void {
  checks.push({ code, severity, message });
}

function extractUrls(text: string, html: string): URL[] {
  const matches = `${text}\n${html}`.match(/https?:\/\/[^\s<>"']+/gi) ?? [];
  const urls: URL[] = [];
  for (const candidate of matches.slice(0, 100)) {
    try {
      urls.push(new URL(candidate.replace(/[),.;]+$/, "")));
    } catch {
      // Malformed URLs are ignored; other rules still inspect the surrounding message.
    }
  }
  return urls;
}

export function inspectMail(email: Email, envelopeFrom: string): MailSecurityReport {
  const checks: SecurityCheck[] = [];
  const authenticationResults = headerValues(email, "authentication-results");
  const authentication = {
    spf: authenticationVerdict(authenticationResults, "spf"),
    dkim: authenticationVerdict(authenticationResults, "dkim"),
    dmarc: authenticationVerdict(authenticationResults, "dmarc"),
  };

  for (const [method, verdict] of Object.entries(authentication)) {
    if (verdict === "fail" || verdict === "permerror") {
      addCheck(checks, `${method}_failed`, "high", `${method.toUpperCase()} authentication failed.`);
    } else if (verdict === "softfail" || verdict === "temperror") {
      addCheck(checks, `${method}_warning`, "medium", `${method.toUpperCase()} authentication returned ${verdict}.`);
    }
  }
  if (Object.values(authentication).every((value) => value === "unknown" || value === "none")) {
    addCheck(checks, "authentication_unavailable", "info", "No conclusive SPF, DKIM, or DMARC result was found in the received headers.");
  }

  const fromAddress = mailboxAddress(email.from);
  const fromDomain = domainOf(fromAddress);
  const envelopeDomain = domainOf(envelopeFrom);
  if (fromDomain && envelopeDomain && fromDomain !== envelopeDomain) {
    addCheck(checks, "envelope_from_mismatch", "medium", "The visible From domain differs from the envelope sender domain.");
  }
  const replyToDomains = (email.replyTo ?? []).flatMap((replyTo) => typeof replyTo.address === "string" ? [domainOf(replyTo.address)] : []).filter(Boolean);
  if (fromDomain && replyToDomains.some((domain) => domain !== fromDomain)) {
    addCheck(checks, "reply_to_mismatch", "medium", "The Reply-To domain differs from the visible sender domain.");
  }
  if (!email.messageId) addCheck(checks, "missing_message_id", "low", "The message has no Message-ID header.");
  if (!email.date) addCheck(checks, "missing_date", "low", "The message has no Date header.");

  const urls = extractUrls(email.text ?? "", email.html ?? "");
  if (urls.some((url) => /^(?:\d{1,3}\.){3}\d{1,3}$/.test(url.hostname) || url.hostname.includes(":"))) {
    addCheck(checks, "ip_address_link", "high", "The message contains a link that uses an IP address instead of a domain name.");
  }
  if (urls.some((url) => url.hostname.split(".").some((label) => label.startsWith("xn--")))) {
    addCheck(checks, "punycode_link", "medium", "The message contains an internationalized domain that may visually imitate another domain.");
  }
  if (urls.some((url) => Boolean(url.username || url.password))) {
    addCheck(checks, "credential_url", "high", "The message contains a URL with embedded credentials.");
  }
  if (urls.some((url) => SHORTENER_DOMAINS.has(url.hostname.replace(/^www\./, "")))) {
    addCheck(checks, "shortened_link", "medium", "The message contains a shortened URL that hides its destination.");
  }

  for (const attachment of email.attachments) {
    const filename = attachment.filename?.toLowerCase() ?? "";
    const parts = filename.split(".");
    const extension = parts.at(-1) ?? "";
    if (parts.length >= 3 && DANGEROUS_EXTENSIONS.has(extension)) {
      addCheck(checks, "double_extension_attachment", "high", `The attachment “${attachment.filename}” uses a suspicious double extension.`);
      break;
    }
    if (DANGEROUS_EXTENSIONS.has(extension)) {
      addCheck(checks, "dangerous_attachment", "high", `The attachment “${attachment.filename}” can contain executable code.`);
      break;
    }
  }

  const weights: Record<SecuritySeverity, number> = { info: 0, low: 8, medium: 20, high: 35 };
  const riskScore = Math.min(100, checks.reduce((score, check) => score + weights[check.severity], 0));
  const riskLevel = riskScore >= 60 ? "high" : riskScore >= 30 ? "medium" : "low";
  return { riskScore, riskLevel, authentication, checks };
}
