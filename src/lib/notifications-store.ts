"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getModule } from "@/data/mock";
import { useAssignments } from "@/lib/assignment-progress-store";
import { useMaterialsStore } from "@/lib/materials-store";
import { useTopicsStore } from "@/lib/topics-store";
import { daysUntil } from "@/lib/utils";
import type { MaterialUpload, NotificationItem, NotificationType } from "@/types";

const READ_KEY = "darasax_notification_reads_v1";

function readIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeIds(ids: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

function kindType(kind: MaterialUpload["kind"]): NotificationType {
  if (kind === "notes" || kind === "slides") return "notes";
  if (kind === "past_paper") return "exam";
  if (kind === "assignment") return "assignment";
  if (kind === "announcement") return "announcement";
  return "announcement";
}

function materialHref(m: MaterialUpload) {
  if (m.kind === "past_paper") return "/past-papers";
  if (m.kind === "announcement") return "/announcements";
  if (m.kind === "assignment") return "/assignments";
  if (m.moduleId) return `/modules/${m.moduleId}`;
  return "/modules";
}

function materialTitle(m: MaterialUpload) {
  if (m.kind === "notes") return "New notes uploaded";
  if (m.kind === "slides") return "New slides uploaded";
  if (m.kind === "past_paper") return "New past paper";
  if (m.kind === "assignment") return "New assignment file";
  if (m.kind === "announcement") return "New announcement";
  return "New material";
}

function materialBody(m: MaterialUpload) {
  const module = m.moduleId ? getModule(m.moduleId) : null;
  const where = module ? ` for ${module.name}` : "";
  return `${m.title}${where} · by ${m.uploadedBy}`;
}

export function useNotifications() {
  const { published, ready: materialsReady } = useMaterialsStore();
  const { rows: topicRows, ready: topicsReady } = useTopicsStore();
  const { items: assignments } = useAssignments();
  const [readTick, setReadTick] = useState(0);

  useEffect(() => {
    const bump = () => setReadTick((n) => n + 1);
    window.addEventListener("darasax:notifications", bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener("darasax:notifications", bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  const reads = useMemo(() => {
    void readTick;
    return readIds();
  }, [readTick]);

  const items = useMemo(() => {
    const fromMaterials: NotificationItem[] = published.map((m) => ({
      id: `mat-${m.id}`,
      title: materialTitle(m),
      body: materialBody(m),
      type: kindType(m.kind),
      createdAt: m.createdAt,
      read: reads.has(`mat-${m.id}`),
      href: materialHref(m),
    }));

    const cutoff = Date.now() - 45 * 24 * 60 * 60 * 1000;
    const fromTopics: NotificationItem[] = topicRows
      .filter((t) => t.published)
      .filter((t) => new Date(t.created_at).getTime() >= cutoff)
      .map((t) => {
        const module = getModule(t.module_id);
        const id = `topic-${t.id}`;
        return {
          id,
          title: "Topic added to outline",
          body: `${module?.name ?? "Module"} · Topic ${String(t.number).padStart(2, "0")}: ${t.title}`,
          type: "announcement" as const,
          createdAt: t.created_at,
          read: reads.has(id),
          href: `/modules/${t.module_id}`,
        };
      });

    const fromAssignments: NotificationItem[] = assignments
      .filter((a) => a.status === "upcoming")
      .filter((a) => {
        const d = daysUntil(a.deadline);
        return d >= 0 && d <= 5;
      })
      .map((a) => {
        const module = getModule(a.moduleId);
        const id = `asg-due-${a.id}`;
        const d = daysUntil(a.deadline);
        return {
          id,
          title:
            d === 0
              ? "Assignment due today"
              : `Assignment due in ${d} day${d === 1 ? "" : "s"}`,
          body: `${a.title}${module ? ` · ${module.name}` : ""}`,
          type: "assignment" as const,
          createdAt: a.deadline,
          read: reads.has(id),
          href: `/assignments/${a.id}`,
        };
      });

    return [...fromMaterials, ...fromTopics, ...fromAssignments].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [published, topicRows, assignments, reads]);

  const unreadCount = items.filter((n) => !n.read).length;
  const ready = materialsReady && topicsReady;

  const markRead = useCallback((id: string) => {
    const next = readIds();
    next.add(id);
    writeIds(next);
    setReadTick((n) => n + 1);
    window.dispatchEvent(new Event("darasax:notifications"));
  }, []);

  const markAllRead = useCallback(() => {
    const next = readIds();
    for (const n of items) next.add(n.id);
    writeIds(next);
    setReadTick((n) => n + 1);
    window.dispatchEvent(new Event("darasax:notifications"));
  }, [items]);

  return { items, unreadCount, ready, markRead, markAllRead };
}
