"use client";

import { PageHeader } from "@/components/layout/page-header";
import { UploadWorkspace } from "@/components/staff/upload-workspace";
import { useStaffSession } from "@/lib/staff-auth";

export default function AdminUploadsPage() {
  const { session } = useStaffSession();
  return (
    <div className="space-y-5">
      <PageHeader
        title="Upload"
        description="Publish once — students see it in Modules or Past Papers immediately."
      />
      <UploadWorkspace
        title="Send to student library"
        description="Pick type and module, then publish. No separate student upload step."
        defaultKind="notes"
        uploadedBy={session?.name ?? "Admin"}
        role="admin"
      />
    </div>
  );
}
