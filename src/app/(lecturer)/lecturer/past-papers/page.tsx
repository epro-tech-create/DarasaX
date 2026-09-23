"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PastPapersBrowser } from "@/components/staff/past-papers-browser";
import { UploadWorkspace } from "@/components/staff/upload-workspace";
import { getActiveLecturerStream } from "@/lib/lecturer-context";
import { useStaffSession } from "@/lib/staff-auth";

export default function LecturerPastPapersPage() {
  const { session } = useStaffSession();
  const active = getActiveLecturerStream();
  const locked =
    active && session?.streamIds.includes(active) ? active : undefined;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Past papers"
        description="Upload exam papers for your modules. Students find them under Past Papers."
        actions={
          <Button href="/lecturer/uploads" size="sm" variant="outline">
            Full upload desk
          </Button>
        }
      />
      <UploadWorkspace
        title="Publish a past paper"
        description="Limited to modules you teach. Students see it as soon as you publish."
        defaultKind="past_paper"
        showStream={!locked}
        lockedStream={locked}
        allowedModuleIds={session?.moduleIds}
        allowedStreamIds={session?.streamIds}
        uploadedBy={session?.name ?? "Lecturer"}
        role="lecturer"
      />
      <PastPapersBrowser
        title="Published past papers"
        description="Live student-facing list (shared with admin & class rep uploads)"
      />
    </div>
  );
}
