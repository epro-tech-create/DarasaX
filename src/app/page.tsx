"use client";

import { useTranslate } from "@/components/providers/language-provider";
import Image from "next/image";
import { motion, MotionConfig } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Archive,
  Sparkles,
  Check,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  HeroBackground,
  CampusStories,
} from "@/components/landing/campus-gallery";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const tools = [
  {
    title: "Modules & notes",
    text: "Find your topics, lecture notes and learning materials together.",
    icon: BookOpen,
  },
  {
    title: "Assignments",
    text: "See what needs doing and keep the next deadline in sight.",
    icon: ClipboardList,
  },
  {
    title: "Your timetable",
    text: "Know your next class, where it is and who is teaching.",
    icon: CalendarDays,
  },
  {
    title: "Past papers",
    text: "Keep revision resources close when it is time to prepare.",
    icon: Archive,
  },
];
const steps = [
  {
    title: "Create your account",
    text: "Sign up and verify your email to get started.",
  },
  {
    title: "Find your class",
    text: "Complete your profile and select your DIT BENG24COE stream.",
  },
  {
    title: "Make yourself at home",
    text: "Open your notes, check your timetable and see what is coming up.",
  },
];
const reveal = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.28 },
};

export default function LandingPage() {
  const translateUI = useTranslate();
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.25 }}>
      <div className="min-h-screen bg-background">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-card focus:p-3"
        >
          {translateUI("Skip to content")}</a>
        <header className="absolute inset-x-0 top-0 z-30 border-b border-white/10">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
            <Logo size="md" variant="dark" />
            <nav
              aria-label={translateUI("Main navigation")}
              className="hidden items-center gap-7 text-sm text-white/75 md:flex"
            >
              <a
                href="#features"
                className="focus-ring rounded transition hover:text-white"
              >
                {translateUI("The workspace")}</a>
              <a
                href="#how"
                className="focus-ring rounded transition hover:text-white"
              >
                {translateUI("How it works")}</a>
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle lightOnDark />
              <Button
                variant="ghost"
                href="/login"
                className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex"
              >
                {translateUI("Log in")}</Button>
              <Button href="/signup" className="px-4 text-xs sm:text-sm">
                {translateUI("Get started ")}<ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </div>
          </div>
        </header>

        <main id="main-content">
          <section className="relative isolate bg-[#0B1B2B] text-white">
            <div className="relative isolate flex min-h-[90svh] items-end overflow-hidden sm:min-h-[100svh]">
              <HeroBackground />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/55 to-black/25" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/50 via-transparent to-[#1565C0]/20" />
              <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-36 sm:px-8 sm:pb-24">
                <motion.div {...reveal} className="max-w-xl">
                  <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-[#4FC3F7]">
                    {translateUI("Darasa")}<span className="text-white">{translateUI("X")}</span>
                  </p>
                  <h1 className="font-heading text-[2.6rem] font-semibold leading-[1.1] tracking-tight text-white sm:text-[3.25rem] lg:text-[3.85rem]">
                    {translateUI("Everything for class.")}<br />
                    {translateUI("One place.")}</h1>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-white/80">
                    {translateUI("Modules, notes, assignments, timetable, past papers and study tools — organized so you can focus on learning.")}</p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Button href="/signup" className="h-11 px-5 text-sm">
                      {translateUI("Get Started ")}<ArrowRight className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      href="#features"
                      variant="outline"
                      className="h-11 border-white/30 bg-white/5 px-5 text-sm text-white hover:bg-white/15 hover:text-white"
                    >
                      {translateUI("Explore DarasaX")}</Button>
                  </div>
                  <a
                    href="#features"
                    className="focus-ring mt-8 inline-flex items-center gap-2 rounded text-xs text-white/65 transition hover:text-white"
                  >
                    {translateUI("Take a look around")}{" "}
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                  </a>
                </motion.div>
              </div>
            </div>
            <div className="border-t border-white/10">
              <div className="mx-auto flex max-w-6xl flex-wrap gap-x-8 gap-y-3 px-5 py-5 text-xs text-white/65 sm:px-8">
                <span className="font-medium text-white">
                  {translateUI("Built for your class")}</span>
                <span>{translateUI("Notes in one place")}</span>
                <span>{translateUI("Class-specific resources")}</span>
                <span>{translateUI("Your schedule, at a glance")}</span>
              </div>
            </div>
          </section>

          <section
            id="features"
            className="mx-auto max-w-6xl scroll-mt-8 px-5 py-16 sm:px-8 sm:py-24"
          >
            <motion.div
              {...reveal}
              className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                  {translateUI("The essentials")}</p>
                <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                  {translateUI("Less scattered.")}<br />
                  {translateUI("More together.")}</h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                {translateUI("No digging through chat groups or switching between folders. Your class has a place of its own.")}</p>
            </motion.div>
            <div className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {tools.map(({ title, text, icon: Icon }, i) => (
                <motion.article
                  key={title}
                  {...reveal}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  className="group bg-card p-6 sm:p-7"
                >
                  <span className="mb-7 inline-flex rounded-2xl bg-primary/10 p-3 text-primary transition-transform duration-200 motion-safe:group-hover:-translate-y-1">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="font-heading text-lg font-semibold">
                    {translateUI(title)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {translateUI(text)}
                  </p>
                </motion.article>
              ))}
            </div>
          </section>

          <section className="border-y border-border bg-muted/25">
            <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-16">
              <motion.div
                {...reveal}
                className="relative aspect-[4/3] overflow-hidden rounded-3xl"
              >
                <Image
                  src="/images/campus/classroom.jpg"
                  alt={translateUI("Student working with a laptop in a library")}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B2B]/70 to-transparent" />
                <p className="absolute bottom-6 left-6 right-6 font-heading text-xl font-medium text-white">
                  {translateUI("More time for the part that matters.")}</p>
              </motion.div>
              <motion.div {...reveal}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                  {translateUI("A clearer starting point")}</p>
                <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                  {translateUI("Open DarasaX.")}<br />
                  {translateUI("Know what’s next.")}</h2>
                <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                  {translateUI("Start with your next class and the work coming up. Go deeper into a module when you need to, with topics and materials kept together.")}</p>
                <ul className="mt-6 space-y-4">
                  {[
                    "Find the right room and lecturer",
                    "Keep upcoming assignments in view",
                    "Read and download your class materials",
                  ].map((text) => (
                    <li key={text} className="flex items-start gap-3 text-sm">
                      <Check
                        className="h-4 w-4 shrink-0 text-primary"
                        aria-hidden
                      />
                      {translateUI(text)}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="focus-ring mt-8 inline-flex items-center gap-2 rounded text-sm font-medium text-primary"
                >
                  {translateUI("Get started ")}<ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </motion.div>
            </div>
          </section>

          <CampusStories />

          <section
            id="how"
            className="mx-auto max-w-6xl scroll-mt-8 px-5 py-16 sm:px-8 sm:py-24"
          >
            <motion.div {...reveal}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                {translateUI("Getting started")}</p>
              <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                {translateUI("A few steps. A clearer semester.")}</h2>
            </motion.div>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  {...reveal}
                  transition={{ duration: 0.25, delay: i * 0.06 }}
                  className="border-t border-border pt-5"
                >
                  <span className="text-xs font-semibold text-primary">
                    0{translateUI(i + 1)}
                  </span>
                  <h3 className="mt-5 font-heading text-xl font-semibold">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                    {translateUI(step.text)}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          <section
            id="ai"
            className="mx-auto max-w-6xl px-5 pb-16 sm:px-8 sm:pb-24"
          >
            <motion.div
              {...reveal}
              className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:p-8"
            >
              <span className="w-fit rounded-2xl bg-primary/10 p-3 text-primary">
                <Sparkles className="h-5 w-5" aria-hidden />
              </span>
              <div className="flex-1">
                <h2 className="font-heading text-xl font-semibold">
                  {translateUI("A question on your mind?")}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {translateUI("Ask DarasaX will be available in the next version of the app.")}</p>
              </div>
              <span className="w-fit rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">{translateUI("Coming next version")}</span>
            </motion.div>
          </section>

          <section className="px-5 pb-16 sm:px-8 sm:pb-24">
            <motion.div
              {...reveal}
              className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-3xl bg-[#0B1B2B] px-6 py-14 text-center sm:py-20"
            >
              <Image
                src="/images/campus/campus-group.jpg"
                alt={""}
                fill
                sizes="1152px"
                className="-z-20 object-cover"
              />
              <div className="absolute inset-0 -z-10 bg-[#0B1B2B]/90" />
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-[#4FC3F7]">
                {translateUI("Your class. Your space.")}</p>
              <h2 className="font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {translateUI("Make room for better studying.")}</h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/65">
                {translateUI("One place to come back to, from your first class to your next deadline.")}</p>
              <Button href="/signup" className="mt-7 h-12 px-6">
                {translateUI("Create your account")}{" "}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </motion.div>
          </section>
        </main>
        <footer className="border-t border-border bg-card">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-sm shrink-0">
                <Logo />
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {translateUI("Everything for class. One place. Your modules, deadlines, notes and study tools in a modern academic workspace.")}</p>
                <Button href="/signup" className="mt-5 h-9 px-4 text-sm">
                  {translateUI("Get Started")}</Button>
              </div>

              <div className="grid grid-cols-2 gap-10 sm:gap-16">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {translateUI("Product")}</p>
                  <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                    <li>
                      <a
                        href="#features"
                        className="transition hover:text-foreground"
                      >
                        {translateUI("Features")}</a>
                    </li>
                    <li>
                      <a
                        href="#how"
                        className="transition hover:text-foreground"
                      >
                        {translateUI("How it works")}</a>
                    </li>
                    <li>
                      <a
                        href="#ai"
                        className="transition hover:text-foreground"
                      >
                        {translateUI("Ask DarasaX")}</a>
                    </li>
                    <li>
                      <Link
                        href="/signup"
                        className="transition hover:text-foreground"
                      >
                        {translateUI("Get Started")}</Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {translateUI("Account")}</p>
                  <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                    <li>
                      <Link
                        href="/login"
                        className="transition hover:text-foreground"
                      >
                        {translateUI("Log in")}</Link>
                    </li>
                    <li>
                      <Link
                        href="/signup"
                        className="transition hover:text-foreground"
                      >
                        {translateUI("Sign up")}</Link>
                    </li>
                    <li>
                      <Link
                        href="/dashboard"
                        className="transition hover:text-foreground"
                      >
                        {translateUI("Open dashboard")}</Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p>
                © {translateUI(new Date().getFullYear())} {translateUI(" DarasaX. Built for university students.")}</p>
              <p>
                {translateUI("Managed by")}{" "}
                <span className="font-medium text-foreground">{translateUI("Ezekiel")}</span>
              </p>
              <p className="text-muted-foreground/80">
                {translateUI("Your student journey, simplified.")}</p>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
