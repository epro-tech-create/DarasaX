"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PastPapersBrowser } from "@/components/staff/past-papers-browser";
import { UploadWorkspace } from "@/components/staff/upload-workspace";
import { adminUser } from "@/data/staff-mock";

export default function AdminPastPapersPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Past papers"
        description="Upload papers and review everything students can see."
      />
      <UploadWorkspace
        title="Publish past paper"
        description="Use a clear title with year and type (CAT / Test / Final)."
        defaultKind="past_paper"
        showStream={false}
        uploadedBy={adminUser.name}
        role="admin"
      />
      <PastPapersBrowser />
    </div>
  );
}
