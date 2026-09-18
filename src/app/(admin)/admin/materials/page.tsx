"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { MaterialsLibrary } from "@/components/staff/materials-library";

export default function AdminMaterialsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Library"
        description="Open, download, edit, or remove files students can access."
        actions={
          <Button href="/admin/uploads" size="sm">
            Upload
          </Button>
        }
      />
      <MaterialsLibrary />
    </div>
  );
}
