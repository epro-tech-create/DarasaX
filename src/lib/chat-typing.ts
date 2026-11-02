/** Only activity flags are shared; drafts and message text never leave the input. */
export const TYPING_EXPIRY_MS = 6000;
export function countOtherTypists(state: Record<string, unknown[]>, self: string, now: number): number {
  const people = new Set<string>();
  for (const entries of Object.values(state)) {
    for (const entry of entries) {
      if (!entry || typeof entry !== "object") continue;
      const value = entry as Record<string, unknown>;
      if (value.typing !== true || typeof value.user_id !== "string" || !value.user_id || value.user_id === self || typeof value.updated_at !== "number") continue;
      const age = now - value.updated_at;
      if (age >= -3000 && age < TYPING_EXPIRY_MS) people.add(value.user_id);
    }
  }
  return people.size;
}
