import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  encodeStaffSession,
  getAdminCredentials,
  hashStaffPassword,
  readCrRegistry,
  staffSessionCookieOptions,
  STAFF_SESSION_COOKIE,
  CR_REGISTRY_COOKIE,
} from "@/lib/staff-auth-server";
import type { StaffRole } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      role?: StaffRole;
      email?: string;
      password?: string;
    };

    const role = body.role;
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!role || (role !== "admin" && role !== "class_rep")) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    if (role === "admin") {
      const admin = getAdminCredentials();
      if (email !== admin.email || password !== admin.password) {
        return NextResponse.json(
          { error: "Invalid admin email or password." },
          { status: 401 },
        );
      }
      const token = encodeStaffSession({
        role: "admin",
        email: admin.email,
        name: admin.name,
      });
      const res = NextResponse.json({
        ok: true,
        session: { role: "admin", email: admin.email, name: admin.name },
      });
      res.cookies.set(STAFF_SESSION_COOKIE, token, staffSessionCookieOptions());
      return res;
    }

    const jar = await cookies();
    const accounts = readCrRegistry(jar.get(CR_REGISTRY_COOKIE)?.value);
    const account = accounts.find((a) => a.email === email);
    if (!account || account.passwordHash !== hashStaffPassword(password)) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const token = encodeStaffSession({
      role: "class_rep",
      email: account.email,
      name: account.name,
    });
    const res = NextResponse.json({
      ok: true,
      session: {
        role: "class_rep" as const,
        email: account.email,
        name: account.name,
      },
    });
    res.cookies.set(STAFF_SESSION_COOKIE, token, staffSessionCookieOptions());
    return res;
  } catch {
    return NextResponse.json({ error: "Sign in failed." }, { status: 500 });
  }
}
