"use client";
import { useState } from "react";
import { FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaffModal } from "@/components/staff/staff-modal";
import { UploadWorkspace } from "@/components/staff/upload-workspace";
import { useStaffSession } from "@/lib/staff-auth";
import { getActiveLecturerStream } from "@/lib/lecturer-context";

export function LibraryUploadButton() {
  const { session } = useStaffSession();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const active = getActiveLecturerStream();
  const locked = session?.role === "class_rep" ? session.streamId ?? undefined
    : session?.role === "lecturer" && active && session.streamIds.includes(active) ? active : undefined;
  return <>
    <Button size="sm" disabled={!session} onClick={() => setOpen(true)}><FileUp className="h-4 w-4" />Upload</Button>
    <StaffModal open={open} onClose={() => { if (!busy) setOpen(false); }} title="Upload to library" className="sm:max-w-5xl">
      {open && session && <UploadWorkspace title="Publish materials" description="Choose the class, module and file type. Maximum 500 MB per file."
        role={session.role} uploadedBy={session.name} lockedStream={locked} showStream={!locked}
        allowedModuleIds={session.role === "lecturer" ? session.moduleIds : undefined}
        allowedStreamIds={session.role === "lecturer" ? session.streamIds : undefined}
        onBusyChange={setBusy} />}
    </StaffModal>
  </>;
}
