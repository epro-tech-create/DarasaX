"use client";

import { useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { UploadWorkspace } from "@/components/staff/upload-workspace";
import { MaterialsLibrary } from "@/components/staff/materials-library";
import { getActiveLecturerStream } from "@/lib/lecturer-context";
import { useStaffSession } from "@/lib/staff-auth";
import type { MaterialUpload } from "@/types";

export default function LecturerAssignmentsPage() {
  const { session } = useStaffSession();
  const active = getActiveLecturerStream();
  const locked =
    active && session?.streamIds.includes(active) ? active : undefined;
  const moduleIds = session?.moduleIds ?? [];

  const filterItems = useCallback(
    (items: MaterialUpload[]) =>
      items.filter(
        (u) =>
          u.kind === "assignment" &&
          (moduleIds.length === 0 ||
            !u.moduleId ||
            moduleIds.includes(u.moduleId)) &&
          (u.role === "lecturer" ||
            u.uploadedBy === session?.name ||
            !u.streamId ||
            (session?.streamIds ?? []).includes(u.streamId)),
      ),
    [moduleIds, session?.name, session?.streamIds],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Assignments"
        description="Upload coursework briefs for your modules. Students get a notification and can open them from Modules."
      />
      <UploadWorkspace
        title="Publish assignment file"
        description="Choose one of your modules, attach the brief, then publish to the active class."
        defaultKind="assignment"
        showStream={!locked}
        lockedStream={locked}
        allowedModuleIds={session?.moduleIds}
        allowedStreamIds={session?.streamIds}
        uploadedBy={session?.name ?? "Lecturer"}
        role="lecturer"
      />
      <MaterialsLibrary
        title="Assignment files for your modules"
        filterItems={filterItems}
      />
    </div>
  );
}
