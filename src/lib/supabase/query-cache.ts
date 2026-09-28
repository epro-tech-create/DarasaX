// Client-side query cache for Supabase reads.
//
// Two jobs:
//  1. De-dupe in-flight requests — several components mount the same store on
//     one page, and without this each mount fires its own identical query.
//  2. Short TTL reuse — navigating between pages within the TTL reuses data
//     instantly instead of hitting the backend on every mount.
//
// Mutations must call invalidateQueries() so the next refresh refetches.

type Entry =
  | { at: number; value: unknown }
  | { at: number; promise: Promise<unknown> };

const store = new Map<string, Entry>();

export const QUERY_TTL_MS = 30_000;

export async function cachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = QUERY_TTL_MS,
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit) {
    if ("promise" in hit) return hit.promise as Promise<T>;
    if (now - hit.at < ttlMs) return hit.value as T;
  }
  const promise = fetcher().then(
    (value) => {
      store.set(key, { at: Date.now(), value });
      return value;
    },
    (error) => {
      store.delete(key);
      throw error;
    },
  );
  store.set(key, { at: now, promise });
  return promise;
}

export function invalidateQueries(prefix: string) {
  for (const key of [...store.keys()]) {
    if (key === prefix || key.startsWith(`${prefix}:`)) {
      store.delete(key);
    }
  }
}
