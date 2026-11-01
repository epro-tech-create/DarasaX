import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractTimetable } from "@/lib/timetable-document";

export const runtime = "nodejs";
export const maxDuration = 120;
const running = new Set<string>();
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: "Invalid request origin." }, 403);
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return json({ error: "Sign in required." }, 401);
  const stream = new URL(request.url).searchParams.get("class") ?? "";
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(stream)) return json({ error: "Choose a valid class." }, 400);
  const { data: allowed, error } = await client.rpc("can_import_timetable", { target_class: stream });
  if (error || !allowed) return json({ error: "Only admins and the assigned class CR can import this timetable." }, 403);
  if (running.has(user.id)) return json({ error: "An import is already being read. Please wait." }, 429);
  running.add(user.id);
  let storedPath: string | null = null;
  try {
    if (request.headers.get("content-type")?.includes("application/json")) {
      const raw = await request.text();
      if (raw.length > 4096) return json({ error: "Invalid import request." }, 400);
      const body = JSON.parse(raw);
      if (typeof body?.path !== "string" || typeof body.fileName !== "string" || body.fileName.length > 255 || /[\\/\r\n]/.test(body.fileName)
          || !body.path.startsWith(`${stream}/${user.id}/`) || body.path.split("/").length !== 3
          || !/^[0-9a-f-]{36}\.(xlsx|pdf|jpg|jpeg|png)$/i.test(body.path.split("/")[2])
          || body.path.split(".").pop()?.toLowerCase() !== body.fileName.split(".").pop()?.toLowerCase()) return json({ error: "Invalid timetable file." }, 400);
      storedPath = body.path;
      const { data, error: downloadError } = await client.storage.from("timetable-import-uploads").download(storedPath!);
      if (downloadError || !data) return json({ error: "The uploaded timetable is unavailable. Please upload it again." }, 400);
      if (data.size < 1 || data.size > 10 * 1024 * 1024) return json({ error: "Choose a file no larger than 10 MB." }, 400);
      return json(await extractTimetable(new File([data], body.fileName, { type: data.type })));
    }
    // Keep small multipart imports working for clients open before this release.
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Choose a timetable file." }, 400);
    const chunks: Uint8Array[] = []; let size = 0;
    for (;;) { const chunk = await reader.read(); if (chunk.done) break; size += chunk.value.byteLength; if (size > 11 * 1024 * 1024) { await reader.cancel(); return json({ error: "Maximum file size is 10 MB." }, 413); } chunks.push(chunk.value); }
    const form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type") ?? "" } }).formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size < 1 || file.size > 10 * 1024 * 1024) return json({ error: "Choose a file no larger than 10 MB." }, 400);
    return json(await extractTimetable(file));
  } catch (error) {
    console.error("Timetable extraction failed", error instanceof Error ? error.message : "Unknown extraction error");
    return json({ error: error instanceof SyntaxError ? "The upload request could not be read. Please refresh and upload the timetable again." : error instanceof Error ? error.message : "Could not read this timetable. Try Excel or a clearer document." }, 400);
  } finally {
    if (storedPath) await client.storage.from("timetable-import-uploads").remove([storedPath]).catch(() => null);
    running.delete(user.id);
  }
}
