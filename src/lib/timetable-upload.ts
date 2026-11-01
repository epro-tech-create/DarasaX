"use client";
import { createClient } from "@/lib/supabase/client";
import type { ImportSession } from "@/lib/timetable-import";

const mime: Record<string, string> = { xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };
export async function readTimetableResponse(response: Response): Promise<{ sessions: ImportSession[]; text: string; warning: string }> {
  const body = await response.text();
  let result;
  try { result = JSON.parse(body); }
  catch {
    if (response.status === 413) throw new Error("The upload was too large for the server. Refresh the app and try uploading again.");
    if (response.status === 401 || response.status === 403) throw new Error("Your session could not be verified. Sign in again and retry the import.");
    if (response.status === 504) throw new Error("Reading the timetable took too long. Try a clearer or smaller image.");
    throw new Error("The timetable service returned an unexpected response. Please refresh and try again.");
  }
  if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "Could not read this timetable. Please try again.");
  if (!Array.isArray(result?.sessions) || typeof result.text !== "string" || typeof result.warning !== "string") throw new Error("The timetable service returned an unexpected response. Please refresh and try again.");
  return result;
}

export async function uploadTimetableDocument(file: File, streamId: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!mime[ext]) throw new Error("Choose an Excel (.xlsx), PDF, JPG, or PNG timetable.");
  if (file.size < 1 || file.size > 10 * 1024 * 1024) throw new Error("Choose a file no larger than 10 MB.");
  const client = createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error("Sign in again before importing a timetable.");
  const path = `${streamId}/${user.id}/${crypto.randomUUID()}.${ext}`;
  const bucket = client.storage.from("timetable-import-uploads");
  const { error: uploadError } = await bucket.upload(path, file, { contentType: mime[ext], upsert: false });
  if (uploadError) throw new Error("Could not upload the timetable. Check your class access and connection, then try again.");
  try {
    // File bytes go directly to private storage, bypassing the Function body limit.
    const response = await fetch(`/api/timetable-import?class=${encodeURIComponent(streamId)}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path, fileName: file.name }),
    });
    return await readTimetableResponse(response);
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError) throw new Error("The upload request could not be completed. Check your connection, refresh DarasaX, and try again.");
    throw error;
  } finally { await bucket.remove([path]).catch(() => null); }
}
