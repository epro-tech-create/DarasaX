import type { NextConfig } from "next";

const appRole =
  process.env.APP_ROLE || process.env.NEXT_PUBLIC_APP_ROLE || "student";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  async headers() {
    return ["/auth-panel-v1.webp", "/next-class-students-v1.webp"].map(source => ({
      source, headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    }));
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
