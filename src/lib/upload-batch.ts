export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;
export type UploadState = "queued" | "uploading" | "published" | "failed";

/** Keep large uploads bounded; a failed file never cancels its siblings. */
export async function publishBatch<T>(items: readonly T[], publish: (item: T) => Promise<unknown>, update: (index: number, state: UploadState, error?: string) => void, concurrency = 3) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(items.length, Math.max(1, concurrency)) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      update(index, "uploading");
      try { await publish(items[index]); update(index, "published"); }
      catch (error) { update(index, "failed", error instanceof Error ? error.message : "Could not upload this file. Please try again."); }
    }
  });
  await Promise.all(workers);
}
