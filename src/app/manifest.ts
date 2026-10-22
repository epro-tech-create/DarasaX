import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/", name: "DarasaX", short_name: "DarasaX",
    description: "Your classes, learning resources, and updates in one place.",
    start_url: "/dashboard", scope: "/", display: "standalone",
    background_color: "#ffffff", theme_color: "#1565c0",
    icons: [
      { src: "/push-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/push-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
