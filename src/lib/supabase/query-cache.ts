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
const invalidatedEvents = new WeakMap<Event, Set<string>>();

/** All subscribers to one browser event share the same fresh request. */
export function invalidateQueriesForEvent(prefix: string, event: Event) {
  let prefixes = invalidatedEvents.get(event);
  if (prefixes?.has(prefix)) return;
  if (!prefixes) { prefixes = new Set(); invalidatedEvents.set(event, prefixes); }
  prefixes.add(prefix);
  invalidateQueries(prefix);
}

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
      if (store.get(key) === entry) store.set(key, { at: Date.now(), value });
      return value;
    },
    (error) => {
      if (store.get(key) === entry) store.delete(key);
      throw error;
    },
  );
  const entry: Entry = { at: now, promise };
  store.set(key, entry);
  return promise;
}

export function invalidateQueries(prefix: string) {
  if (!prefix) { store.clear(); return; }
  for (const key of [...store.keys()]) {
    if (key === prefix || key.startsWith(`${prefix}:`)) {
      store.delete(key);
    }
  }
}
