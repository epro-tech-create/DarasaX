import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-figtree",
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
    icon: [{ url: "/brand/icon-x.png", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png" }],
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
      className={`${figtree.variable} ${figtree.className} h-full dark`}
    >
      <body className="min-h-full bg-background font-sans text-[14px] antialiased sm:text-[15px]">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
