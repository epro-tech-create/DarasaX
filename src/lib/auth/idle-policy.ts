import type { AppRole } from "@/lib/app-role";

export function idleTimeoutMs(role: AppRole): number {
  return (role === "admin" ? 10 : 120) * 60 * 1000;
}

export function idleTimeoutMessage(role: AppRole): string {
  return role === "admin"
    ? "You were signed out after 10 minutes of inactivity."
    : "You were signed out after 2 hours of inactivity.";
}
