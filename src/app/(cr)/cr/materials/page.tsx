"use client";

import { useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { MaterialsLibrary } from "@/components/staff/materials-library";
import { classRepUser } from "@/data/staff-mock";
import type { MaterialUpload } from "@/types";

export default function ClassRepMaterialsPage() {
  const filterItems = useCallback(
    (items: MaterialUpload[]) =>
      items.filter(
        (u) =>
          u.role === "class_rep" ||
          u.streamId === classRepUser.streamId ||
          !u.streamId,
      ),
    [],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Class library"
        description="Browse class files — open, download, edit, or remove."
        actions={
          <Button href="/cr/uploads" size="sm">
            Upload more
          </Button>
        }
      />
      <MaterialsLibrary title="Published for your class" filterItems={filterItems} />
    </div>
  );
}
