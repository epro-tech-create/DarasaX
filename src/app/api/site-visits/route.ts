import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const respond = (status = 204) => new Response(null, { status, headers: { "Cache-Control": "no-store" } });
  if (request.headers.get("origin") !== new URL(request.url).origin) return respond(403);
  if (process.env.VERCEL_ENV !== "production" || process.env.APP_ROLE !== "student") return respond();
  if (/bot|crawler|spider|headless|preview/i.test(request.headers.get("user-agent") || "")) return respond();
  // Vercel supplies this header. Ignore IPs sent in the request body or alternate proxy headers.
  const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim();
  if (!ip || !isIP(ip)) return respond();
  const secret = process.env.VISITOR_TRACKING_SECRET;
  if (!secret) return respond(503);
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Dar_es_Salaam", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const hash = createHmac("sha256", secret).update(`site-visitor:${day}:${ip}`).digest("hex");
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await supabase.rpc("record_site_visit", { tracking_secret: secret, visit_hash: hash, visit_day: day });
    return respond(error ? 503 : 204);
  } catch { return respond(503); }
}
