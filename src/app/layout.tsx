import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionTimeout } from "@/components/auth/session-timeout";
import { BootSplash } from "@/components/brand/boot-splash";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark"){var d=document.documentElement;d.classList.remove("light","dark");d.classList.add(t);d.style.colorScheme=t;}}catch(e){}})();`;

export const metadata: Metadata = {
  title: {
    default: "DarasaX — Everything for Class in One Place",
    template: "%s · DarasaX",
  },
  description:
    "DarasaX helps university students organize modules, notes, assignments, past papers, timetables and study resources in one modern academic workspace.",
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
    title: "DarasaX — Everything for Class in One Place",
    description:
      "DarasaX helps university students organize modules, notes, assignments, past papers, timetables and study resources in one modern academic workspace.",
    type: "website",
    siteName: "DarasaX",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable} ${inter.className} h-full dark`}
    >
      <body className="min-h-full bg-background font-sans text-sm antialiased">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <ThemeProvider>
          <SessionTimeout />
          <BootSplash />
          {children}
        </ThemeProvider>
        <noscript>
          <style>{`#darasax-boot{display:none!important}`}</style>
        </noscript>
      </body>
    </html>
  );
}
