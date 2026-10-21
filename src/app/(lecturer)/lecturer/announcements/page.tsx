"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { UploadWorkspace } from "@/components/staff/upload-workspace";
import { MaterialsLibrary } from "@/components/staff/materials-library";
import { getActiveLecturerStream } from "@/lib/lecturer-context";
import { useStaffSession } from "@/lib/staff-auth";
import type { MaterialUpload } from "@/types";

export default function LecturerAnnouncementsPage() {
  const translateUI = useTranslate();
  const { session } = useStaffSession();
  const active = getActiveLecturerStream();
  const locked =
    active && session?.streamIds.includes(active) ? active : undefined;

  const filterItems = useCallback(
    (items: MaterialUpload[]) =>
      items.filter(
        (u) =>
          u.kind === "announcement" &&
          (u.role === "lecturer" ||
            u.uploadedBy === session?.name ||
            !u.streamId ||
            (session?.streamIds ?? []).includes(u.streamId)),
      ),
    [session?.name, session?.streamIds],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        size="lg"
        title={translateUI("Announcements")}
        description={translateUI("Post class notices for your streams. Students see them in notifications and on the Announcements page.")}
      />
      <UploadWorkspace
        title={translateUI("Post an announcement")}
        description={translateUI("Title + optional file for one of your modules / the active class.")}
        defaultKind="announcement"
        showStream={!locked}
        lockedStream={locked}
        allowedModuleIds={session?.moduleIds}
        allowedStreamIds={session?.streamIds}
        uploadedBy={session?.name ?? "Lecturer"}
        role="lecturer"
      />
      <MaterialsLibrary
        title={translateUI("Class announcements")}
        filterItems={filterItems}
      />
    </div>
  );
}
