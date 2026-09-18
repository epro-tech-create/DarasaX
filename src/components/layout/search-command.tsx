"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, BookOpen, ClipboardList, Archive, Megaphone } from "lucide-react";
import {
  announcements,
  assignments,
  modules,
  pastPapers,
  resources,
} from "@/data/mock";
import { cn } from "@/lib/utils";

type Result = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: typeof Search;
};

export function SearchCommand({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) onClose();
        else document.dispatchEvent(new CustomEvent("darasax:open-search"));
      }
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as Result[];

    const items: Result[] = [
      ...modules.map((m) => ({
        id: m.id,
        title: m.name,
        subtitle: `${m.code} · Module`,
        href: `/modules/${m.id}`,
        icon: BookOpen,
      })),
      ...resources.map((r) => ({
        id: r.id,
        title: r.title,
        subtitle: `Note · ${r.type.toUpperCase()}`,
        href: `/modules/${r.moduleId}`,
        icon: FileText,
      })),
      ...assignments.map((a) => ({
        id: a.id,
        title: a.title,
        subtitle: "Assignment",
        href: `/assignments/${a.id}`,
        icon: ClipboardList,
      })),
      ...pastPapers.map((p) => ({
        id: p.id,
        title: p.title,
        subtitle: `Past paper · ${p.year}`,
        href: "/past-papers",
        icon: Archive,
      })),
      ...announcements.map((a) => ({
        id: a.id,
        title: a.title,
        subtitle: "Announcement",
        href: "/announcements",
        icon: Megaphone,
      })),
    ];

    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[12vh] backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close search"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl overflow-hidden rounded-[20px] border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules, notes, assignments..."
            className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px]">
            ESC
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {query && results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No results for “{query}”
            </p>
          ) : null}
          {!query ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Type to search across your academic workspace
            </p>
          ) : null}
          {results.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-muted",
                )}
                onClick={() => {
                  onClose();
                  router.push(item.href);
                }}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.subtitle}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
