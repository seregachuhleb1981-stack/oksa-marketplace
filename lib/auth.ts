import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "oksa_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must be at least 32 characters");
  return value;
}
function sign(payload: string) { return createHmac("sha256", secret()).update(payload).digest("base64url"); }

export function createAdminSession(email: string) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ email, exp })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
export function verifyAdminSession(token?: string | null) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  try {
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  } catch { return null; }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { email?: string; exp?: number };
    if (!data.email || !data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch { return null; }
}
export const adminCookieName = COOKIE_NAME;
export const adminSessionMaxAge = SESSION_TTL_SECONDS;
