"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { UploadWorkspace } from "@/components/staff/upload-workspace";
import { MaterialsLibrary } from "@/components/staff/materials-library";
import { useStaffSession } from "@/lib/staff-auth";
import type { MaterialUpload } from "@/types";

export default function LecturerAssignmentsPage() {
  const translateUI = useTranslate();
  const { session } = useStaffSession();

  const filterItems = useCallback(
    (items: MaterialUpload[]) => {
      const moduleIds = session?.moduleIds ?? [];
      return items.filter(
        (u) =>
          u.kind === "assignment" &&
          (moduleIds.length === 0 ||
            !u.moduleId ||
            moduleIds.includes(u.moduleId)) &&
          (u.role === "lecturer" ||
            u.uploadedBy === session?.name ||
            !u.streamId ||
            (session?.streamIds ?? []).includes(u.streamId)),
      );
    },
    [session?.moduleIds, session?.name, session?.streamIds],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        size="lg"
        title={translateUI("Assignments")}
        description={translateUI("Publish coursework briefs for your modules. Students get a notification and can open them from Modules.")}
      />
      <UploadWorkspace
        title={translateUI("Publish assignment file")}
        description={translateUI("Choose one of your modules, attach the brief, then choose all streams or a specific class.")}
        defaultKind="assignment"
        allowedModuleIds={session?.moduleIds}
        uploadedBy={session?.name ?? "Lecturer"}
        role="lecturer"
      />
      <MaterialsLibrary
        title={translateUI("Assignment files for your modules")}
        filterItems={filterItems}
      />
    </div>
  );
}
