"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getAppRole } from "@/lib/app-role";

export function SiteVisitorTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (getAppRole() !== "student") return;
    void fetch("/api/site-visits", { method: "POST", keepalive: true }).catch(() => {});
  }, [pathname]);
  return null;
}
