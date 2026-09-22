"use client";

import { PageHeader } from "@/components/layout/page-header";
import { UploadWorkspace } from "@/components/staff/upload-workspace";
import { useStaffSession } from "@/lib/staff-auth";

export default function ClassRepUploadsPage() {
  const { session } = useStaffSession();
  const streamId = session?.streamId ?? "BENG24COE-1";
  return (
    <div className="space-y-5">
      <PageHeader
        title="Upload"
        description={`Files go straight to ${streamId} students.`}
      />
      <UploadWorkspace
        title="Share with your class"
        description="Lecture notes and slides publish into the student library in one step."
        defaultKind="notes"
        showStream={false}
        lockedStream={streamId}
        uploadedBy={session?.name ?? "Class Rep"}
        role="class_rep"
      />
    </div>
  );
}
