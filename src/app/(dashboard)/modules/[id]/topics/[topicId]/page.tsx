"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Download,
  FileText,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ResourceCard } from "@/components/modules/resource-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getModule,
  getResourcesForTopic,
  getTopic,
  getTopicsForModule,
} from "@/data/mock";
import { downloadResource } from "@/lib/download";
import { cn } from "@/lib/utils";

export default function TopicDetailPage() {
  const params = useParams<{ id: string; topicId: string }>();
  const module = getModule(params.id);
  const topic = getTopic(params.topicId);

  if (!module || !topic || topic.moduleId !== module.id) notFound();

  const notes = getResourcesForTopic(topic.id);
  const siblings = getTopicsForModule(module.id);
  const index = siblings.findIndex((t) => t.id === topic.id);
  const prev = index > 0 ? siblings[index - 1] : null;
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/modules/${module.id}`}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {module.name}
        </Link>
        <PageHeader
          title={`Topic ${String(topic.number).padStart(2, "0")} — ${topic.title}`}
          description={`${module.code} · ${module.lecturer}`}
          actions={
            <Badge tone={topic.completed ? "success" : "primary"}>
              {topic.completed ? "Completed" : "In progress"}
            </Badge>
          }
        />
      </div>

      <section className="surface rounded-[20px] p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" />
            {topic.durationMinutes} min read
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            {notes.length} note{notes.length === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            {topic.completed ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            ) : (
              <Circle className="h-3.5 w-3.5" />
            )}
            {topic.completed ? "Marked complete" : "Not completed yet"}
          </span>
        </div>
        {topic.summary ? (
          <p className="mt-4 text-[14px] leading-relaxed text-foreground/90">
            {topic.summary}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button size="sm" href={`/ask?module=${module.id}&topic=${topic.id}`}>
            <Sparkles className="h-4 w-4" />
            Ask DarasaX about this topic
          </Button>
          {notes.length > 0 ? (
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => notes.forEach((note) => downloadResource(note))}
            >
              <Download className="h-4 w-4" />
              Download all notes
            </Button>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-[15px] font-semibold">Notes & materials</h2>
          <p className="text-[11px] text-muted-foreground">
            Download any item as a Markdown file
          </p>
        </div>
        {notes.length === 0 ? (
          <div className="surface rounded-[18px] px-5 py-10 text-center">
            <p className="text-[13px] font-medium">No notes uploaded yet</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Check back after the next lecture, or ask DarasaX for a study outline.
            </p>
          </div>
        ) : (
          notes.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} showPreview />
          ))
        )}
      </section>

      <nav className="grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/modules/${module.id}/topics/${prev.id}`}
            className="surface group flex items-center gap-3 rounded-[16px] p-4 transition hover:border-primary/30"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Previous
              </p>
              <p className="truncate text-[13px] font-medium">
                Topic {String(prev.number).padStart(2, "0")} — {prev.title}
              </p>
            </div>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/modules/${module.id}/topics/${next.id}`}
            className={cn(
              "surface group flex items-center justify-end gap-3 rounded-[16px] p-4 text-right transition hover:border-primary/30",
            )}
          >
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Next
              </p>
              <p className="truncate text-[13px] font-medium">
                Topic {String(next.number).padStart(2, "0")} — {next.title}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
          </Link>
        ) : null}
      </nav>
    </div>
  );
}
