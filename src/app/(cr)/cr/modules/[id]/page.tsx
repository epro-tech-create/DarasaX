"use client";

import { useCallback } from "react";
import { notFound, useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { useTranslate } from "@/components/providers/language-provider";
import { LibraryUploadButton } from "@/components/staff/library-upload-button";
import { MaterialsLibrary } from "@/components/staff/materials-library";
import { getModule } from "@/data/mock";
import { useStaffSession } from "@/lib/staff-auth";
import type { MaterialUpload } from "@/types";

export default function ClassRepModulePage() {
  const { id } = useParams<{ id: string }>();
  const courseModule = getModule(id);
  const { session } = useStaffSession();
  const translateUI = useTranslate();
  const streamId = session?.streamId;
  const filterItems = useCallback(
    (items: MaterialUpload[]) => items.filter((item) =>
      item.moduleId === id && (!item.streamId || item.streamId === streamId),
    ),
    [id, streamId],
  );

  if (!courseModule) notFound();

  return (
    <div className="space-y-5">
      <PageHeader title={courseModule.name} description={courseModule.code}
        actions={<LibraryUploadButton moduleId={id} />} />
      <MaterialsLibrary title={translateUI("Published for your class")} filterItems={filterItems} />
    </div>
  );
}
