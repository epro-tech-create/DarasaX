"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { AnnouncementWorkspace } from "@/components/staff/announcement-workspace";
import { UploadWorkspace } from "@/components/staff/upload-workspace";
import { useStaffSession } from "@/lib/staff-auth";

export default function LecturerAnnouncementsPage() {
  const translateUI = useTranslate();
  const { session } = useStaffSession();

  return (
    <div className="space-y-6">
      <AnnouncementWorkspace role="lecturer" />
      <UploadWorkspace
        title={translateUI("Attach announcement files")}
        description={translateUI("Choose your module, attach files, and select all streams or a specific class.")}
        defaultKind="announcement"
        allowedModuleIds={session?.moduleIds}
        uploadedBy={session?.name ?? "Lecturer"}
        role="lecturer"
      />
    </div>
  );
}
