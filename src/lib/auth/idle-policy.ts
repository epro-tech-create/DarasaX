import type { AppRole } from "@/lib/app-role";

export function idleTimeoutMs(role: AppRole): number {
  return (role === "admin" ? 30 : role === "student" ? 360 : 120) * 60 * 1000;
}

export function idleTimeoutMessage(role: AppRole): string {
  return role === "admin"
    ? "You were signed out after 30 minutes of inactivity."
    : role === "student"
      ? "You were signed out after 6 hours of inactivity."
      : "You were signed out after 2 hours of inactivity.";
}
