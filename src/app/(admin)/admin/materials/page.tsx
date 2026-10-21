"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { PageHeader } from "@/components/layout/page-header";
import { LibraryUploadButton } from "@/components/staff/library-upload-button";
import { MaterialsLibrary } from "@/components/staff/materials-library";

export default function AdminMaterialsPage() {
  const translateUI = useTranslate();
  return (
    <div className="space-y-5">
      <PageHeader
        title={translateUI("Library")}
        description={translateUI("Open, download, edit, or remove files students can access.")}
        actions={
          <LibraryUploadButton />
        }
      />
      <MaterialsLibrary />
    </div>
  );
}
