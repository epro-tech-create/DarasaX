"use client";
import { useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { UploadWorkspace } from "@/components/staff/upload-workspace";
import { MaterialsLibrary } from "@/components/staff/materials-library";
import { useStaffSession } from "@/lib/staff-auth";
import { useTranslate } from "@/components/providers/language-provider";
import type { MaterialUpload } from "@/types";

export function StaffAssignments() {
  const t = useTranslate();
  const { session } = useStaffSession();
  const filter = useCallback((items: MaterialUpload[]) => items.filter(item => item.kind === "assignment"), []);
  if (!session) return <p role="status">{t("Loading assignments…")}</p>;
  return <div className="space-y-5">
    <PageHeader title={t("Assignments")} description={t("Publish assignments, choose online or offline hand-in, and review student submissions.")} />
    <UploadWorkspace title={t("Publish assignment")} description={t("Choose the class and module, attach the assignment, and select how students should submit their work.")} defaultKind="assignment" uploadedBy={session.name} role={session.role} allowedModuleIds={session.role === "lecturer" ? session.moduleIds : undefined} />
    <MaterialsLibrary title={t("Assignments and submissions")} filterItems={filter} />
  </div>;
}
