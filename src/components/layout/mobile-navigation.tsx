"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarRange,
  Home,
  Megaphone,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/modules", label: "Modules", icon: BookOpen },
  { href: "/planner", label: "Planner", icon: CalendarRange },
  { href: "/announcements", label: "Updates", icon: Megaphone },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <>
      <Link
        href="/ask"
        className="focus-ring btn-gradient fixed bottom-20 right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full shadow-lg shadow-primary/35 transition hover:brightness-110 lg:hidden"
        aria-label="Ask DarasaX"
      >
        <Sparkles className="h-5 w-5" />
      </Link>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <ul className="grid grid-cols-5">
          {items.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active && "stroke-[2.25px]")} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
