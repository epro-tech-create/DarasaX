"use client";

import { useTranslate } from "@/components/providers/language-provider";
import Link from "next/link";
import { OverviewHeader, OverviewShortcut } from "@/components/dashboard/overview-ui";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FilePlus2,
  FileUp,
  GraduationCap,
  LibraryBig,
  ListOrdered,
  Megaphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import { StaffFadeItem, StaffStagger } from "@/components/staff/staff-motion";
import { classStreams, modules } from "@/data/mock";
import { getActiveLecturerStream } from "@/lib/lecturer-context";
import { useMaterialsStore } from "@/lib/materials-store";
import { useStaffSession } from "@/lib/staff-auth";
import { useTopicsStore } from "@/lib/topics-store";
import { formatRelativeTime, getGreeting } from "@/lib/utils";

export default function LecturerOverviewPage() {
  const translateUI = useTranslate();
  const { session } = useStaffSession();
  const displayName = session?.name?.trim().split(" ")[0] || "Lecturer";
  const active = getActiveLecturerStream();
  const activeLabel =
    classStreams.find((s) => s.id === active)?.label ?? active ?? null;
  const moduleCount = session?.moduleIds?.length ?? 0;
  const streamCount = session?.streamIds?.length ?? 0;
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
  const myModules = modules.filter((m) =>
    moduleSet.size === 0 ? true : moduleSet.has(m.id),
  );
  const recent = mine.slice(0, 5);

  const quickLinks = [
    {
      href: "/lecturer/materials",
      title: "Upload materials",
      body: "Notes, slides, past papers, assignments",
      icon: FilePlus2,
    },
    {
      href: "/lecturer/topics",
      title: "Module topics",
      body: "Build the outline students mark done",
      icon: ListOrdered,
    },
    {
      href: "/lecturer/assignments",
      title: "Assignments",
      body: "Publish coursework files to the class",
      icon: GraduationCap,
    },
    {
      href: "/lecturer/materials",
      title: "Library",
      body: "View, download, edit your files",
      icon: LibraryBig,
    },
    {
      href: "/lecturer/announcements",
      title: "Announcements",
      body: "Post notices students see instantly",
      icon: Megaphone,
    },
    {
      href: "/lecturer/timetable",
      title: "Timetable",
      body: "Review sessions for your class",
      icon: CalendarDays,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-7">
      <OverviewHeader label={translateUI("Lecturer workspace")} title={translateUI(`${getGreeting()}, ${displayName}`)}
        description={translateUI(`${activeLabel || "Your teaching workspace"} / ${moduleCount} modules / ${streamCount} classes. Bring your next lesson to life.`)}
        actions={<><Button href="/lecturer/materials" size="sm"><FileUp className="h-4 w-4" />Upload material</Button><Button href="/lecturer/topics" size="sm" variant="outline">Manage topics</Button></>}
      />

      <StaffStagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StaffFadeItem>
          <StaffStatCard
            label={translateUI("Your uploads")}
            value={String(mine.length)}
            hint={translateUI(activeLabel ? `To ${activeLabel}` : "Published files")}
            icon={FileUp}
            tone="primary"
          />
        </StaffFadeItem>
        <StaffFadeItem>
          <StaffStatCard
            label={translateUI("Notes & slides")}
            value={String(notes.length)}
            hint={translateUI(`${myTopics.length} topic${myTopics.length === 1 ? "" : "s"} outlined`)}
            icon={BookOpen}
            tone="success"
          />
        </StaffFadeItem>
        <StaffFadeItem>
          <StaffStatCard
            label={translateUI("Assignment files")}
            value={String(assignments.length)}
            hint={translateUI("Live on student Modules")}
            icon={ClipboardList}
            tone="warning"
          />
        </StaffFadeItem>
        <StaffFadeItem>
          <StaffStatCard
            label={translateUI("Modules taught")}
            value={String(myModules.length || moduleCount)}
            hint={
              translateUI(streamCount > 1
                ? `${streamCount} classes selected`
                : "Across your streams")
            }
            icon={GraduationCap}
            tone="primary"
          />
        </StaffFadeItem>
      </StaffStagger>

      <StaffStagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((card) => {
          const Icon = card.icon;
          return (
            <StaffFadeItem key={card.href}>
              <OverviewShortcut href={card.href} title={card.title} description={card.body} icon={Icon} />
            </StaffFadeItem>
          );
        })}
      </StaffStagger>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <StaffSection
          title={translateUI("Recent uploads")}
          description={translateUI("Latest files published to your classes and modules.")}
          action={
            <Link
              href="/lecturer/materials"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
            >
              Library <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="space-y-2">
            {recent.map((item) => {
              const courseModule = item.moduleId
                ? modules.find((m) => m.id === item.moduleId)
                : null;
              return (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-xl border border-border/70 px-3 py-2.5 transition hover:border-primary/30 hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold">
                      {item.title}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {translateUI(courseModule ? `${courseModule.code} · ` : "")}
                      {translateUI(formatRelativeTime(item.createdAt))} · {translateUI(item.size)}
                    </p>
                  </div>
                  <Badge tone="primary">{translateUI(item.kind.replace("_", " "))}</Badge>
                </div>
              );
            })}
            {mine.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <FileUp className="h-4 w-4" />
                </span>
                <p className="max-w-xs text-[12px] text-muted-foreground">
                  {translateUI("No uploads yet. Publish notes or an assignment to reach students instantly.")}</p>
                <Button href="/lecturer/materials" size="sm" className="mt-1">
                  {translateUI("Upload your first file")}</Button>
              </div>
            ) : null}
          </div>
        </StaffSection>

        <StaffSection
          title={translateUI("Teaching context")}
          description={translateUI("Your current class and teaching modules.")}
        >
          <div className="space-y-3">
            <div className="rounded-xl bg-muted/50 px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {translateUI("Active class")}</p>
              <p className="mt-1 text-[13px] font-semibold">
                {translateUI(activeLabel ?? "No class selected")}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {translateUI("Modules (")}{translateUI(myModules.length || moduleCount)})
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(myModules.length > 0
                  ? myModules
                  : modules.slice(0, 4)
                )
                  .slice(0, 6)
                  .map((m) => (
                    <Badge key={m.id} tone="primary">
                      {translateUI(m.code)}
                    </Badge>
                  ))}
              </div>
              <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                {translateUI(`${myTopics.length} topic${myTopics.length === 1 ? "" : "s"}`)} {translateUI(" you created · students see published items in Modules and notifications.")}</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button href="/lecturer/topics" size="sm" variant="outline">
                <ListOrdered className="h-3.5 w-3.5" />
                {translateUI("Manage topics")}</Button>
              <Button href="/lecturer/timetable" size="sm" variant="outline">
                <CalendarDays className="h-3.5 w-3.5" />
                {translateUI("View timetable")}</Button>
            </div>
          </div>
        </StaffSection>
      </div>
    </div>
  );
}
