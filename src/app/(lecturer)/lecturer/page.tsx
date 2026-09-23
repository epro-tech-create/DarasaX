"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  ClipboardList,
  FileUp,
  ListOrdered,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import { StaffFadeItem, StaffStagger } from "@/components/staff/staff-motion";
import { classStreams } from "@/data/mock";
import { getActiveLecturerStream } from "@/lib/lecturer-context";
import { useMaterialsStore } from "@/lib/materials-store";
import { useStaffSession } from "@/lib/staff-auth";
import { useTopicsStore } from "@/lib/topics-store";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function LecturerOverviewPage() {
  const { session } = useStaffSession();
  const displayName = session?.name ?? "Lecturer";
  const active = getActiveLecturerStream();
  const activeLabel =
    classStreams.find((s) => s.id === active)?.label ?? active ?? null;
  const moduleCount = session?.moduleIds?.length ?? 0;
  const { items: uploads } = useMaterialsStore();
  const { rows: topics } = useTopicsStore();
  const moduleSet = new Set(session?.moduleIds ?? []);
  const mine = uploads.filter(
    (u) =>
      u.role === "lecturer" ||
      (u.moduleId && moduleSet.has(u.moduleId)) ||
      (u.streamId && (session?.streamIds ?? []).includes(u.streamId)),
  );
  const myTopics = topics.filter(
    (t) =>
      t.role === "lecturer" ||
      moduleSet.size === 0 ||
      moduleSet.has(t.module_id),
  );
  const notes = mine.filter((u) => u.kind === "notes" || u.kind === "slides");
  const assignments = mine.filter((u) => u.kind === "assignment");

  return (
    <div className="space-y-5">
      <PageHeader
        size="lg"
        title={`${greeting()}, ${displayName}`}
        description={
          activeLabel
            ? `Lecturer · ${activeLabel} · ${moduleCount} module${moduleCount === 1 ? "" : "s"}`
            : "Lecturer · publish notes, assignments, and topics to students"
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button href="/lecturer/uploads" size="sm">
              <FileUp className="h-3.5 w-3.5" />
              Upload
            </Button>
            <Button href="/lecturer/topics" size="sm" variant="outline">
              <ListOrdered className="h-3.5 w-3.5" />
              Topics
            </Button>
          </div>
        }
      />

      <StaffStagger className="grid gap-2.5 sm:grid-cols-3">
        <StaffFadeItem>
          <StaffStatCard
            label="Your uploads"
            value={String(mine.length)}
            icon={FileUp}
            tone="success"
          />
        </StaffFadeItem>
        <StaffFadeItem>
          <StaffStatCard
            label="Notes & slides"
            value={String(notes.length)}
            icon={BookOpen}
          />
        </StaffFadeItem>
        <StaffFadeItem>
          <StaffStatCard
            label="Assignment files"
            value={String(assignments.length)}
            icon={ClipboardList}
            tone="warning"
          />
        </StaffFadeItem>
      </StaffStagger>

      <StaffStagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            href: "/lecturer/uploads",
            title: "Upload materials",
            body: "Notes, slides, past papers, assignments",
          },
          {
            href: "/lecturer/topics",
            title: "Module topics",
            body: "Build the outline students mark done",
          },
          {
            href: "/lecturer/assignments",
            title: "Assignments",
            body: "Publish coursework files to the class",
          },
          {
            href: "/lecturer/materials",
            title: "Library",
            body: "View, download, edit your files",
          },
        ].map((card) => (
          <StaffFadeItem key={card.href}>
            <Link
              href={card.href}
              className="surface block rounded-2xl p-4 transition hover:border-primary/30"
            >
              <p className="font-heading text-[13px] font-semibold">
                {card.title}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">{card.body}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                Open <ArrowUpRight className="h-3 w-3" />
              </span>
            </Link>
          </StaffFadeItem>
        ))}
      </StaffStagger>

      <StaffSection
        title="Recent uploads"
        action={
          <Link
            href="/lecturer/materials"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary"
          >
            Library <ArrowUpRight className="h-3 w-3" />
          </Link>
        }
      >
        <div className="space-y-2">
          {mine.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2.5"
            >
              <p className="truncate text-[12px] font-semibold">{item.title}</p>
              <Badge tone="primary">{item.kind.replace("_", " ")}</Badge>
            </div>
          ))}
          {mine.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-muted-foreground">
              No uploads yet. Publish notes or an assignment to reach students.
            </p>
          ) : null}
        </div>
      </StaffSection>

      <p className="text-[11px] text-muted-foreground">
        {myTopics.length} topic
        {myTopics.length === 1 ? "" : "s"} you created · students see published
        items in Modules and notifications.
      </p>
    </div>
  );
}
