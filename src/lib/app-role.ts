import type { StaffRole } from "@/types";

export type AppRole = "student" | "admin" | "class_rep" | "lecturer";

export const APP_PORTS: Record<AppRole, number> = {
  student: 3005,
  admin: 3006,
  class_rep: 3007,
  lecturer: 3008,
};

export const APP_HOME: Record<AppRole, string> = {
  student: "/dashboard",
  admin: "/admin",
  class_rep: "/cr",
  lecturer: "/lecturer",
};

export const APP_LABEL: Record<AppRole, string> = {
  student: "Student",
  admin: "Admin",
  class_rep: "Class Rep",
  lecturer: "Lecturer",
};

export function getAppRole(): AppRole {
  const raw = (
    process.env.APP_ROLE ||
    process.env.NEXT_PUBLIC_APP_ROLE ||
    "student"
  ).toLowerCase();
  if (
    raw === "admin" ||
    raw === "class_rep" ||
    raw === "student" ||
    raw === "lecturer"
  ) {
    return raw;
  }
  return "student";
}

export function isStaffRole(role: AppRole): role is StaffRole {
  return role === "admin" || role === "class_rep" || role === "lecturer";
}

export function pathAllowedForRole(pathname: string, role: AppRole): boolean {
  const isSharedAuth =
    pathname === "/login" ||
    pathname === "/verify-email" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/forgot-password/") ||
    pathname === "/reset-password" ||
    pathname.startsWith("/auth/");

  if (role === "student") {
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/cr") ||
      pathname.startsWith("/lecturer")
    ) {
      return false;
    }
    if (pathname === "/register") return false;
    if (isSharedAuth || pathname === "/signup" || pathname === "/") return true;
    return true;
  }

  if (role === "admin") {
    if (pathname === "/login" || isSharedAuth) return true;
    if (pathname.startsWith("/admin")) return true;
    return false;
  }

  if (role === "class_rep") {
    if (pathname === "/login" || pathname === "/register" || isSharedAuth) {
      return true;
    }
    if (pathname.startsWith("/cr")) return true;
    return false;
  }

  // lecturer
  if (pathname === "/login" || pathname === "/register" || isSharedAuth) {
    return true;
  }
  if (pathname.startsWith("/lecturer")) return true;
  return false;
}

export function forbiddenRedirect(role: AppRole): string {
  if (role === "admin" || role === "class_rep" || role === "lecturer") {
    return "/login";
  }
  return APP_HOME[role];
}

export function staffHomeRedirect(role: AppRole): string {
  return APP_HOME[role];
}
