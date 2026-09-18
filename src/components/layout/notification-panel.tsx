"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { notifications as initial } from "@/data/mock";
import { formatRelativeTime } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function NotificationPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [items, setItems] = useState(initial);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        aria-label="Close notifications"
        onClick={onClose}
      />
      <div className="absolute right-3 top-16 w-[min(100vw-1.5rem,380px)] overflow-hidden rounded-[20px] border border-border bg-card shadow-2xl sm:right-6">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-sm font-semibold">Notifications</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setItems((prev) => prev.map((n) => ({ ...n, read: true })))
            }
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        </div>
        <ul className="max-h-[70vh] overflow-y-auto">
          {items.map((n) => (
            <li key={n.id} className="border-b border-border last:border-0">
              <Link
                href={n.href || "#"}
                onClick={onClose}
                className="flex gap-3 px-4 py-3 transition hover:bg-muted/70"
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    n.read ? "bg-transparent" : "bg-primary"
                  }`}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{n.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {n.body}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
