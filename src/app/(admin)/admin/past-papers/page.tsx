import { PageHeader } from "@/components/layout/page-header";
import { UploadWorkspace } from "@/components/staff/upload-workspace";
import { adminUser } from "@/data/staff-mock";

export default function AdminPastPapersPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Past papers"
        description="Upload a PDF and it appears on the student Past Papers page."
      />
      <UploadWorkspace
        title="Publish past paper"
        description="Use a clear title with year and type (CAT / Test / Final)."
        defaultKind="past_paper"
        showStream={false}
        uploadedBy={adminUser.name}
        role="admin"
      />
    </div>
  );
}
