"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PastPapersBrowser } from "@/components/staff/past-papers-browser";
import { UploadWorkspace } from "@/components/staff/upload-workspace";
import { useStaffSession } from "@/lib/staff-auth";

export default function LecturerPastPapersPage() {
  const { session } = useStaffSession();
  return (
    <div className="space-y-5">
      <PageHeader
        title="Past papers"
        description="Upload exam papers students can find under Past Papers."
        actions={
          <Button href="/lecturer/uploads" size="sm" variant="outline">
            Full upload desk
          </Button>
        }
      />
      <UploadWorkspace
        title="Publish a past paper"
        description="Students see it on Past Papers as soon as you publish."
        defaultKind="past_paper"
        uploadedBy={session?.name ?? "Lecturer"}
        role="lecturer"
      />
      <PastPapersBrowser
        title="Published past papers"
        description="Live student-facing list"
      />
    </div>
  );
}
