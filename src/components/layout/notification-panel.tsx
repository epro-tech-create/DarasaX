"use client";

import { useTranslate } from "@/components/providers/language-provider";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { useNotifications } from "@/lib/notifications-store";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PushSettings } from "@/components/notifications/push-settings";

export function NotificationPanel({
  open,
  onClose,
  resolveHref,
  emptyDescription = "New updates published after you join will appear here.",
}: {
  open: boolean;
  onClose: () => void;
  resolveHref?: (href: string) => string;
  emptyDescription?: string;
}) {
  const translateUI = useTranslate();
  const { items, unreadCount, ready, error, refresh, markRead, markAllRead } = useNotifications();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        aria-label={translateUI("Close notifications")}
        onClick={onClose}
      />
      <div className="absolute right-3 top-16 flex max-h-[calc(100dvh-5rem)] w-[min(100vw-1.5rem,380px)] flex-col overflow-hidden rounded-[20px] border border-border bg-card shadow-2xl sm:right-6">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-sm font-semibold">{translateUI("Notifications")}</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4" />
            {translateUI("Mark all read")}</Button>
        </div>
        <div className="min-h-0 overflow-y-auto">
        <PushSettings />
        {error ? <div role="alert" className="space-y-2 px-4 py-4 text-sm">
          <p>{translateUI(error)}</p><Button variant="outline" size="sm" onClick={refresh}>{translateUI("Try again")}</Button>
        </div> : null}
        {!ready ? (
          <p className="px-4 py-8 text-center text-[12px] text-muted-foreground">
            {translateUI("Loading updates…")}</p>
        ) : items.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Bell}
              title={translateUI("No notifications yet")}
              description={translateUI(emptyDescription)}
              className="border-0 bg-transparent py-8"
            />
          </div>
        ) : (
          <ul>
            {items.map((n) => {
              const href = resolveHref
                ? resolveHref(n.href || "#")
                : n.href || "#";
              return (
                <li key={n.id} className="border-b border-border last:border-0">
                  <Link
                    href={href}
                    onClick={() => {
                      markRead(n.id);
                      onClose();
                    }}
                    className="flex gap-3 px-4 py-3 transition hover:bg-muted/70"
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        n.read ? "bg-transparent" : "bg-primary"
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{translateUI(n.title)}</span>
                      <span className="mt-0.5 block text-[13px] text-muted-foreground">
                        {n.body}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {translateUI(formatRelativeTime(n.createdAt))}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        </div>
      </div>
    </div>
  );
}
