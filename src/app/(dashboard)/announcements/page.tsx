"use client";

import { useMemo, useState } from "react";
import { AnnouncementCard } from "@/components/announcements/announcement-card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { announcements } from "@/data/mock";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Megaphone,
  Pin,
} from "lucide-react";
import type { AnnouncementCategory } from "@/types";

const categories: Array<{
  id: "all" | AnnouncementCategory;
  label: string;
  icon: typeof Megaphone;
}> = [
  { id: "all", label: "All", icon: Megaphone },
  { id: "general", label: "General", icon: Megaphone },
  { id: "class", label: "Class", icon: BookOpen },
  { id: "exams", label: "Exams", icon: GraduationCap },
  { id: "assignments", label: "Tasks", icon: ClipboardList },
  { id: "timetable", label: "Timetable", icon: CalendarDays },
];

export default function AnnouncementsPage() {
  const [category, setCategory] = useState<(typeof categories)[number]["id"]>(
    "all",
  );

  const filtered = useMemo(() => {
    return announcements
      .filter((a) => category === "all" || a.category === category)
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      });
  }, [category]);

  const pinnedCount = announcements.filter((a) => a.pinned).length;

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Important updates from your classes and campus."
      />

      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <div className="surface rounded-[14px] p-3">
          <p className="text-[10px] text-muted-foreground">Total</p>
          <p className="mt-0.5 font-heading text-[15px] font-semibold">
            {announcements.length}
          </p>
        </div>
        <div className="surface rounded-[14px] p-3">
          <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Pin className="h-3 w-3 text-primary" />
            Pinned
          </p>
          <p className="mt-0.5 font-heading text-[15px] font-semibold text-primary">
            {pinnedCount}
          </p>
        </div>
        <div className="surface col-span-2 rounded-[14px] p-3 sm:col-span-1">
          <p className="text-[10px] text-muted-foreground">Showing</p>
          <p className="mt-0.5 font-heading text-[15px] font-semibold">
            {filtered.length}
          </p>
        </div>
      </div>

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {categories.map((item) => {
          const Icon = item.icon;
          const active = category === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition",
                active
                  ? "btn-gradient shadow-sm shadow-primary/20"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements"
          description="You’re all caught up. New posts will appear here."
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
            />
          ))}
        </div>
      )}
    </div>
  );
}
