"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  Archive,
  BookOpen,
  CalendarDays,
  ClipboardList,
  History,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const features = [
  {
    title: "All Your Modules",
    description: "Your notes, slides and resources organized by subject.",
    icon: BookOpen,
  },
  {
    title: "Never Miss a Deadline",
    description: "Assignments, CATs and exams in one place.",
    icon: ClipboardList,
  },
  {
    title: "Ask DarasaX",
    description: "Get help from your study materials.",
    icon: Sparkles,
  },
  {
    title: "Past Papers",
    description: "Find revision materials quickly.",
    icon: Archive,
  },
  {
    title: "What Did I Miss?",
    description: "Catch up after missing class.",
    icon: History,
  },
  {
    title: "Smart Timetable",
    description: "Always know what is next.",
    icon: CalendarDays,
  },
];

const steps = [
  {
    step: "01",
    title: "Join your class",
    text: "Select your institution, programme, year and semester.",
  },
  {
    step: "02",
    title: "Stay organized",
    text: "Modules, notes, deadlines and announcements live in one workspace.",
  },
  {
    step: "03",
    title: "Study smarter",
    text: "Use Ask DarasaX, past papers and your planner to prepare with focus.",
  },
];

const testimonials = [
  {
    name: "Aisha M.",
    role: "Computer Engineering · Year 3",
    quote:
      "I stopped hunting through WhatsApp groups for notes. DarasaX shows me what matters today.",
  },
  {
    name: "Brian K.",
    role: "Software Engineering · Year 2",
    quote:
      "The timetable and assignment reminders alone saved my CAT week. It feels built for real students.",
  },
  {
    name: "Neema J.",
    role: "Computer Science · Year 4",
    quote:
      "What Did I Miss? is exactly the feature I needed after clinic appointments and late labs.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.35]);

  return (
    <div className="min-h-screen bg-background">
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo size="md" variant="dark" className="drop-shadow-sm" />
          <nav className="hidden items-center gap-5 text-sm font-medium text-white/80 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#how" className="transition hover:text-white">
              How it works
            </a>
            <a href="#ai" className="transition hover:text-white">
              Ask DarasaX
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle lightOnDark />
            <Button
              variant="ghost"
              href="/login"
              className="hidden h-9 text-white hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              Log in
            </Button>
            <Button href="/signup" className="h-9 px-4 text-sm">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Full-bleed hero */}
      <section
        ref={heroRef}
        className="relative flex min-h-[100svh] items-end overflow-hidden"
      >
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <Image
            src="/landing-hero.jpg"
            alt="University students studying together on campus"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-[#1565C0]/25" />

        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-28 sm:px-6 sm:pb-20"
        >
          <motion.div
            initial="hidden"
            animate="show"
            transition={{ staggerChildren: 0.12 }}
            className="max-w-xl"
          >
            <motion.p
              variants={fadeUp}
              className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-[#4FC3F7]"
            >
              Darasa<span className="text-white">X</span>
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="font-heading text-[2.6rem] font-semibold leading-[1.1] tracking-tight text-white sm:text-[3.25rem] lg:text-[3.85rem]"
            >
              Everything for class.
              <br />
              One place.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-3 max-w-md text-base leading-relaxed text-white/80"
            >
              Modules, notes, assignments, timetable, past papers and study tools —
              organized so you can focus on learning.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-2.5">
              <Button href="/signup" className="h-10 px-5 text-sm">
                Get Started
              </Button>
              <Button
                variant="outline"
                href="#features"
                className="h-10 border-white/30 bg-white/5 px-5 text-sm text-white hover:bg-white/15 hover:text-white"
              >
                Explore DarasaX
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      <section className="border-b border-border bg-card py-7">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 text-sm text-muted-foreground sm:px-6">
          <span className="font-medium text-foreground">Trusted by students at</span>
          <span>DIT</span>
          <span>UDSM</span>
          <span>Mzumbe</span>
          <span>Ardhi</span>
          <span className="text-primary">2,400+ study sessions</span>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:py-20">
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-[1.65rem]">
            University life is scattered.
          </h2>
          <p className="mt-2.5 text-base text-muted-foreground">
            Notes in chat groups. Deadlines on paper. Past papers in random folders.
            Students lose time hunting for what they already have.
          </p>
          <h2 className="mt-8 font-heading text-2xl font-semibold tracking-tight sm:text-[1.65rem]">
            DarasaX brings it together.
          </h2>
          <p className="mt-2.5 text-base text-muted-foreground">
            One workspace that answers the only question that matters each morning:
            what do I need to know or do today?
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
          className="relative aspect-[4/3] overflow-hidden rounded-[22px]"
        >
          <Image
            src="/landing-study.jpg"
            alt="Student studying with laptop in a modern library"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </motion.div>
      </section>

      <section id="features" className="bg-muted/40 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-[1.65rem]">
              Built for how students actually study
            </h2>
            <p className="mt-1.5 max-w-xl text-base text-muted-foreground">
              Clear tools. Fast navigation. Zero LMS clutter.
            </p>
          </motion.div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  whileHover={{ y: -3 }}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-heading text-base font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-hidden rounded-[22px] bg-foreground text-background"
        >
          <div className="p-6 sm:p-7">
            <h2 className="font-heading text-xl font-semibold">Modules that feel alive</h2>
            <p className="mt-2 text-base text-background/65">
              Each subject gets its own accent, progress, notes and past papers —
              without looking like an admin portal.
            </p>
            <div className="mt-6 space-y-2">
              {[
                "Sensor networks",
                "Cyber security",
                "Web Application Development",
              ].map(
                (name, i) => (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i }}
                    className="rounded-xl bg-background/10 px-3.5 py-2.5 text-sm"
                    style={{
                      borderLeft: `3px solid ${["#1E88E5", "#4FC3F7", "#A3E635"][i]}`,
                    }}
                  >
                    {name}
                  </motion.div>
                ),
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          id="ai"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="rounded-[22px] border border-border bg-card p-6 sm:p-7"
        >
          <h2 className="font-heading text-xl font-semibold">Ask DarasaX</h2>
          <p className="mt-2 text-base text-muted-foreground">
            Explain topics, summarize notes, generate quizzes and prepare for CATs
            using your actual course materials.
          </p>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-6 rounded-xl bg-muted/80 p-3.5"
          >
            <p className="text-sm font-medium">
              Explain routing protocols in simple terms.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Routing protocols are rules routers use to choose the best path for
              data — RIP, OSPF and BGP each solve that differently...
            </p>
          </motion.div>
        </motion.div>
      </section>

      <section className="relative mx-auto max-w-6xl overflow-hidden px-4 pb-16 sm:px-6 sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative min-h-[280px] overflow-hidden rounded-[22px] sm:min-h-[340px]"
        >
          <Image
            src="/landing-catchup.jpg"
            alt="Student desk with notebook and phone ready for catch-up study"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1152px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1B2B]/92 via-[#1565C0]/75 to-[#1E88E5]/45" />
          <div className="relative z-10 flex h-full min-h-[280px] flex-col justify-end p-6 sm:min-h-[340px] sm:p-9">
            <h2 className="font-heading text-2xl font-semibold text-white sm:text-[1.65rem]">
              What Did I Miss?
            </h2>
            <p className="mt-2 max-w-lg text-base text-white/85">
              Pick a date. See classes held, topics covered, new notes, assignments
              and deadlines — then catch up in one flow.
            </p>
            <Button
              href="/signup"
              className="mt-5 h-9 w-fit bg-none bg-white px-4 text-sm text-primary hover:bg-white/90"
            >
              Try Catch Me Up
            </Button>
          </div>
        </motion.div>
      </section>

      <section id="how" className="bg-muted/40 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-[1.65rem]">
            How it works
          </h2>
          <div className="mt-7 grid gap-3 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <p className="font-heading text-xs font-semibold text-primary">
                  {step.step}
                </p>
                <h3 className="mt-1.5 font-heading text-base font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-[1.65rem]">
          Students are already feeling the difference
        </h2>
        <div className="mt-7 grid gap-3 md:grid-cols-3">
          {testimonials.map((item, i) => (
            <motion.blockquote
              key={item.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <p className="text-sm leading-relaxed text-muted-foreground">
                “{item.quote}”
              </p>
              <footer className="mt-3">
                <p className="text-base font-semibold">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.role}</p>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-6xl overflow-hidden rounded-[22px]"
        >
          <div className="relative px-6 py-12 text-center sm:px-10 sm:py-14">
            <Image
              src="/landing-hero.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="1152px"
            />
            <div className="absolute inset-0 bg-[#0B1B2B]/88" />
            <div className="relative z-10">
              <h2 className="font-heading text-2xl font-semibold tracking-tight text-white sm:text-[1.65rem]">
                Your student journey, simplified.
              </h2>
              <p className="mx-auto mt-2 max-w-md text-base text-white/75">
                Join DarasaX and keep every class, deadline and study session in one
                place.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                <Button href="/signup" className="h-10 px-5 text-sm">
                  Get Started
                </Button>
                <Button
                  variant="outline"
                  href="/login"
                  className="h-10 border-white/25 bg-transparent px-5 text-sm text-white hover:bg-white/10 hover:text-white"
                >
                  Log in
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-sm shrink-0">
              <Logo />
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Everything for class. One place. Your modules, deadlines, notes and
                study tools in a modern academic workspace.
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
                    <a href="#features" className="transition hover:text-foreground">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#how" className="transition hover:text-foreground">
                      How it works
                    </a>
                  </li>
                  <li>
                    <a href="#ai" className="transition hover:text-foreground">
                      Ask DarasaX
                    </a>
                  </li>
                  <li>
                    <Link href="/signup" className="transition hover:text-foreground">
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
                    <Link href="/login" className="transition hover:text-foreground">
                      Log in
                    </Link>
                  </li>
                  <li>
                    <Link href="/signup" className="transition hover:text-foreground">
                      Sign up
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard" className="transition hover:text-foreground">
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
            <p>© {new Date().getFullYear()} DarasaX. Built for university students.</p>
            <p>
              Managed by{" "}
              <span className="font-medium text-foreground">Ezekiel</span>
            </p>
            <p className="text-muted-foreground/80">Your student journey, simplified.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
