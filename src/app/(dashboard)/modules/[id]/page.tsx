"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { notFound, useParams } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardList,
  FileText,
  ScrollText,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MaterialUploadCard } from "@/components/modules/material-upload-card";
import { AssignmentCard } from "@/components/assignments/assignment-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getAssignmentsForModule, getModule } from "@/data/mock";
import { useAssignments } from "@/lib/assignment-progress-store";
import { useMaterialsStore } from "@/lib/materials-store";
import {
  enrichModule,
  materialsForModule,
  noteMaterials,
  pastPaperMaterials,
} from "@/lib/module-stats";
import { useTopicProgress } from "@/lib/topic-progress-store";
import { cn } from "@/lib/utils";

const tabs = ["Overview", "Notes", "Assignments", "Past Papers", "Resources"] as const;

export default function ModuleDetailPage() {
  const params = useParams<{ id: string }>();
  const base = getModule(params.id);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const { published, ready: materialsReady } = useMaterialsStore();
  const { forModule, setCompleted } = useTopicProgress();
  const { items: allAssignments } = useAssignments();

  const topics = useMemo(
    () => (base ? forModule(base.id) : []),
    [base, forModule],
  );
  const module = useMemo(
    () => (base ? enrichModule(base, published, topics) : null),
    [base, published, topics],
  );

  const liveNotes = useMemo(
    () => (base ? noteMaterials(published, base.id) : []),
    [base, published],
  );
  const livePapers = useMemo(
    () => (base ? pastPaperMaterials(published, base.id) : []),
    [base, published],
  );
  const liveAll = useMemo(
    () => (base ? materialsForModule(published, base.id) : []),
    [base, published],
  );
  const moduleAssignments = useMemo(() => {
    if (!base) return [];
    const ids = new Set(getAssignmentsForModule(base.id).map((a) => a.id));
    return allAssignments.filter((a) => ids.has(a.id) || a.moduleId === base.id);
  }, [base, allAssignments]);

  if (!module || !base) notFound();

  return (
    <div>
      <PageHeader
        title={module.name}
        description={`${module.code} · ${module.lecturer} · Semester ${module.semester}`}
        actions={<Badge tone="primary">{module.progress}% complete</Badge>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Notes", liveNotes.length, "Notes"],
          ["Assignments", moduleAssignments.length, "Assignments"],
          ["Past Papers", livePapers.length, "Past Papers"],
          ["Topics", module.topicsTotal, "Overview"],
        ].map(([label, value, target]) => (
          <button
            key={String(label)}
            type="button"
            onClick={() => setTab(target as (typeof tabs)[number])}
            className="surface rounded-[18px] p-4 text-left transition hover:border-primary/30 hover:shadow-md hover:shadow-primary/10"
          >
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 font-heading text-xl font-semibold">{value}</p>
          </button>
        ))}
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition",
              tab === item
                ? "btn-gradient"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Overview" ? (
        <section id="topics" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-heading text-lg font-semibold">Topics</h3>
            {topics.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                Mark topics done to update module progress
              </p>
            ) : null}
          </div>
          {topics.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No topics yet"
              description="Admin or your Class Rep adds the course outline under Topics. Once published, they appear here and drive your progress %."
            />
          ) : (
            topics.map((topic) => (
              <div
                key={topic.id}
                className="surface flex items-center justify-between gap-3 rounded-[18px] p-4"
              >
                <Link
                  href={`/modules/${module.id}/topics/${topic.id}`}
                  className="group flex min-w-0 flex-1 items-center gap-3"
                >
                  {topic.completed ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium group-hover:text-primary">
                      Topic {String(topic.number).padStart(2, "0")} —{" "}
                      {topic.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {topic.durationMinutes} min
                    </p>
                  </div>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    variant={topic.completed ? "secondary" : "outline"}
                    type="button"
                    onClick={() => setCompleted(topic.id, !topic.completed)}
                  >
                    {topic.completed ? "Done" : "Mark done"}
                  </Button>
                  <ChevronRight className="hidden h-4 w-4 text-muted-foreground sm:block" />
                </div>
              </div>
            ))
          )}
        </section>
      ) : null}

      {tab === "Notes" ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-heading text-lg font-semibold">Notes & slides</h3>
            {!materialsReady ? (
              <p className="text-sm text-muted-foreground">Loading uploads…</p>
            ) : null}
          </div>
          {liveNotes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No notes yet"
              description="When your class rep or admin uploads notes for this module, they will appear here."
            />
          ) : (
            liveNotes.map((item) => (
              <MaterialUploadCard key={item.id} item={item} />
            ))
          )}
        </section>
      ) : null}

      {tab === "Assignments" ? (
        <div className="space-y-3">
          {moduleAssignments.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No assignments"
              description="Assignments for this module will show up here."
            />
          ) : (
            moduleAssignments.map((a) => (
              <AssignmentCard key={a.id} assignment={a} module={module} />
            ))
          )}
        </div>
      ) : null}

      {tab === "Past Papers" ? (
        <div className="space-y-3">
          {livePapers.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="No past papers yet"
              description="Published past papers for this module will appear here."
            />
          ) : (
            livePapers.map((item) => (
              <MaterialUploadCard key={item.id} item={item} />
            ))
          )}
        </div>
      ) : null}

      {tab === "Resources" ? (
        <div className="space-y-3">
          <h3 className="font-heading text-lg font-semibold">All materials</h3>
          {liveAll.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nothing uploaded yet"
              description="Staff uploads for this module will show here for the whole class."
            />
          ) : (
            liveAll.map((item) => (
              <MaterialUploadCard key={item.id} item={item} />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
