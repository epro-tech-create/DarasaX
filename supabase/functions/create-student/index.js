import { createClient } from "npm:@supabase/supabase-js@2.116.0";

// Privileged credentials stay inside Supabase Edge Functions.
export async function handler(request) {
  const origin = request.headers.get("origin") || "";
  const allowedOrigin = /^https:\/\/(www\.|admin\.|lecturer\.)?darasax\.com$/.test(origin)
    || /^http:\/\/localhost:300[5-8]$/.test(origin);
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin",
    ...(allowedOrigin ? { "Access-Control-Allow-Origin": origin } : {}) };
  const respond = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return respond({ error: "Method not allowed." }, 405);
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) return respond({ error: "Sign in first." }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await caller.auth.getUser();
  if (authError || !user) return respond({ error: "Sign in first." }, 401);
  const { data: staff, error: staffError } = await caller.from("staff_profiles").select("role,status,stream_id").eq("id", user.id).maybeSingle();
  if (staffError || !staff || staff.status !== "active" || !["admin", "class_rep"].includes(staff.role))
    return respond({ error: "Active administrator or class representative access required." }, 403);
  let input;
  try {
    const text = await request.text();
    if (text.length > 16000) return respond({ error: "Request too large." }, 413);
    input = JSON.parse(text);
  } catch { return respond({ error: "Invalid request." }, 400); }
  if (!input || typeof input.name !== "string" || input.name.trim().length < 2 || input.name.length > 200 ||
    typeof input.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email) || input.email.length > 254 ||
    typeof input.temporaryPassword !== "string" || input.temporaryPassword.length < 8 || input.temporaryPassword.length > 128 ||
    typeof input.streamId !== "string") return respond({ error: "Enter a name, valid email, class, and password of 8–128 characters." }, 400);
  if (staff.role === "class_rep" && input.streamId !== staff.stream_id)
    return respond({ error: "You may add students only to your assigned class." }, 403);
  const { data: academicClass, error: classError } = await caller.from("academic_classes").select("*").eq("id", input.streamId).eq("archived", false).maybeSingle();
  if (classError || !academicClass || academicClass.institution !== "Dar es Salaam Institute of Technology (DIT)" ||
    academicClass.programme !== "BENG24COE" || academicClass.year !== 3 || academicClass.semester !== 1)
    return respond({ error: "Choose an available class in the active cohort." }, 400);
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: input.email.trim().toLowerCase(), password: input.temporaryPassword,
    email_confirm: true, user_metadata: { full_name: input.name.trim() },
  });
  if (createError || !created.user) return respond({ error: "Account could not be created. The email may already be registered, or the password may not meet the account policy. Existing passwords are never replaced." }, 409);
  const id = created.user.id;
  const { error: profileError } = await admin.from("profiles").update({
    full_name: input.name.trim(), institution: academicClass.institution, programme: academicClass.programme,
    year_of_study: academicClass.year, semester: academicClass.semester,
    class_name: academicClass.id, onboarding_completed: true,
  }).eq("id", id);
  if (profileError) {
    await admin.auth.admin.deleteUser(id);
    return respond({ error: "Student profile could not be created. Please try again." }, 500);
  }
  // The profiles_sync_roster trigger creates the linked roster row.
  const { data: student, error: rosterError } = await admin.from("monitored_students").select("*").eq("profile_id", id).single();
  if (rosterError || !student) {
    await admin.auth.admin.deleteUser(id);
    return respond({ error: "Student roster could not be created. Please try again." }, 500);
  }
  return respond({ student }, 201);
}

Deno.serve(handler);
