"use client";

import { useEffect, useState } from "react";
import { AppSidebar, TopBar } from "@/components/layout/app-sidebar";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { NotificationPanel } from "@/components/layout/notification-panel";
import { SearchCommand } from "@/components/layout/search-command";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const openSearch = () => setSearchOpen(true);
    document.addEventListener("darasax:open-search", openSearch);
    return () => document.removeEventListener("darasax:open-search", openSearch);
  }, []);

  return (
    <div className="flex min-h-screen bg-background font-sans text-[13px]">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onOpenSearch={() => setSearchOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
        />
        <main className="flex-1 px-4 pb-28 pt-5 sm:px-5 lg:pb-7 lg:pt-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
      <MobileNavigation />
      <SearchCommand open={searchOpen} onClose={() => setSearchOpen(false)} />
      <NotificationPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  );
}
