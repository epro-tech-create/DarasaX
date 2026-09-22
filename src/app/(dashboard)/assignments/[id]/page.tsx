"use client";

import { useMemo } from "react";
import { notFound, useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeadlineBadge } from "@/components/assignments/assignment-card";
import { getModule, resources } from "@/data/mock";
import { useAssignments } from "@/lib/assignment-progress-store";
import { downloadFile, downloadResource } from "@/lib/download";
import { CheckCircle2, Download, FileText, RotateCcw } from "lucide-react";

export default function AssignmentDetailPage() {
  const params = useParams<{ id: string }>();
  const { items, markCompleted, setStatus } = useAssignments();
  const assignment = useMemo(
    () => items.find((a) => a.id === params.id),
    [items, params.id],
  );

  if (!assignment) notFound();

  const completed = assignment.status === "completed";
  const module = getModule(assignment.moduleId);
  const related = resources.filter((r) =>
    assignment.relatedResourceIds.includes(r.id),
  );

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={assignment.title}
        description={`${module?.name || "Module"} · ${assignment.lecturer}`}
        actions={<DeadlineBadge deadline={assignment.deadline} />}
      />

      <div className="surface space-y-5 rounded-[20px] p-4 sm:space-y-6 sm:p-6">
        <div className="flex flex-wrap gap-2">
          <Badge
            tone={
              assignment.priority === "high"
                ? "danger"
                : assignment.priority === "medium"
                  ? "warning"
                  : "default"
            }
          >
            {assignment.priority} priority
          </Badge>
          {completed ? <Badge tone="success">Completed</Badge> : null}
        </div>

        <section>
          <h2 className="font-heading text-[14px] font-semibold">Description</h2>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
            {assignment.description}
          </p>
        </section>

        <section>
          <h2 className="font-heading text-[14px] font-semibold">
            Submission instructions
          </h2>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
            {assignment.instructions}
          </p>
        </section>

        {assignment.attachedFiles.length > 0 ? (
          <section>
            <h2 className="font-heading text-[14px] font-semibold">
              Attached files
            </h2>
            <ul className="mt-3 space-y-2">
              {assignment.attachedFiles.map((file) => (
                <li
                  key={file.name}
                  className="flex items-center gap-3 rounded-2xl bg-muted/60 px-3 py-2.5 sm:px-4 sm:py-3"
                >
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground">{file.size}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    className="shrink-0"
                    onClick={() => downloadFile(file.url, file.name)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {related.length > 0 ? (
          <section>
            <h2 className="font-heading text-[14px] font-semibold">
              Related module resources
            </h2>
            <ul className="mt-3 space-y-2">
              {related.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-3 rounded-2xl bg-muted/60 px-3 py-2.5 sm:px-4 sm:py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium">{r.title}</p>
                    <p className="text-[10px] text-muted-foreground">{r.size}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => downloadResource(r)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => markCompleted(assignment.id)}
            disabled={completed}
            className="w-full sm:w-auto"
            type="button"
          >
            <CheckCircle2 className="h-4 w-4" />
            {completed ? "Marked as completed" : "Mark as Completed"}
          </Button>
          {completed ? (
            <Button
              variant="outline"
              type="button"
              className="w-full sm:w-auto"
              onClick={() => setStatus(assignment.id, "upcoming")}
            >
              <RotateCcw className="h-4 w-4" />
              Move back to Upcoming
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
