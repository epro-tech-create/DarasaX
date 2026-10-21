import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({error:"Invalid origin"},{status:403});
  const store = await cookies();
  const prefix = `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0]}-auth-token`;
  const names = store.getAll().filter(c => c.name === prefix || c.name.startsWith(prefix + ".") || c.name.startsWith(prefix + "-"));
  try { await (await createClient()).auth.signOut({scope:"local"}); }
  catch { /* Expire this browser's cookies even if the auth service is unavailable. */ }
  for (const cookie of names) store.set(cookie.name,"",{path:"/",maxAge:0,sameSite:"lax"});
  return NextResponse.json({signedOut:true},{headers:{"Cache-Control":"private, no-store"}});
}
