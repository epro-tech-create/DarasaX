"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PastPapersBrowser } from "@/components/staff/past-papers-browser";
import { UploadWorkspace } from "@/components/staff/upload-workspace";
import { getActiveLecturerStream } from "@/lib/lecturer-context";
import { useStaffSession } from "@/lib/staff-auth";

export default function LecturerPastPapersPage() {
  const translateUI = useTranslate();
  const { session } = useStaffSession();
  const active = getActiveLecturerStream();
  const locked =
    active && session?.streamIds.includes(active) ? active : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        size="lg"
        title={translateUI("Past papers")}
        description={translateUI("Upload exam papers for your modules. Students find them under Past Papers the moment you publish.")}
        actions={
          <Button href="/lecturer/materials" size="sm" variant="outline">
            Full upload desk
          </Button>
        }
      />
      <UploadWorkspace
        title={translateUI("Publish a past paper")}
        description={translateUI("Limited to modules you teach. Students see it as soon as you publish.")}
        defaultKind="past_paper"
        showStream={!locked}
        lockedStream={locked}
        allowedModuleIds={session?.moduleIds}
        allowedStreamIds={session?.streamIds}
        uploadedBy={session?.name ?? "Lecturer"}
        role="lecturer"
      />
      <PastPapersBrowser
        title={translateUI("Published past papers")}
        description={translateUI("Live student-facing list (shared with admin & class rep uploads)")}
      />
    </div>
  );
}
