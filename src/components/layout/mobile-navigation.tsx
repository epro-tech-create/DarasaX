"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  Home,
  Megaphone,
  Sparkles,
  User,
} from "lucide-react";
import { useNotifications } from "@/lib/notifications-store";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/modules", label: "Modules", icon: BookOpen },
  { href: "/timetable", label: "Timetable", icon: CalendarDays },
  { href: "/announcements", label: "Updates", icon: Megaphone },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileNavigation() {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  return (
    <>
      <Link
        href="/ask"
        className="focus-ring btn-gradient fixed bottom-20 right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full shadow-lg shadow-primary/35 transition hover:brightness-110 lg:hidden"
        aria-label="Ask DarasaX"
      >
        <Sparkles className="h-5 w-5" />
      </Link>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-2 pb-safe backdrop-blur-md lg:hidden">
        <ul className="grid grid-cols-5">
          {items.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active && "stroke-[2.25px]")} />
                  {item.label}
                  {item.href === "/announcements" && unreadCount > 0 ? (
                    <span className="absolute right-2 top-1 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-white" aria-label={`${unreadCount} unread updates`}>{unreadCount > 9 ? "9+" : unreadCount}</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
