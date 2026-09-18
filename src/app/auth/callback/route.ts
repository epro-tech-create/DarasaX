import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ensureProfile,
  getPostAuthRedirect,
} from "@/lib/auth/profile";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const errorDescription = searchParams.get("error_description");

  if (errorDescription) {
    const url = new URL("/login", origin);
    url.searchParams.set("error", "Authentication was cancelled or failed.");
    return NextResponse.redirect(url);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const profile = await ensureProfile(supabase, user);
        const dest =
          next && next.startsWith("/") ? next : getPostAuthRedirect(profile);
        return NextResponse.redirect(new URL(dest, origin));
      }
    }
  }

  const url = new URL("/login", origin);
  url.searchParams.set("error", "Something went wrong. Please try again.");
  return NextResponse.redirect(url);
}
