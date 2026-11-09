import type { MaterialUpload } from "@/types";

export function isAssignmentDone(
  item: Pick<MaterialUpload, "kind" | "status" | "completedAt" | "dueAt">,
  now = Date.now(),
) {
  return item.kind === "assignment" && item.status === "published" && (
    Boolean(item.completedAt) || Boolean(item.dueAt && Date.parse(item.dueAt) <= now)
  );
}
