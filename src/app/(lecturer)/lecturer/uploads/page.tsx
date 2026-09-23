"use client";

import { PageHeader } from "@/components/layout/page-header";
import { UploadWorkspace } from "@/components/staff/upload-workspace";
import { useStaffSession } from "@/lib/staff-auth";

export default function LecturerUploadsPage() {
  const { session } = useStaffSession();
  return (
    <div className="space-y-5">
      <PageHeader
        title="Upload"
        description="Publish notes, slides, past papers, or assignment files — students see them immediately."
      />
      <UploadWorkspace
        title="Send to student library"
        description="Pick type and module, then publish. No separate student upload step."
        defaultKind="notes"
        showStream
        uploadedBy={session?.name ?? "Lecturer"}
        role="lecturer"
      />
    </div>
  );
}
