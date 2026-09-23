"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileUp,
  Flag,
  GraduationCap,
  Home,
  LogOut,
  Megaphone,
  PanelLeft,
  PanelLeftClose,
  ScrollText,
  Shield,
  Users,
  ListOrdered,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { NotificationPanel } from "@/components/layout/notification-panel";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { StaffPageMotion } from "@/components/staff/staff-page-motion";
import { APP_PORTS } from "@/lib/app-role";
import { clearActiveLecturerStream } from "@/lib/lecturer-context";
import { useNotifications } from "@/lib/notifications-store";
import { logoutStaff } from "@/lib/staff-auth";
import { cn } from "@/lib/utils";
import type { ClassStreamId, StaffRole } from "@/types";

export type StaffNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const adminNav: StaffNavItem[] = [
  { href: "/admin", label: "Overview", icon: Home },
  { href: "/admin/uploads", label: "Upload", icon: FileUp },
  { href: "/admin/topics", label: "Topics", icon: ListOrdered },
  { href: "/admin/materials", label: "Library", icon: BookOpen },
  { href: "/admin/past-papers", label: "Past papers", icon: ClipboardList },
  { href: "/admin/timetable", label: "Timetable", icon: CalendarDays },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/class-reps", label: "Class reps", icon: GraduationCap },
  { href: "/admin/streams", label: "Streams", icon: Shield },
  { href: "/admin/announcements", label: "Announce", icon: Megaphone },
  { href: "/admin/issues", label: "Issues", icon: Flag },
  { href: "/admin/audit", label: "Audit logs", icon: ScrollText },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

const crNav: StaffNavItem[] = [
  { href: "/cr", label: "Overview", icon: Home },
  { href: "/cr/uploads", label: "Upload", icon: FileUp },
  { href: "/cr/topics", label: "Topics", icon: ListOrdered },
  { href: "/cr/materials", label: "Library", icon: BookOpen },
  { href: "/cr/past-papers", label: "Past papers", icon: ClipboardList },
  { href: "/cr/timetable", label: "Timetable", icon: CalendarDays },
  { href: "/cr/members", label: "Members", icon: Users },
  { href: "/cr/issues", label: "Issues", icon: Flag },
  { href: "/cr/attendance", label: "Attendance", icon: Activity },
];

const lecturerNav: StaffNavItem[] = [
  { href: "/lecturer", label: "Overview", icon: Home },
  { href: "/lecturer/uploads", label: "Upload", icon: FileUp },
  { href: "/lecturer/topics", label: "Topics", icon: ListOrdered },
  { href: "/lecturer/materials", label: "Library", icon: BookOpen },
  { href: "/lecturer/past-papers", label: "Past papers", icon: ClipboardList },
  { href: "/lecturer/assignments", label: "Assignments", icon: GraduationCap },
  { href: "/lecturer/announcements", label: "Announce", icon: Megaphone },
  { href: "/lecturer/timetable", label: "Timetable", icon: CalendarDays },
];

function roleLabel(role: StaffRole) {
  if (role === "admin") return "Administration";
  if (role === "lecturer") return "Lecturer";
  return "Class Representative";
}

function RoleIcon({ role }: { role: StaffRole }) {
  if (role === "admin") return <Shield className="h-3.5 w-3.5" />;
  if (role === "lecturer") return <BookOpen className="h-3.5 w-3.5" />;
  return <GraduationCap className="h-3.5 w-3.5" />;
}

function staffNotificationHref(href: string, role: StaffRole): string {
  const base =
    role === "admin" ? "/admin" : role === "class_rep" ? "/cr" : "/lecturer";
  if (href.startsWith("/past-papers")) return `${base}/past-papers`;
  if (href.startsWith("/announcements")) {
    return role === "class_rep" ? `${base}/materials` : `${base}/announcements`;
  }
  if (href.startsWith("/assignments")) {
    return role === "lecturer" ? "/lecturer/assignments" : `${base}/materials`;
  }
  if (href.startsWith("/modules")) {
    if (href.includes("/topics") || role === "lecturer") {
      return `${base}/topics`;
    }
    return `${base}/materials`;
  }
  return `${base}/materials`;
}

export function StaffShell({
  role,
  userName,
  userMeta,
  streamIds,
  children,
}: {
  role: StaffRole;
  userName: string;
  userMeta: string;
  streamIds?: ClassStreamId[];
  moduleIds?: string[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const nav =
    role === "admin"
      ? adminNav
      : role === "class_rep"
        ? crNav
        : lecturerNav;
  const home =
    role === "admin" ? "/admin" : role === "class_rep" ? "/cr" : "/lecturer";
  const port =
    role === "admin"
      ? APP_PORTS.admin
      : role === "class_rep"
        ? APP_PORTS.class_rep
        : APP_PORTS.lecturer;

  const isActive = (href: string) =>
    href === home ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const canSwitchClass =
    role === "lecturer" && (streamIds?.length ?? 0) > 1;

  async function onSignOut() {
    await logoutStaff();
    router.replace("/login");
    router.refresh();
  }

  function onSwitchClass() {
    clearActiveLecturerStream();
    router.replace("/lecturer/select-class");
  }

  return (
    <div className="flex min-h-screen bg-background font-sans text-[13px]">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300 lg:flex",
          collapsed ? "w-[76px]" : "w-[248px]",
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
            href={home}
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

        <div className={cn("px-3 pt-3", collapsed && "px-2")}>
          <div
            className={cn(
              "rounded-2xl border border-border/80 bg-muted/40",
              collapsed ? "p-2" : "px-3 py-2.5",
            )}
          >
            <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <RoleIcon role={role} />
              </span>
              {!collapsed ? (
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold">{userName}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{userMeta}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3 scrollbar-thin">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "focus-ring flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12px] font-medium transition",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-border p-2.5">
          {!collapsed ? (
            <p className="px-2.5 pb-1 text-[10px] text-muted-foreground">
              Port {port} · isolated app
            </p>
          ) : null}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-5">
          <div className="min-w-0 lg:hidden">
            <Logo href={home} size="sm" />
          </div>
          <div className="hidden min-w-0 lg:block">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {roleLabel(role)}
            </p>
            <p className="truncate text-[13px] font-semibold">{userMeta}</p>
          </div>
          <div className="flex items-center gap-2">
            {canSwitchClass ? (
              <button
                type="button"
                onClick={onSwitchClass}
                className="focus-ring hidden h-9 items-center rounded-xl border border-border px-2.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex"
              >
                Switch class
              </button>
            ) : null}
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="focus-ring relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => void onSignOut()}
              className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-2.5 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-5 sm:px-5 lg:pb-8 lg:pt-6">
          <div className="mx-auto w-full max-w-7xl">
            <StaffPageMotion>{children}</StaffPageMotion>
          </div>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-2 py-2 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-lg items-center justify-around gap-1">
            {nav.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[9px] font-medium",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="truncate">{item.label.split(" ")[0]}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <NotificationPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        resolveHref={(href) => staffNotificationHref(href, role)}
        emptyDescription="When materials, topics, or assignments are published, they show up here."
      />
    </div>
  );
}
