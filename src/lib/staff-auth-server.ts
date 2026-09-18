import { createHmac, timingSafeEqual } from "crypto";
import type { StaffRole } from "@/types";

export const STAFF_SESSION_COOKIE = "darasax_staff_session";
export const CR_REGISTRY_COOKIE = "darasax_cr_registry";

const SESSION_DAYS = 7;

function secret() {
  return (
    process.env.STAFF_AUTH_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "darasax-staff-dev-secret"
  );
}

export function getAdminCredentials() {
  return {
    email: (process.env.ADMIN_EMAIL || "admin@darasax.app").toLowerCase(),
    password: process.env.ADMIN_PASSWORD || "DarasaXAdmin!",
    name: process.env.ADMIN_NAME || "Admin Desk",
  };
}

export type StaffSessionPayload = {
  role: StaffRole;
  email: string;
  name: string;
  exp: number;
};

export type CrAccountRecord = {
  name: string;
  email: string;
  passwordHash: string;
  streamId: string;
  createdAt: string;
};

function sign(body: string) {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function hashStaffPassword(password: string) {
  return createHmac("sha256", secret()).update(password).digest("hex");
}

export function encodeStaffSession(payload: Omit<StaffSessionPayload, "exp">) {
  const full: StaffSessionPayload = {
    ...payload,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
  const body = Buffer.from(JSON.stringify(full)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeStaffSession(
  token: string | undefined | null,
): StaffSessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as StaffSessionPayload;
    if (!payload?.email || !payload?.role || !payload?.exp) return null;
    if (payload.exp < Date.now()) return null;
    if (payload.role !== "admin" && payload.role !== "class_rep") return null;
    return payload;
  } catch {
    return null;
  }
}

export function readCrRegistry(
  cookieValue: string | undefined | null,
): CrAccountRecord[] {
  if (!cookieValue) return [];
  try {
    const [body, sig] = cookieValue.split(".");
    if (!body || !sig) return [];
    if (sig !== sign(body)) return [];
    const parsed = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as CrAccountRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCrRegistry(accounts: CrAccountRecord[]) {
  const body = Buffer.from(JSON.stringify(accounts)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function staffSessionCookieOptions(maxAgeSeconds = SESSION_DAYS * 86400) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
