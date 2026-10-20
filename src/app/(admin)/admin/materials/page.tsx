"use client";

import { PageHeader } from "@/components/layout/page-header";
import { LibraryUploadButton } from "@/components/staff/library-upload-button";
import { MaterialsLibrary } from "@/components/staff/materials-library";

export default function AdminMaterialsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Library"
        description="Open, download, edit, or remove files students can access."
        actions={
          <LibraryUploadButton />
        }
      />
      <MaterialsLibrary />
    </div>
  );
}
