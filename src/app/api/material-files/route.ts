import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { materialKey, readUrl, removeObject, uploadUrl } from "@/lib/r2";
import { getStaffProfile } from "@/lib/auth/staff-profile";
import { adminEmailVerified } from "@/lib/auth/admin-security";

export const runtime = "nodejs";
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function POST(request: Request) {
  // Mutating requests must originate from this app, not a third-party website.
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: "Invalid request origin." }, 403);
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: "Sign in to access files." }, 401);
  try {
    const staff = await getStaffProfile(supabase, user.id);
    if (staff?.role === "admin" && (staff.status !== "active" || !await adminEmailVerified(supabase))) return json({ error: "Administrator email verification required." }, 403);
  } catch { return json({ error: "Account security could not be verified." }, 503); }
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  if (!body || typeof body !== "object") return json({ error: "Invalid request." }, 400);
  try {
    if (body.action === "upload") {
      const { streamId, materialId, fileName, size, mimeType, moduleId } = body;
      if (typeof streamId !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(streamId) ||
          typeof materialId !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(materialId) ||
          typeof fileName !== "string" || !fileName || fileName.length > 255 ||
          !Number.isSafeInteger(size) || size < 1 || size > 500 * 1024 * 1024 ||
          (moduleId != null && typeof moduleId !== "string") ||
          typeof mimeType !== "string" || !/^[\w.+-]+\/[\w.+-]+$/.test(mimeType))
        return json({ error: "Choose a valid file no larger than 500 MB and a class." }, 400);
      const { data: allowed, error } = await supabase.rpc("staff_material_scope", { target_stream: streamId, target_module: moduleId ?? null });
      if (error || !allowed) return json({ error: "You cannot upload to this class or module." }, 403);
      const key = `${streamId}/${materialId}/${user.id}/${randomUUID()}/${fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120)}`;
      return json({ path: `r2:${key}`, url: await uploadUrl(key, mimeType, size) });
    }
    if (body.action === "read" || body.action === "delete" || body.action === "cleanup") {
      if (typeof body.materialId !== "string") return json({ error: "Invalid material." }, 400);
      // This query uses the caller's session: existing class/module RLS applies.
      const { data: item, error } = await supabase.from("materials").select("*").eq("id", body.materialId).maybeSingle();
      if (error || !item?.file_path?.startsWith("r2:") || !item.stream_id) return json({ error: "File unavailable." }, 404);
      // A material can be reassigned to a class without moving its object.
      // RLS checks its current class; the key must still belong to this row ID.
      const key = materialKey(item.file_path, item.file_path.slice(3).split("/")[0], item.id);
      if (body.action === "read") return json({ url: await readUrl(key, item.file_name || item.title, body.download === true), fileName: item.file_name || item.title, mimeType: item.mime_type });
      const { data: allowed, error: scopeError } = await supabase.rpc("staff_material_scope", { target_stream: item.stream_id, target_module: item.module_id });
      if (scopeError || !allowed) return json({ error: "You cannot delete this material." }, 403);
      if (body.action === "cleanup") {
        if (typeof body.path !== "string" || body.path === item.file_path) return json({ error: "File is still in use." }, 409);
        const oldStream = body.path.slice(3).split("/")[0];
        const oldKey = materialKey(body.path, oldStream, item.id);
        const { data: oldAllowed, error: oldError } = await supabase.rpc("staff_material_scope", { target_stream: oldStream, target_module: item.module_id });
        if (oldError || !oldAllowed) return json({ error: "Access denied." }, 403);
        await removeObject(oldKey);
        return json({ ok: true });
      }
      const { data: deleted, error: deleteError } = await supabase.from("materials").delete().eq("id", item.id).eq("file_path", item.file_path).select("id").maybeSingle();
      if (deleteError || !deleted) return json({ error: "Material changed; refresh and try again." }, 409);
      // Metadata is removed first; a failed object deletion cannot expose a file.
      try { await removeObject(key); } catch { console.error("R2 object cleanup failed for deleted material", item.id); }
      return json({ ok: true });
    }
    return json({ error: "Invalid file action." }, 400);
  } catch {
    return json({ error: "File storage is unavailable. Please try again later." }, 503);
  }
}
