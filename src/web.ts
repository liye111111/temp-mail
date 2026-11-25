import type { WebEnv } from "./types";

const LANGUAGE_COOKIE = "getopeninbox_language";
const LOCALIZED_PREFIXES = new Set(["ja", "zh"]);

function cookieLanguage(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)getopeninbox_language=(en|ja|zh)(?:;|$)/);
  return match?.[1] ?? null;
}

function browserLanguage(request: Request): string {
  const accepted = (request.headers.get("accept-language") ?? "").toLowerCase();
  for (const item of accepted.split(",")) {
    const language = item.trim().split(";")[0];
    if (language === "ja" || language.startsWith("ja-")) return "ja";
    if (language === "zh" || language.startsWith("zh-")) return "zh";
    if (language === "en" || language.startsWith("en-")) return "en";
  }
  return "en";
}

function localizedPath(pathname: string, language: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length && LOCALIZED_PREFIXES.has(segments[0])) segments.shift();
  const base = `/${segments.join("/")}${pathname.endsWith("/") || !segments.length ? "/" : ""}`;
  return language === "en" ? base : `/${language}${base}`;
}

export default {
  async fetch(request: Request, env: WebEnv): Promise<Response> {
    const url = new URL(request.url);
    if (env.CANONICAL_HOSTNAME && url.hostname !== env.CANONICAL_HOSTNAME) {
      url.hostname = env.CANONICAL_HOSTNAME;
      return new Response(null, {
        status: 308,
        headers: {
          location: url.toString(),
          "strict-transport-security": "max-age=31536000; includeSubDomains",
        },
      });
    }

    const selectedLanguage = url.searchParams.get("language");
    if (request.method === "GET" && selectedLanguage && ["en", "ja", "zh"].includes(selectedLanguage)) {
      url.searchParams.delete("language");
      url.pathname = localizedPath(url.pathname, selectedLanguage);
      const secure = url.protocol === "https:" ? "; Secure" : "";
      return new Response(null, {
        status: 303,
        headers: {
          location: url.toString(),
          "set-cookie": `${LANGUAGE_COOKIE}=${selectedLanguage}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`,
          "cache-control": "private, no-store",
          vary: "Cookie",
          "strict-transport-security": "max-age=31536000; includeSubDomains",
        },
      });
    }

    const firstSegment = url.pathname.split("/").filter(Boolean)[0];
    const explicitLanguage = firstSegment && LOCALIZED_PREFIXES.has(firstSegment) ? firstSegment : null;
    const preferredLanguage = cookieLanguage(request) ?? browserLanguage(request);
    const acceptsHtml = request.headers.get("accept")?.includes("text/html") ?? false;
    if (!explicitLanguage && preferredLanguage !== "en" && request.method === "GET" && acceptsHtml) {
      url.pathname = localizedPath(url.pathname, preferredLanguage);
      return new Response(null, {
        status: 307,
        headers: {
          location: url.toString(),
          vary: "Accept-Language, Cookie",
          "cache-control": "private, no-cache",
          "strict-transport-security": "max-age=31536000; includeSubDomains",
        },
      });
    }
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set("x-content-type-options", "nosniff");
    headers.set("cache-control", "no-cache");
    headers.set("referrer-policy", "strict-origin-when-cross-origin");
    headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
    headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
    headers.set("content-security-policy", "default-src 'self'; connect-src 'self' https://api.getopeninbox.com; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'");
    return new Response(response.body, { status: response.status, headers });
  },
};
