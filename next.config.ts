import type { NextConfig } from "next";

const appRole =
  process.env.APP_ROLE || process.env.NEXT_PUBLIC_APP_ROLE || "student";

const nextConfig: NextConfig = {
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
