/**
 * Authentication helpers — HMAC-signed cookie token (Edge-runtime compatible)
 *
 * Token format: `<username>.<timestamp>.<base64url(hmac)>`
 *   - timestamp: ms since epoch (issued time)
 *   - hmac: HMAC-SHA256 of `username.timestamp` keyed by AUTH_SECRET
 *
 * Verifying:
 *   - parse 3 parts, recompute HMAC, constant-time compare
 *   - check timestamp is within MAX_AGE_MS
 */

export const COOKIE_NAME = "mec_admin";
export const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function base64UrlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return base64UrlEncode(sig);
}

export async function signToken(username: string, secret: string): Promise<string> {
  const ts = Date.now().toString();
  const payload = `${username}.${ts}`;
  const sig = await hmac(payload, secret);
  return `${payload}.${sig}`;
}

/** Constant-time string compare */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function verifyToken(
  token: string | undefined,
  secret: string
): Promise<{ valid: boolean; username?: string }> {
  if (!token) return { valid: false };
  const parts = token.split(".");
  if (parts.length !== 3) return { valid: false };
  const [username, ts, sig] = parts;
  const tsNum = parseInt(ts, 10);
  if (!username || !ts || !sig || isNaN(tsNum)) return { valid: false };
  if (Date.now() - tsNum > MAX_AGE_MS) return { valid: false };
  const expected = await hmac(`${username}.${ts}`, secret);
  if (!safeEqual(sig, expected)) return { valid: false };
  return { valid: true, username };
}
