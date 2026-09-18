const DB_NAME = "darasax-material-files";
const DB_VERSION = 1;
const STORE = "files";

export type StoredMaterialFile = {
  id: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Failed to open files DB"));
  });
}

export async function saveMaterialFile(
  id: string,
  file: Blob,
  fileName: string,
  mimeType: string,
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ id, blob: file, fileName, mimeType } satisfies StoredMaterialFile);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Failed to save file"));
  });
  db.close();
}

export async function getMaterialFile(
  id: string,
): Promise<StoredMaterialFile | null> {
  try {
    const db = await openDb();
    const row = await new Promise<StoredMaterialFile | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result as StoredMaterialFile | undefined);
      req.onerror = () => reject(req.error ?? new Error("Failed to read file"));
    });
    db.close();
    return row ?? null;
  } catch {
    return null;
  }
}

export async function deleteMaterialFile(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Failed to delete file"));
    });
    db.close();
  } catch {
    // ignore
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
