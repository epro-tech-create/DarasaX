import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  decodeStaffSession,
  STAFF_SESSION_COOKIE,
} from "@/lib/staff-auth-server";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(STAFF_SESSION_COOKIE)?.value;
  const session = decodeStaffSession(token);
  if (!session) {
    return NextResponse.json({ session: null });
  }
  return NextResponse.json({
    session: {
      role: session.role,
      email: session.email,
      name: session.name,
    },
  });
}
