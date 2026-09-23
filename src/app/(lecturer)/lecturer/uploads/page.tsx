"use client";

import { PageHeader } from "@/components/layout/page-header";
import { UploadWorkspace } from "@/components/staff/upload-workspace";
import { getActiveLecturerStream } from "@/lib/lecturer-context";
import { useStaffSession } from "@/lib/staff-auth";

export default function LecturerUploadsPage() {
  const { session } = useStaffSession();
  const active = getActiveLecturerStream();
  const locked =
    active && session?.streamIds.includes(active) ? active : undefined;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Upload"
        description="Publish notes, slides, past papers, or assignment files for the modules you teach — students see them immediately."
      />
      <UploadWorkspace
        title="Send to student library"
        description="Only your assigned modules appear here. Files publish to the active class stream."
        defaultKind="notes"
        showStream={!locked}
        lockedStream={locked}
        allowedModuleIds={session?.moduleIds}
        allowedStreamIds={session?.streamIds}
        uploadedBy={session?.name ?? "Lecturer"}
        role="lecturer"
      />
    </div>
  );
}
