import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/", name: "DarasaX", short_name: "DarasaX",
    description: SITE_DESCRIPTION,
    start_url: "/dashboard", scope: "/", display: "standalone",
    background_color: "#ffffff", theme_color: "#1565c0",
    icons: [
      { src: "/app-icon-v2-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icon-v2-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icon-v2-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
