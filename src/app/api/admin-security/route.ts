import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStaffProfile } from "@/lib/auth/staff-profile";
import { adminEmailVerified } from "@/lib/auth/admin-security";
import { adminCookieNames, adminCookieOptions } from "@/lib/auth/admin-device-cookies";
import { roleFromHost } from "@/lib/app-role";
import { maskEmail } from "@/lib/auth/email";
import { AUTH_OTP_LENGTH } from "@/lib/auth/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

async function context(request: Request) {
  if (roleFromHost(new URL(request.url).host) !== "admin") return null;
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user?.email) return null;
  const staff = await getStaffProfile(client, user.id);
  if (staff?.role !== "admin" || staff.status !== "active") return null;
  return { client, user, email: user.email };
}

export async function GET(request: Request) {
  try {
    const current = await context(request);
    if (!current) return json({ error: "Administrator sign in required." }, 401);
    const secure = new URL(request.url).protocol === "https:";
    const names = adminCookieNames(secure);
    const store = await cookies();
    return json({ verified: await adminEmailVerified(current.client), pending: Boolean(store.get(names.challenge)?.value), email: maskEmail(current.email) });
  } catch { return json({ error: "Could not verify account security. Please try again." }, 503); }
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: "Invalid request origin." }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  if (!body || !["start", "verify", "forget"].includes(body.action)) return json({ error: "Invalid request." }, 400);
  try {
    const current = await context(request);
    if (!current) return json({ error: "Administrator sign in required." }, 401);
    const { client, user, email } = current;
    const secure = new URL(request.url).protocol === "https:";
    const names = adminCookieNames(secure);
    const store = await cookies();
    const browserToken = store.get(names.browser)?.value ?? "";

    if (body.action === "forget") {
      const { error } = await client.rpc("forget_admin_browser", { browser_token: browserToken });
      if (error) throw error;
      store.set(names.browser, "", adminCookieOptions(secure, 0));
      store.set(names.challenge, "", adminCookieOptions(secure, 0));
      return json({ forgotten: true });
    }

    if (body.action === "start") {
      const token = randomBytes(32).toString("hex");
      const { data, error } = await client.rpc("start_admin_email_check", { challenge_token: token, browser_token: browserToken });
      if (error) throw error;
      const result = data as { verified?: boolean; sent?: boolean; error?: string; restart?: boolean } | null;
      if (result?.error) return json({ error: result.error, restart: result.restart === true }, 429);
      if (result?.verified) { await client.rpc("record_sign_in"); return json({ verified: true }); }
      if (result?.sent !== true) throw new Error("Invalid verification response");
      // The recipient is always the authenticated administrator's own email.
      if (body.captchaToken !== undefined && (typeof body.captchaToken !== "string" || body.captchaToken.length > 4096)) return json({ error: "Invalid security check." }, 400);
      const { error: sendError } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: false, captchaToken: body.captchaToken } });
      store.set(names.challenge, token, adminCookieOptions(secure, 600));
      if (sendError) return json({ error: "Could not send the verification email. Please wait and try again." }, 503);
      return json({ sent: true, verified: false, email: maskEmail(email) });
    }

    if (typeof body.code !== "string" || !new RegExp(`^[0-9]{${AUTH_OTP_LENGTH}}$`).test(body.code)) return json({ error: `Enter the ${AUTH_OTP_LENGTH}-digit verification code.` }, 400);
    const challenge = store.get(names.challenge)?.value;
    if (!challenge) return json({ error: "Verification expired. Sign in again.", restart: true }, 401);
    const { data: attemptAllowed, error: attemptError } = await client.rpc("admin_email_attempt", { challenge_token: challenge });
    if (attemptError || attemptAllowed !== true) return json({ error: "Too many attempts or verification expired. Sign in again.", restart: true }, 429);
    const { data, error: verifyError } = await client.auth.verifyOtp({ email, token: body.code, type: "email" });
    if (verifyError || !data.user) return json({ error: "Verification code is incorrect or expired." }, 400);
    if (data.user.id !== user.id) {
      await client.auth.signOut({ scope: "local" });
      store.set(names.challenge, "", adminCookieOptions(secure, 0));
      return json({ error: "Account changed. Sign in again.", restart: true }, 403);
    }
    const trustedToken = body.remember === true ? randomBytes(32).toString("hex") : "";
    const { error: finishError } = await client.rpc("finish_admin_email_check", { challenge_token: challenge, browser_token: trustedToken });
    if (finishError) return json({ error: "Verification could not be completed. Sign in again.", restart: true }, 403);
    if (trustedToken) store.set(names.browser, trustedToken, adminCookieOptions(secure, 30 * 24 * 60 * 60));
    store.set(names.challenge, "", adminCookieOptions(secure, 0));
    await client.rpc("record_sign_in");
    return json({ verified: true });
  } catch { return json({ error: "Could not verify account security. Please try again." }, 503); }
}
