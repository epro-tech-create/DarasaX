"use client";

import {
  Archive,
  CalendarClock,
  ClipboardList,
  FileText,
} from "lucide-react";
import { useNotifications } from "@/lib/notifications-store";
import { formatRelativeTime } from "@/lib/utils";

const feedIcons = {
  FileText,
  CalendarClock,
  ClipboardList,
  Archive,
  notes: FileText,
  assignment: ClipboardList,
  exam: Archive,
  announcement: CalendarClock,
  timetable: CalendarClock,
} as const;

export function DashboardLiveUpdates() {
  const { items, ready } = useNotifications();
  const feed = items.slice(0, 6);

  return (
    <section>
      <h2 className="mb-3.5 font-heading text-[15px] font-semibold">
        Latest updates
      </h2>
      <div className="surface divide-y divide-border overflow-hidden rounded-[20px]">
        {!ready ? (
          <p className="px-4 py-6 text-[12px] text-muted-foreground">
            Loading updates…
          </p>
        ) : feed.length === 0 ? (
          <p className="px-4 py-6 text-[12px] text-muted-foreground">
            No updates yet. When lecturers or class reps publish materials, they
            appear here and in notifications.
          </p>
        ) : (
          feed.map((item) => {
            const Icon =
              feedIcons[item.type as keyof typeof feedIcons] || FileText;
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-muted/40 sm:px-5 sm:py-4"
              >
                <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium">{item.title}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {item.body}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatRelativeTime(item.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
