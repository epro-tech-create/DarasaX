"use client";

import { useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { UploadWorkspace } from "@/components/staff/upload-workspace";
import { MaterialsLibrary } from "@/components/staff/materials-library";
import { useStaffSession } from "@/lib/staff-auth";
import type { MaterialUpload } from "@/types";

export default function LecturerAssignmentsPage() {
  const { session } = useStaffSession();
  const filterItems = useCallback(
    (items: MaterialUpload[]) =>
      items.filter(
        (u) =>
          u.kind === "assignment" &&
          (u.role === "lecturer" || u.uploadedBy === session?.name),
      ),
    [session?.name],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Assignments"
        description="Upload coursework briefs and files. Students get a notification and can open them from Modules / Library."
      />
      <UploadWorkspace
        title="Publish assignment file"
        description="Choose the module, attach the brief or sheet, then publish to students."
        defaultKind="assignment"
        uploadedBy={session?.name ?? "Lecturer"}
        role="lecturer"
      />
      <MaterialsLibrary
        title="Assignment files you published"
        filterItems={filterItems}
      />
    </div>
  );
}
