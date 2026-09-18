import { PageHeader } from "@/components/layout/page-header";
import { UploadWorkspace } from "@/components/staff/upload-workspace";
import { adminUser } from "@/data/staff-mock";

export default function AdminUploadsPage() {
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
        uploadedBy={adminUser.name}
        role="admin"
      />
    </div>
  );
}
