"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { LibraryUploadButton } from "@/components/staff/library-upload-button";
import { MaterialsLibrary } from "@/components/staff/materials-library";
import { getActiveLecturerStream } from "@/lib/lecturer-context";
import { useStaffSession } from "@/lib/staff-auth";
import type { MaterialUpload } from "@/types";

export default function LecturerMaterialsPage() {
  const translateUI = useTranslate();
  const { session } = useStaffSession();
  const active = getActiveLecturerStream();

  const filterItems = useCallback(
    (items: MaterialUpload[]) => {
      const moduleIds = session?.moduleIds ?? [];
      const streamIds = session?.streamIds ?? [];
      return items.filter((u) => {
        const moduleOk =
          moduleIds.length === 0 ||
          !u.moduleId ||
          moduleIds.includes(u.moduleId);
        const streamOk =
          !u.streamId ||
          streamIds.includes(u.streamId) ||
          (active ? u.streamId === active : false);
        const mine =
          u.role === "lecturer" || u.uploadedBy === session?.name;
        return (moduleOk && streamOk) || mine;
      });
    },
    [active, session],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        size="lg"
        title={translateUI("Teaching library")}
        description={translateUI("Published files for your modules and classes — including uploads from admin and class reps.")}
        actions={
          <LibraryUploadButton />
        }
      />
      <MaterialsLibrary title={translateUI("Class & module materials")} filterItems={filterItems} />
    </div>
  );
}
