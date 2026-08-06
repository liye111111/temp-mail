const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

export function randomId(bytes = 16): string {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return toBase64Url(value).toLowerCase();
}

export async function createSessionToken(inboxId: string, expiresAt: number, secret: string): Promise<string> {
  const payload = `${inboxId}.${expiresAt}`;
  return `${payload}.${await hmac(payload, secret)}`;
}

export async function verifySessionToken(token: string, inboxId: string, secret: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== inboxId) return false;
  const expiresAt = Number(parts[1]);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return false;
  const expected = await createSessionToken(inboxId, expiresAt, secret);
  if (expected.length !== token.length) return false;
  let difference = 0;
  for (let index = 0; index < token.length; index += 1) {
    difference |= token.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}
