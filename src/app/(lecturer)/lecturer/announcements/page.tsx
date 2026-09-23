"use client";

import { PageHeader } from "@/components/layout/page-header";
import { UploadWorkspace } from "@/components/staff/upload-workspace";
import { MaterialsLibrary } from "@/components/staff/materials-library";
import { useStaffSession } from "@/lib/staff-auth";
import type { MaterialUpload } from "@/types";
import { useCallback } from "react";

export default function LecturerAnnouncementsPage() {
  const { session } = useStaffSession();
  const filterItems = useCallback(
    (items: MaterialUpload[]) =>
      items.filter(
        (u) =>
          u.kind === "announcement" &&
          (u.role === "lecturer" || u.uploadedBy === session?.name),
      ),
    [session?.name],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Announcements"
        description="Post class notices. Students see them in notifications and Announcements."
      />
      <UploadWorkspace
        title="Post an announcement"
        description="Title + optional file. Students are notified when you publish."
        defaultKind="announcement"
        uploadedBy={session?.name ?? "Lecturer"}
        role="lecturer"
      />
      <MaterialsLibrary
        title="Your announcements"
        filterItems={filterItems}
      />
    </div>
  );
}
