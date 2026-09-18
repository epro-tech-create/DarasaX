"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Home,
  Archive,
  Megaphone,
  CalendarRange,
  Sparkles,
  User,
  Settings,
  PanelLeftClose,
  PanelLeft,
  History,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { currentUser } from "@/data/mock";
import { cn } from "@/lib/utils";
import { useState } from "react";

const mainNav = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/modules", label: "Modules", icon: BookOpen },
  { href: "/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/timetable", label: "Timetable", icon: CalendarDays },
  { href: "/past-papers", label: "Past Papers", icon: Archive },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/planner", label: "Study Planner", icon: CalendarRange },
  { href: "/missed", label: "What Did I Miss?", icon: History },
  { href: "/ask", label: "Ask DarasaX", icon: Sparkles },
];

const bottomNav = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300 lg:flex",
        collapsed ? "w-[76px]" : "w-[232px]",
      )}
    >
      <div
        className={cn(
          "flex border-b border-border",
          collapsed
            ? "h-auto flex-col items-center gap-2 px-2 py-3"
            : "h-14 items-center justify-between gap-1 px-3",
        )}
      >
        <Logo
          href="/dashboard"
          size="sm"
          markOnly={collapsed}
          className={cn(!collapsed && "min-w-0 pl-0.5")}
        />
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="focus-ring inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-1.5 scrollbar-thin">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "focus-ring group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12px] font-medium transition-colors",
                active
                  ? "btn-gradient shadow-sm shadow-primary/25"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-0",
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-2.5 py-2.5">
        <div className="mb-1.5 space-y-0.5">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "focus-ring flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12px] font-medium transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center px-0",
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </div>

        {!collapsed ? (
          <div className="mt-1.5 flex items-center gap-2.5 rounded-xl bg-muted/60 px-2.5 py-2">
            <UserAvatar name={currentUser.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold">
                {currentUser.name}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                Year {currentUser.year} · Sem {currentUser.semester}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center pt-1.5">
            <UserAvatar name={currentUser.name} size="sm" />
          </div>
        )}
      </div>
    </aside>
  );
}

export function TopBar({
  onOpenNotifications,
  onOpenSearch,
}: {
  onOpenNotifications: () => void;
  onOpenSearch: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-5">
      <div className="lg:hidden">
        <Logo href="/dashboard" size="sm" />
      </div>
      <button
        type="button"
        onClick={onOpenSearch}
        className="focus-ring hidden min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-left text-[12px] text-muted-foreground transition hover:border-primary/30 md:flex md:max-w-md"
      >
        <span className="truncate">Search modules, notes, assignments...</span>
        <kbd className="ml-auto rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
          Ctrl K
        </kbd>
      </button>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <button
          type="button"
          onClick={onOpenSearch}
          className="focus-ring inline-flex h-8 items-center justify-center rounded-xl border border-border bg-card px-2.5 text-[11px] font-medium text-muted-foreground hover:text-foreground md:hidden"
          aria-label="Search"
        >
          Search
        </button>
        <button
          type="button"
          onClick={onOpenNotifications}
          className="focus-ring relative inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger" />
        </button>
      </div>
    </header>
  );
}
