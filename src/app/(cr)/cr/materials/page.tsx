"use client";

import { useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { LibraryUploadButton } from "@/components/staff/library-upload-button";
import { MaterialsLibrary } from "@/components/staff/materials-library";
import { useStaffSession } from "@/lib/staff-auth";
import type { MaterialUpload } from "@/types";

export default function ClassRepMaterialsPage() {
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
        title="Class library"
        description="Browse class files — open, download, edit, or remove."
        actions={
          <LibraryUploadButton />
        }
      />
      <MaterialsLibrary title="Published for your class" filterItems={filterItems} />
    </div>
  );
}
