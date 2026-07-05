// Minimal single-password session, safe to use in both Edge middleware and Node
// server actions (Web Crypto only — no Node built-ins, no Prisma). The session
// cookie holds an HMAC of a fixed payload keyed by the app secret, so it can't
// be forged without the secret. Auth is OFF whenever APP_PASSWORD is unset,
// which keeps local dev frictionless and only enables the gate in production.

const encoder = new TextEncoder();
const PAYLOAD = "planner-authenticated-v1";

export const SESSION_COOKIE = "planner_session";

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  let bin = "";
  for (const b of new Uint8Array(sig)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function makeSessionToken(secret: string): Promise<string> {
  return sign(PAYLOAD, secret);
}

export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  if (!token) return false;
  const expected = await makeSessionToken(secret);
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/** The signing secret, or null when auth is disabled (no APP_PASSWORD set). */
export function authSecret(): string | null {
  const pw = process.env.APP_PASSWORD;
  if (!pw) return null;
  return process.env.SESSION_SECRET || pw;
}
