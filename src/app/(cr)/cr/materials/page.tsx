"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { LibraryUploadButton } from "@/components/staff/library-upload-button";
import { MaterialsLibrary } from "@/components/staff/materials-library";
import { useStaffSession } from "@/lib/staff-auth";
import type { MaterialUpload } from "@/types";

export default function ClassRepMaterialsPage() {
  const translateUI = useTranslate();
  const { session } = useStaffSession();
  const streamId = session?.streamId ?? "BENG24COE-1";
  const filterItems = useCallback(
    (items: MaterialUpload[]) =>
      items.filter(
        (u) =>
          u.role === "class_rep" ||
          u.streamId === streamId ||
          !u.streamId,
      ),
    [streamId],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title={translateUI("Class library")}
        description={translateUI("Browse class files — open, download, edit, or remove.")}
        actions={
          <LibraryUploadButton />
        }
      />
      <MaterialsLibrary title={translateUI("Published for your class")} filterItems={filterItems} />
    </div>
  );
}
