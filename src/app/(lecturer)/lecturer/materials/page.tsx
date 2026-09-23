"use client";

import { useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { MaterialsLibrary } from "@/components/staff/materials-library";
import { useStaffSession } from "@/lib/staff-auth";
import type { MaterialUpload } from "@/types";

export default function LecturerMaterialsPage() {
  const { session } = useStaffSession();
  const filterItems = useCallback(
    (items: MaterialUpload[]) =>
      items.filter(
        (u) =>
          u.role === "lecturer" ||
          u.uploadedBy === session?.name ||
          !u.streamId,
      ),
    [session?.name],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Teaching library"
        description="Browse, open, download, edit, or remove published files."
        actions={
          <Button href="/lecturer/uploads" size="sm">
            Upload more
          </Button>
        }
      />
      <MaterialsLibrary title="Your materials" filterItems={filterItems} />
    </div>
  );
}
