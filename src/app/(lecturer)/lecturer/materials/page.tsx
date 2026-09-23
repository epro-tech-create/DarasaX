"use client";

import { useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { MaterialsLibrary } from "@/components/staff/materials-library";
import { getActiveLecturerStream } from "@/lib/lecturer-context";
import { useStaffSession } from "@/lib/staff-auth";
import type { MaterialUpload } from "@/types";

export default function LecturerMaterialsPage() {
  const { session } = useStaffSession();
  const active = getActiveLecturerStream();
  const moduleIds = session?.moduleIds ?? [];
  const streamIds = session?.streamIds ?? [];

  const filterItems = useCallback(
    (items: MaterialUpload[]) =>
      items.filter((u) => {
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
      }),
    [active, moduleIds, session?.name, streamIds],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Teaching library"
        description="Shared published files for your modules and classes — including uploads from admin and class reps."
        actions={
          <Button href="/lecturer/uploads" size="sm">
            Upload more
          </Button>
        }
      />
      <MaterialsLibrary title="Class & module materials" filterItems={filterItems} />
    </div>
  );
}
