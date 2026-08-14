import type { WebEnv } from "./types";

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
