import type { MetadataRoute } from "next";
import { isPublicSite, SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return isPublicSite() ? [{ url: `${SITE_URL}/` }] : [];
}
