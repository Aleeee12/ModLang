import crypto from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const ADMIN_COOKIE_SECRET = process.env.ADMIN_COOKIE_SECRET || "";

export function isAdminEnvConfigured() {
  return Boolean(ADMIN_PASSWORD && ADMIN_COOKIE_SECRET);
}

export function validateAdminPassword(input: string) {
  if (!ADMIN_PASSWORD) return false;

  const a = Buffer.from(input);
  const b = Buffer.from(ADMIN_PASSWORD);

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

export function signAdminToken(value: string) {
  return crypto
    .createHmac("sha256", ADMIN_COOKIE_SECRET)
    .update(value)
    .digest("hex");
}

export function buildAdminSessionValue() {
  const payload = "modlang_admin";
  const signature = signAdminToken(payload);
  return `${payload}.${signature}`;
}

export function verifyAdminSessionValue(sessionValue?: string | null) {
  if (!sessionValue || !ADMIN_COOKIE_SECRET) return false;

  const [payload, signature] = sessionValue.split(".");

  if (!payload || !signature) return false;

  const expected = signAdminToken(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b) && payload === "modlang_admin";
}