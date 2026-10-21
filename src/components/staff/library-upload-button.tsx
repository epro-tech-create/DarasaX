"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { useState } from "react";
import { FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaffModal } from "@/components/staff/staff-modal";
import { UploadWorkspace } from "@/components/staff/upload-workspace";
import { useStaffSession } from "@/lib/staff-auth";

export function LibraryUploadButton() {
  const translateUI = useTranslate();
  const { session } = useStaffSession();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return <>
    <Button size="sm" disabled={!session} onClick={() => setOpen(true)}><FileUp className="h-4 w-4" />{translateUI("Upload")}</Button>
    <StaffModal open={open} onClose={() => { if (!busy) setOpen(false); }} title={translateUI("Upload to library")} className="sm:max-w-5xl">
      {open && session && <UploadWorkspace title={translateUI("Publish materials")} description={translateUI("Upload multiple files to all streams or choose a specific class. Maximum 500 MB per file.")}
        role={session.role} uploadedBy={session.name}
        allowedModuleIds={session.role === "lecturer" ? session.moduleIds : undefined}
        onBusyChange={setBusy} />}
    </StaffModal>
  </>;
}
