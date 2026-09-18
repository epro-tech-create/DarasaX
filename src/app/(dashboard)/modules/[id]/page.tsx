"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { notFound, useParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  Circle,
  Download,
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ResourceCard } from "@/components/modules/resource-card";
import { AssignmentCard } from "@/components/assignments/assignment-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getAssignmentsForModule,
  getModule,
  getPastPapersForModule,
  getResourcesForModule,
  getTopicsForModule,
} from "@/data/mock";
import {
  downloadPastPaper,
  downloadResource,
  viewPastPaper,
} from "@/lib/download";
import { cn } from "@/lib/utils";

const tabs = ["Overview", "Notes", "Assignments", "Past Papers", "Resources"] as const;

export default function ModuleDetailPage() {
  const params = useParams<{ id: string }>();
  const module = getModule(params.id);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");

  const topics = useMemo(
    () => (module ? getTopicsForModule(module.id) : []),
    [module],
  );
  const resources = useMemo(
    () => (module ? getResourcesForModule(module.id) : []),
    [module],
  );
  const moduleAssignments = useMemo(
    () => (module ? getAssignmentsForModule(module.id) : []),
    [module],
  );
  const papers = useMemo(
    () => (module ? getPastPapersForModule(module.id) : []),
    [module],
  );

  if (!module) notFound();

  const notesOnly = resources.filter(
    (r) => r.type === "notes" || r.type === "pdf" || r.type === "slides",
  );

  return (
    <div>
      <PageHeader
        title={module.name}
        description={`${module.code} · ${module.lecturer} · Semester ${module.semester}`}
        actions={<Badge tone="primary">{module.progress}% complete</Badge>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Notes", module.notesCount, "Notes"],
          ["Assignments", module.assignmentsCount, "Assignments"],
          ["Past Papers", module.pastPapersCount, "Past Papers"],
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
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-heading text-lg font-semibold">Topics</h3>
            <p className="text-[11px] text-muted-foreground">
              Open a topic to read and download notes
            </p>
          </div>
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/modules/${module.id}/topics/${topic.id}`}
              className="surface group flex items-center justify-between gap-3 rounded-[18px] p-4 transition hover:border-primary/30 hover:shadow-md hover:shadow-primary/10"
            >
              <div className="flex min-w-0 items-center gap-3">
                {topic.completed ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  <p className="font-medium group-hover:text-primary">
                    Topic {String(topic.number).padStart(2, "0")} — {topic.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {topic.durationMinutes} min · {topic.resourceIds.length} note
                    {topic.resourceIds.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </section>
      ) : null}

      {tab === "Notes" ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-heading text-lg font-semibold">Notes & materials</h3>
            {notesOnly.length > 0 ? (
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => notesOnly.forEach((note) => downloadResource(note))}
              >
                <Download className="h-4 w-4" />
                Download all
              </Button>
            ) : null}
          </div>
          {notesOnly.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </section>
      ) : null}

      {tab === "Assignments" ? (
        <div className="space-y-3">
          {moduleAssignments.map((a) => (
            <AssignmentCard key={a.id} assignment={a} module={module} />
          ))}
        </div>
      ) : null}

      {tab === "Past Papers" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {papers.map((p) => (
            <div key={p.id} className="surface rounded-[18px] p-5">
              <Badge tone="primary">{p.type.toUpperCase()}</Badge>
              <h3 className="mt-3 font-heading font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {p.year} · {p.fileType.toUpperCase()} · {p.size}
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => viewPastPaper(p)}
                >
                  <Eye className="h-4 w-4" />
                  View
                </Button>
                <Button
                  size="sm"
                  type="button"
                  onClick={() => downloadPastPaper(p)}
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "Resources" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-heading text-lg font-semibold">All resources</h3>
            {resources.length > 0 ? (
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => resources.forEach((note) => downloadResource(note))}
              >
                <Download className="h-4 w-4" />
                Download all
              </Button>
            ) : null}
          </div>
          {resources.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
