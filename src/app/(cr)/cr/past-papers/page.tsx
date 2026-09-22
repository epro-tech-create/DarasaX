"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PastPapersBrowser } from "@/components/staff/past-papers-browser";
import { UploadWorkspace } from "@/components/staff/upload-workspace";
import { useStaffSession } from "@/lib/staff-auth";

export default function ClassRepPastPapersPage() {
  const { session } = useStaffSession();
  return (
    <div className="space-y-5">
      <PageHeader
        title="Past papers"
        description="Publish for your class and browse all papers students can open."
      />
      <UploadWorkspace
        title="Publish past paper"
        description="Papers appear on the student Past Papers page and here."
        defaultKind="past_paper"
        showStream={false}
        uploadedBy={session?.name ?? "Class Rep"}
        role="class_rep"
      />
      <PastPapersBrowser
        title="Papers students see"
        description="Includes library papers and new uploads from Admin or Class Rep."
      />
    </div>
  );
}
