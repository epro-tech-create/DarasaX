"use client";

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
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.25 }}>
      <div className="min-h-screen bg-background">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-card focus:p-3"
        >
          Skip to content
        </a>
        <header className="absolute inset-x-0 top-0 z-30 border-b border-white/10">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
            <Logo size="md" variant="dark" />
            <nav
              aria-label="Main navigation"
              className="hidden items-center gap-7 text-sm text-white/75 md:flex"
            >
              <a
                href="#features"
                className="focus-ring rounded transition hover:text-white"
              >
                The workspace
              </a>
              <a
                href="#how"
                className="focus-ring rounded transition hover:text-white"
              >
                How it works
              </a>
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle lightOnDark />
              <Button
                variant="ghost"
                href="/login"
                className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex"
              >
                Log in
              </Button>
              <Button href="/signup" className="px-4 text-xs sm:text-sm">
                Get started <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </div>
          </div>
        </header>

        <main id="main-content">
          <section className="relative isolate overflow-hidden bg-[#0B1B2B] text-white">
            <Image
              src="/landing-hero.jpg"
              alt="University students studying together on campus"
              fill
              priority
              sizes="100vw"
              className="-z-20 object-cover object-center"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0B1B2B]/95 via-[#0B1B2B]/80 to-[#0B1B2B]/40" />
            <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-12 pt-40 sm:px-8 sm:pb-16 sm:pt-48 lg:grid-cols-[1.3fr_0.7fr] lg:pb-24">
              <motion.div {...reveal}>
                <p className="mb-5 flex items-center gap-2 text-xs font-medium tracking-wide text-white/75">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4FC3F7]" /> A
                  little less searching. A lot more learning.
                </p>
                <h1 className="max-w-2xl font-heading text-[clamp(2.6rem,6vw,4.8rem)] font-semibold leading-[1.04] tracking-tight">
                  Everything for class.
                  <br />
                  <span className="text-[#4FC3F7]">One place.</span>
                </h1>
                <p className="mt-6 max-w-md text-base leading-relaxed text-white/70">
                  Your notes, next class and upcoming deadlines. A calmer way to
                  keep up with university life.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button href="/signup" className="h-12 px-6">
                    Find your workspace{" "}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                  <Button
                    href="/login"
                    variant="outline"
                    className="h-12 border-white/25 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white"
                  >
                    Log in
                  </Button>
                </div>
                <a
                  href="#features"
                  className="focus-ring mt-10 inline-flex items-center gap-2 rounded text-xs text-white/60 transition hover:text-white"
                >
                  Take a look around{" "}
                  <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                </a>
              </motion.div>
              <motion.div
                {...reveal}
                transition={{ duration: 0.28, delay: 0.12 }}
                className="hidden rounded-3xl border border-white/15 bg-[#0B1B2B]/60 p-6 shadow-2xl backdrop-blur-xl lg:block"
              >
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-xs font-medium text-white/60">
                    A look inside
                  </p>
                  <span className="rounded-full border border-white/15 px-2 py-1 text-[10px] text-white/60">
                    Workspace preview
                  </span>
                </div>
                <h2 className="font-heading text-2xl font-semibold">
                  Your day, in focus.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  The essentials, without the noise.
                </p>
                <div className="mt-7 divide-y divide-white/10">
                  {[
                    {
                      icon: CalendarDays,
                      title: "Know where to go",
                      text: "Your class timetable",
                    },
                    {
                      icon: BookOpen,
                      title: "Pick up where you left off",
                      text: "Topics and lecture notes",
                    },
                    {
                      icon: ClipboardList,
                      title: "Keep the next deadline close",
                      text: "Upcoming coursework",
                    },
                  ].map(({ icon: Icon, title, text }) => (
                    <div key={title} className="flex items-start gap-3 py-4">
                      <Icon
                        className="mt-0.5 h-4 w-4 text-[#4FC3F7]"
                        aria-hidden
                      />
                      <div>
                        <p className="text-sm font-medium">{title}</p>
                        <p className="mt-1 text-xs text-white/50">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
            <div className="border-t border-white/10">
              <div className="mx-auto flex max-w-6xl flex-wrap gap-x-8 gap-y-3 px-5 py-5 text-xs text-white/65 sm:px-8">
                <span className="font-medium text-white">
                  Built for your class
                </span>
                <span>Notes in one place</span>
                <span>Class-specific resources</span>
                <span>Your schedule, at a glance</span>
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
                  The essentials
                </p>
                <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                  Less scattered.
                  <br />
                  More together.
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                No digging through chat groups or switching between folders.
                Your class has a place of its own.
              </p>
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
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {text}
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
                  src="/landing-study.jpg"
                  alt="Student working with a laptop in a library"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B2B]/70 to-transparent" />
                <p className="absolute bottom-6 left-6 right-6 font-heading text-xl font-medium text-white">
                  More time for the part that matters.
                </p>
              </motion.div>
              <motion.div {...reveal}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                  A clearer starting point
                </p>
                <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                  Open DarasaX.
                  <br />
                  Know what’s next.
                </h2>
                <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                  Start with your next class and the work coming up. Go deeper
                  into a module when you need to, with topics and materials kept
                  together.
                </p>
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
                      {text}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="focus-ring mt-8 inline-flex items-center gap-2 rounded text-sm font-medium text-primary"
                >
                  Get started <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </motion.div>
            </div>
          </section>

          <section
            id="how"
            className="mx-auto max-w-6xl scroll-mt-8 px-5 py-16 sm:px-8 sm:py-24"
          >
            <motion.div {...reveal}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                Getting started
              </p>
              <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                A few steps. A clearer semester.
              </h2>
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
                    0{i + 1}
                  </span>
                  <h3 className="mt-5 font-heading text-xl font-semibold">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                    {step.text}
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
                  A question on your mind?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Ask DarasaX gives your study questions a place in the same
                  workspace.
                </p>
              </div>
              <Button variant="outline" href="/ask" className="w-fit">
                Explore Ask DarasaX{" "}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </motion.div>
          </section>

          <section className="px-5 pb-16 sm:px-8 sm:pb-24">
            <motion.div
              {...reveal}
              className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-3xl bg-[#0B1B2B] px-6 py-14 text-center sm:py-20"
            >
              <Image
                src="/landing-catchup.jpg"
                alt=""
                fill
                sizes="1152px"
                className="-z-20 object-cover"
              />
              <div className="absolute inset-0 -z-10 bg-[#0B1B2B]/90" />
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-[#4FC3F7]">
                Your class. Your space.
              </p>
              <h2 className="font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Make room for better studying.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/65">
                One place to come back to, from your first class to your next
                deadline.
              </p>
              <Button href="/signup" className="mt-7 h-12 px-6">
                Create your account{" "}
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
                  Everything for class. One place. Your modules, deadlines,
                  notes and study tools in a modern academic workspace.
                </p>
                <Button href="/signup" className="mt-5 h-9 px-4 text-sm">
                  Get Started
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-10 sm:gap-16">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Product
                  </p>
                  <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                    <li>
                      <a
                        href="#features"
                        className="transition hover:text-foreground"
                      >
                        Features
                      </a>
                    </li>
                    <li>
                      <a
                        href="#how"
                        className="transition hover:text-foreground"
                      >
                        How it works
                      </a>
                    </li>
                    <li>
                      <a
                        href="#ai"
                        className="transition hover:text-foreground"
                      >
                        Ask DarasaX
                      </a>
                    </li>
                    <li>
                      <Link
                        href="/signup"
                        className="transition hover:text-foreground"
                      >
                        Get Started
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Account
                  </p>
                  <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                    <li>
                      <Link
                        href="/login"
                        className="transition hover:text-foreground"
                      >
                        Log in
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/signup"
                        className="transition hover:text-foreground"
                      >
                        Sign up
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/dashboard"
                        className="transition hover:text-foreground"
                      >
                        Open dashboard
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p>
                © {new Date().getFullYear()} DarasaX. Built for university
                students.
              </p>
              <p>
                Managed by{" "}
                <span className="font-medium text-foreground">Ezekiel</span>
              </p>
              <p className="text-muted-foreground/80">
                Your student journey, simplified.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
