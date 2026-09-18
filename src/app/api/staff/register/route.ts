import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { classStreams } from "@/data/mock";
import {
  CR_REGISTRY_COOKIE,
  encodeStaffSession,
  hashStaffPassword,
  readCrRegistry,
  staffSessionCookieOptions,
  STAFF_SESSION_COOKIE,
  writeCrRegistry,
} from "@/lib/staff-auth-server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      streamId?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const streamId = body.streamId ?? "";

    if (!name || !email || !password || !streamId) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }
    if (!classStreams.some((s) => s.id === streamId)) {
      return NextResponse.json({ error: "Invalid stream." }, { status: 400 });
    }

    const jar = await cookies();
    const accounts = readCrRegistry(jar.get(CR_REGISTRY_COOKIE)?.value);
    if (accounts.some((a) => a.email === email)) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const nextAccounts = [
      {
        name,
        email,
        passwordHash: hashStaffPassword(password),
        streamId,
        createdAt: new Date().toISOString(),
      },
      ...accounts,
    ];

    const sessionToken = encodeStaffSession({
      role: "class_rep",
      email,
      name,
    });

    const res = NextResponse.json({
      ok: true,
      session: { role: "class_rep" as const, email, name },
    });
    res.cookies.set(
      CR_REGISTRY_COOKIE,
      writeCrRegistry(nextAccounts),
      staffSessionCookieOptions(60 * 60 * 24 * 365),
    );
    res.cookies.set(
      STAFF_SESSION_COOKIE,
      sessionToken,
      staffSessionCookieOptions(),
    );
    return res;
  } catch {
    return NextResponse.json(
      { error: "Registration failed." },
      { status: 500 },
    );
  }
}
