// Fixed-size chunks keep memory bounded even for 500 MB files and concurrent uploads.
// Version this algorithm so fingerprints remain comparable across future clients.
export async function fileFingerprint(file: Blob): Promise<string> {
  const chunkSize = 4 * 1024 * 1024;
  const hashes: Uint8Array[] = [];
  for (let offset = 0; offset < file.size; offset += chunkSize) {
    hashes.push(new Uint8Array(await crypto.subtle.digest("SHA-256", await file.slice(offset, offset + chunkSize).arrayBuffer())));
  }
  const combined = new Uint8Array(hashes.length * 32);
  hashes.forEach((hash, index) => combined.set(hash, index * 32));
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", combined));
  return `v1:${Array.from(digest, byte => byte.toString(16).padStart(2, "0")).join("")}`;
}
