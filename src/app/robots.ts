import type { MetadataRoute } from "next";
import { isPublicSite, SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  if (!isPublicSite()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/", "/share/", "/join"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
