import type { Announcement } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, cn } from "@/lib/utils";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Megaphone,
  Pin,
} from "lucide-react";
import { getModule } from "@/data/mock";

const categoryMeta = {
  general: {
    tone: "default" as const,
    icon: Megaphone,
    accent: "#64748b",
  },
  class: {
    tone: "cyan" as const,
    icon: BookOpen,
    accent: "#4FC3F7",
  },
  exams: {
    tone: "warning" as const,
    icon: GraduationCap,
    accent: "#f59e0b",
  },
  assignments: {
    tone: "danger" as const,
    icon: ClipboardList,
    accent: "#ef4444",
  },
  timetable: {
    tone: "primary" as const,
    icon: CalendarDays,
    accent: "#1E88E5",
  },
};

export function AnnouncementCard({
  announcement,
  className,
}: {
  announcement: Announcement;
  className?: string;
}) {
  const meta = categoryMeta[announcement.category];
  const Icon = meta.icon;
  const module = announcement.moduleId
    ? getModule(announcement.moduleId)
    : undefined;

  return (
    <article
      className={cn(
        "surface group relative overflow-hidden rounded-[16px] transition duration-200",
        "hover:scale-[1.01] hover:border-primary hover:shadow-lg hover:shadow-primary/20",
        announcement.pinned && "border-primary/35",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: meta.accent }}
      />
      <div className="flex gap-3 p-3.5 pl-4 sm:p-4 sm:pl-5">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `${meta.accent}18`,
            color: meta.accent,
          }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {announcement.pinned ? (
              <Badge tone="primary" className="gap-1">
                <Pin className="h-2.5 w-2.5" />
                Pinned
              </Badge>
            ) : null}
            <Badge tone={meta.tone} className="capitalize">
              {announcement.category}
            </Badge>
            {module ? (
              <span className="text-[10px] font-medium text-muted-foreground">
                {module.code}
              </span>
            ) : null}
            <span className="ml-auto text-[10px] text-muted-foreground">
              {formatRelativeTime(announcement.postedAt)}
            </span>
          </div>
          <h3 className="font-heading text-[13px] font-semibold tracking-tight sm:text-[14px]">
            {announcement.title}
          </h3>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
            {announcement.body}
          </p>
        </div>
      </div>
    </article>
  );
}
