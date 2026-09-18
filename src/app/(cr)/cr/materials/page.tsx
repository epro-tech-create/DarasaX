"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffSection } from "@/components/staff/staff-ui";
import { getModule } from "@/data/mock";
import { classRepUser } from "@/data/staff-mock";
import { useMaterialsStore } from "@/lib/materials-store";

export default function ClassRepMaterialsPage() {
  const { items } = useMaterialsStore();
  const uploads = items.filter(
    (u) =>
      u.role === "class_rep" ||
      u.streamId === classRepUser.streamId ||
      !u.streamId,
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Class library"
        description="What your stream can already open."
        actions={
          <Button href="/cr/uploads" size="sm">
            Upload more
          </Button>
        }
      />
      <StaffSection title="Published" description={`${uploads.length} items`}>
        <div className="space-y-2">
          {uploads.map((item) => {
            const module = item.moduleId ? getModule(item.moduleId) : null;
            return (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {module?.code ?? "General"} · {item.kind.replace("_", " ")}
                  </p>
                </div>
                <Badge tone={item.status === "published" ? "success" : "warning"}>
                  {item.status}
                </Badge>
              </div>
            );
          })}
        </div>
      </StaffSection>
    </div>
  );
}
