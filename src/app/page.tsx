import type { Metadata } from "next";
import { headers } from "next/headers";
import LandingPage from "@/components/landing/landing-page";
import { isPublicSite, SITE_DESCRIPTION, SITE_TITLE, SITE_URL, websiteSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/` },
  robots: { index: isPublicSite(), follow: isPublicSite() },
};

export default async function HomePage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return <>
    {isPublicSite() && <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema).replace(/</g, "\\u003c") }} />}
    <LandingPage />
  </>;
}
