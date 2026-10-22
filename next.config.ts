import type { NextConfig } from "next";
import { browserSecurityHeaders, contentSecurityPolicy } from "./src/lib/security-headers";

const appRole =
  process.env.APP_ROLE || process.env.NEXT_PUBLIC_APP_ROLE || "student";
const privatePages = ["login", "signup", "register", "verify-email", "forgot-password", "reset-password", "onboarding", "welcome", "pending-approval", "admin-verify-email", "lecturer-approval", "dashboard", "modules", "assignments", "timetable", "past-papers", "announcements", "profile", "settings", "planner", "ask", "missed", "admin", "cr", "lecturer", "share", "join", "api", "auth"];

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  async headers() {
    const images = ["/auth-panel-v1.webp", "/next-class-students-v1.webp"].map(source => ({
      source, headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    }));
    const noindex = (appRole === "student" ? privatePages.map(path => `/${path}/:path*`) : ["/:path*"])
      .map(source => ({ source, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }));
    return [{ source: "/:path*", headers: [...browserSecurityHeaders, { key: "Content-Security-Policy", value: contentSecurityPolicy(undefined, process.env.NODE_ENV === "development") }] }, ...images, ...noindex, { source: "/sw.js", headers: [
      { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
      { key: "Service-Worker-Allowed", value: "/" },
      { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
    ] }];
  },
  env: {
    NEXT_PUBLIC_APP_ROLE: appRole,
  },
  // Separate caches locally so student / admin / class_rep can run together.
  // On Vercel use the default `.next` output directory.
  ...(process.env.VERCEL
    ? {}
    : { distDir: `.next-${appRole}` }),
  images: {
    qualities: [75, 90],
  },
};

export default nextConfig;
