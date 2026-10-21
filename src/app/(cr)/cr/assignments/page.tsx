"use client";
import { useTranslate } from "@/components/providers/language-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { StaffSection } from "@/components/staff/staff-ui";
import { assignments, getModule } from "@/data/mock";

export default function ClassRepAssignmentsPage() {
  const translateUI = useTranslate();
  return (
    <div className="space-y-5">
      <PageHeader
        title={translateUI("Assignments pulse")}
        description={translateUI("See what the class is working on and what is overdue.")}
      />
      <StaffSection title={translateUI("Semester board")} description={translateUI(`${assignments.length} items`)}>
        <div className="space-y-2">
          {assignments.map((a) => {
            const module = getModule(a.moduleId);
            return (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {translateUI(module?.code)} {translateUI(" · due")}{" "}
                    {translateUI(new Date(a.deadline).toLocaleDateString(translateUI.locale, {
                      day: "numeric",
                      month: "short",
                    }))}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Badge
                    tone={
                      a.priority === "high"
                        ? "danger"
                        : a.priority === "medium"
                          ? "warning"
                          : "default"
                    }
                  >
                    {translateUI(a.priority)}
                  </Badge>
                  <Badge
                    tone={
                      a.status === "overdue"
                        ? "danger"
                        : a.status === "completed"
                          ? "success"
                          : "primary"
                    }
                  >
                    {translateUI(a.status)}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </StaffSection>
    </div>
  );
}
