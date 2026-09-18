import Link from "next/link";
import type { Assignment, Module } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deadlineLabel, daysUntil, cn } from "@/lib/utils";
import { ArrowUpRight, Clock3 } from "lucide-react";

export function DeadlineBadge({ deadline }: { deadline: string }) {
  const days = daysUntil(deadline);
  const tone =
    days < 0 || days <= 1 ? "danger" : days <= 3 ? "warning" : "success";
  return <Badge tone={tone}>{deadlineLabel(deadline)}</Badge>;
}

export function AssignmentCard({
  assignment,
  module,
  className,
}: {
  assignment: Assignment;
  module?: Module;
  className?: string;
}) {
  return (
    <Link
      href={`/assignments/${assignment.id}`}
      className={cn(
        "surface group relative flex flex-col gap-3 overflow-hidden rounded-[16px] p-3.5 transition duration-200 sm:flex-row sm:items-center sm:justify-between sm:p-4",
        "hover:scale-[1.01] hover:border-primary hover:shadow-lg hover:shadow-primary/20",
        className,
      )}
    >
      {module ? (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: module.accent }}
        />
      ) : null}
      <div className="min-w-0 pl-1.5 sm:pl-2">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <DeadlineBadge deadline={assignment.deadline} />
          <Badge
            tone={
              assignment.priority === "high"
                ? "danger"
                : assignment.priority === "medium"
                  ? "warning"
                  : "default"
            }
          >
            {assignment.priority}
          </Badge>
          {assignment.status === "completed" ? (
            <Badge tone="success">Done</Badge>
          ) : null}
        </div>
        <h3 className="font-heading text-[13px] font-semibold tracking-tight group-hover:text-primary sm:text-[14px]">
          {assignment.title}
        </h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
          <span>{module?.name || "Module"}</span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3 w-3" />
            {new Date(assignment.deadline).toLocaleString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 pl-1.5 sm:pl-0">
        <Button
          size="sm"
          variant="outline"
          className="pointer-events-none"
          tabIndex={-1}
        >
          Open
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Link>
  );
}
