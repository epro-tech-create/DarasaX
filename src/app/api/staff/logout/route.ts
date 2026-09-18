import { NextResponse } from "next/server";
import {
  staffSessionCookieOptions,
  STAFF_SESSION_COOKIE,
} from "@/lib/staff-auth-server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(STAFF_SESSION_COOKIE, "", {
    ...staffSessionCookieOptions(0),
    maxAge: 0,
  });
  return res;
}
