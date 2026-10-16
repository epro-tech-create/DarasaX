"use client";

import Link from "next/link";
import { useMemo } from "react";
import { notFound, useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MaterialUploadCard } from "@/components/modules/material-upload-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getModule } from "@/data/mock";
import { useMaterialsStore } from "@/lib/materials-store";
import { noteMaterials } from "@/lib/module-stats";
import { useTopicProgress } from "@/lib/topic-progress-store";
import { cn } from "@/lib/utils";

export default function TopicDetailPage() {
  const params = useParams<{ id: string; topicId: string }>();
  const courseModule = getModule(params.id);
  const { topics, setCompleted, ready, error, refresh } = useTopicProgress();
  const { published } = useMaterialsStore();

  const topic = useMemo(
    () => topics.find((t) => t.id === params.topicId),
    [topics, params.topicId],
  );

  const siblings = useMemo(
    () =>
      topics
        .filter((t) => t.moduleId === params.id)
        .sort((a, b) => a.number - b.number),
    [topics, params.id],
  );
  if (!courseModule) notFound();
  if (!ready)
    return (
      <div
        role="status"
        aria-live="polite"
        className="surface animate-pulse rounded-2xl p-6"
      >
        <p className="text-sm text-muted-foreground">Loading topic...</p>
        <div className="mt-5 h-5 w-2/3 rounded bg-muted" />
        <div className="mt-3 h-24 rounded bg-muted" />
      </div>
    );
  if (error)
    return (
      <div role="alert" className="surface space-y-4 rounded-2xl p-6">
        <p>{error}</p>
        <Button onClick={() => void refresh()}>Try again</Button>
        <Link
          href={`/modules/${courseModule.id}`}
          className="ml-3 text-sm text-primary"
        >
          Back to module
        </Link>
      </div>
    );
  if (!topic || topic.moduleId !== courseModule.id) notFound();
  const liveNotes = noteMaterials(published, courseModule.id);
  const index = siblings.findIndex((t) => t.id === topic.id);
  const prev = index > 0 ? siblings[index - 1] : null;
  const next =
    index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/modules/${courseModule.id}`}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {courseModule.name}
        </Link>
        <PageHeader
          title={`Topic ${String(topic.number).padStart(2, "0")} — ${topic.title}`}
          description={`${courseModule.code} · ${courseModule.lecturer}`}
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
            {liveNotes.length} note{liveNotes.length === 1 ? "" : "s"}
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
          <p className="mt-4 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground/90">
            {topic.summary}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            size="sm"
            type="button"
            variant={topic.completed ? "secondary" : "primary"}
            onClick={() => setCompleted(topic.id, !topic.completed)}
          >
            <CheckCircle2 className="h-4 w-4" />
            {topic.completed ? "Undo complete" : "Mark topic done"}
          </Button>
        </div>
      </section>

      {topic.learningObjectives && topic.learningObjectives.length > 0 && (
        <section className="surface rounded-[20px] p-5 sm:p-6">
          <h2 className="text-base font-semibold">What you will learn</h2>
          <ul className="mt-4 space-y-3">
            {topic.learningObjectives.map((objective, position) => (
              <li key={position} className="flex gap-3 text-sm leading-relaxed">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {objective}
              </li>
            ))}
          </ul>
        </section>
      )}
      {topic.content?.trim() &&
        topic.content.trim() !== topic.summary?.trim() && (
          <section className="surface rounded-[20px] p-5 sm:p-6">
            <div className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">
              {topic.content}
            </div>
          </section>
        )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-[15px] font-semibold">
            Notes & materials
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Staff uploads for this module
          </p>
        </div>
        {liveNotes.length === 0 ? (
          <div className="surface rounded-[18px] px-5 py-10 text-center">
            <p className="text-[13px] font-medium">No notes uploaded yet</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              When Admin or your class rep publishes notes for this module, they
              appear here.
            </p>
          </div>
        ) : (
          liveNotes.map((item) => (
            <MaterialUploadCard key={item.id} item={item} />
          ))
        )}
      </section>

      <nav className="grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/modules/${courseModule.id}/topics/${prev.id}`}
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
            href={`/modules/${courseModule.id}/topics/${next.id}`}
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
