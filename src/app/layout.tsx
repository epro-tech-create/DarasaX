import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "DarasaX — Everything for Class in One Place",
    template: "%s · DarasaX",
  },
  description:
    "DarasaX helps university students organize modules, notes, assignments, past papers, timetables and study resources in one modern academic workspace.",
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
      className={`${inter.variable} ${inter.className} h-full dark`}
    >
      <body className="min-h-full bg-background font-sans text-[14px] antialiased sm:text-[15px]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
