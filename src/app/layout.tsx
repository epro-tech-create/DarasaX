import type { Metadata } from "next";
import { Figtree, Outfit } from "next/font/google";
import Script from "next/script";
import { headers } from "next/headers";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { SessionTimeout } from "@/components/auth/session-timeout";
import { SiteVisitorTracker } from "@/components/analytics/site-visitor-tracker";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/seo";

const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-figtree",
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark"){var d=document.documentElement;d.classList.remove("light","dark");d.classList.add(t);d.style.colorScheme=t;}}catch(e){}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "DarasaX",
  robots: { index: false, follow: false },
  title: {
    default: SITE_TITLE,
    template: "%s · DarasaX",
  },
  description:
    SITE_DESCRIPTION,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icon-x.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    title: SITE_TITLE,
    description:
      SITE_DESCRIPTION,
    type: "website",
    siteName: "DarasaX",
    url: `${SITE_URL}/`,
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION, images: [`${SITE_URL}/opengraph-image`] },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${figtree.variable} ${outfit.variable} ${figtree.className} h-full dark`}
    >
      <body className="min-h-full bg-background font-sans text-sm antialiased">
        <Script
          id="theme-init"
          nonce={nonce}
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <LanguageProvider>
          <ThemeProvider>
          <SessionTimeout />
          <SiteVisitorTracker />
          {children}
          </ThemeProvider>
        </LanguageProvider>
        <noscript>
          <style>{`#darasax-boot{display:none!important}`}</style>
        </noscript>
      </body>
    </html>
  );
}
