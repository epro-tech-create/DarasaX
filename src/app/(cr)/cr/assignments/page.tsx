import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { StaffSection } from "@/components/staff/staff-ui";
import { assignments, getModule } from "@/data/mock";

export default function ClassRepAssignmentsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Assignments pulse"
        description="See what the class is working on and what is overdue."
      />
      <StaffSection title="Semester board" description={`${assignments.length} items`}>
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
                    {module?.code} · due{" "}
                    {new Date(a.deadline).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
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
                    {a.priority}
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
                    {a.status}
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
