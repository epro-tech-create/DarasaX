import type { NextConfig } from "next";

const appRole =
  process.env.APP_ROLE || process.env.NEXT_PUBLIC_APP_ROLE || "student";

const nextConfig: NextConfig = {
  // Separate caches so student / admin / class_rep can run together.
  distDir: `.next-${appRole}`,
  images: {
    qualities: [75, 90],
  },
};

export default nextConfig;
