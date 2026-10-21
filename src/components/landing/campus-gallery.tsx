"use client";

import { useTranslate } from "@/components/providers/language-provider";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  type MotionValue,
  useTransform,
} from "framer-motion";
import { ArrowDown, Pause, Play } from "lucide-react";

const photos = [
  {
    src: "/images/campus/study-together.jpg",
    alt: "Students sharing a joyful group study session",
    label: "Better, together.",
    position: "center",
  },
  {
    src: "/images/campus/classroom.jpg",
    alt: "Student smiling at her classroom desk",
    label: "A place to belong.",
    position: "center 35%",
  },
  {
    src: "/images/campus/campus-group.jpg",
    alt: "Four students studying with laptops outdoors",
    label: "Your class. Your people.",
    position: "center",
  },
  {
    src: "/images/campus/reading.jpg",
    alt: "Student reading a book surrounded by stacks of books",
    label: "Room to get curious.",
    position: "center 45%",
  },
];

const heroPhotos = [
  {
    src: "/landing-hero.jpg",
    alt: "University students studying together on campus",
    position: "center",
  },
  ...photos,
];

export function HeroBackground() {
  const translateUI = useTranslate();
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (reduced !== false || paused) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible")
        setActive((value) => (value + 1) % heroPhotos.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [reduced, paused]);

  return (
    <>
      <div
        className="absolute inset-0 -z-20 overflow-hidden"
        aria-hidden="true"
      >
        {heroPhotos.map((photo, index) => (
          <motion.div
            key={photo.src}
            className="absolute inset-0"
            initial={false}
            animate={{
              opacity: active === index ? 1 : 0,
              scale: !reduced && active === index ? 1.04 : 1,
            }}
            transition={{
              opacity: { duration: reduced ? 0 : 0.8 },
              scale: { duration: reduced ? 0 : 6 },
            }}
          >
            <Image
              src={photo.src}
              alt={""}
              fill
              sizes="100vw"
              priority={index === 0}
              className="object-cover"
              style={{ objectPosition: photo.position }}
            />
          </motion.div>
        ))}
      </div>
      {reduced === false && (
        <button
          type="button"
          onClick={() => setPaused(!paused)}
          aria-label={
            translateUI(paused ? "Play background slideshow" : "Pause background slideshow")
          }
          className="focus-ring absolute bottom-5 right-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white backdrop-blur-sm transition hover:bg-black/40 sm:right-8"
        >
          {paused ? (
            <Play className="h-4 w-4" />
          ) : (
            <Pause className="h-4 w-4" />
          )}
        </button>
      )}
    </>
  );
}

const stories = [
  {
    photo: photos[2],
    title: "Find your people.",
    text: "A shared class deserves a shared space. Keep the materials you need close, wherever you study.",
    tag: "01 / Connect",
  },
  {
    photo: photos[1],
    title: "Show up with confidence.",
    text: "Your next lesson, room and lecturer. A little clarity before the day gets busy.",
    tag: "02 / Keep up",
  },
  {
    photo: photos[3],
    title: "Make space to go deeper.",
    text: "Explore your topics, revisit your notes and turn a little curiosity into your next breakthrough.",
    tag: "03 / Grow",
  },
];

function StoryCard({
  story,
  index,
  progress,
}: {
  story: (typeof stories)[number];
  index: number;
  progress: MotionValue<number>;
}) {
  const translateUI = useTranslate();
  const reduced = useReducedMotion();
  const start = index / stories.length;
  const end = (index + 1) / stories.length;
  const targetScale = useTransform(
    progress,
    [start, end],
    [1, index === stories.length - 1 ? 1 : 0.95],
  );
  const scale = useSpring(targetScale, {
    stiffness: 180,
    damping: 32,
    mass: 0.5,
  });
  return (
    <div
      className="campus-stack-slot"
      style={{
        zIndex: index + 1,
        top: `calc(var(--campus-stack-top) + ${index * 12}px)`,
      }}
    >
      <motion.article
        style={{ scale: reduced ? 1 : scale }}
        className="campus-story relative grid overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-black/10 md:grid-cols-2"
      >
        <div className="relative aspect-[4/3] md:aspect-auto">
          <Image
            src={story.photo.src}
            alt={translateUI(story.photo.alt)}
            fill
            sizes="(max-width: 768px) 90vw, 550px"
            className="object-cover"
            style={{ objectPosition: story.photo.position }}
          />
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {translateUI(story.tag)}
          </p>
          <h3 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {story.title}
          </h3>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
            {translateUI(story.text)}
          </p>
        </div>
      </motion.article>
    </div>
  );
}

export function CampusStories() {
  const translateUI = useTranslate();
  const stackRef = useRef<HTMLDivElement>(null);
  // Measure the stationary stack, never a sticky or transformed card.
  const { scrollYProgress } = useScroll({
    target: stackRef,
    offset: ["start 35%", "end end"],
  });
  return (
    <section
      className="mx-auto max-w-6xl px-5 pb-16 sm:px-8 sm:pb-24"
      aria-labelledby="campus-stories-title"
    >
      <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            {translateUI("More than a workspace")}</p>
          <h2
            id="campus-stories-title"
            className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {translateUI("A little more campus.")}<br />{translateUI("A little less chaos.")}</h2>
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          {translateUI("Keep scrolling ")}<ArrowDown className="h-4 w-4" aria-hidden />
        </p>
      </div>
      <div ref={stackRef} className="campus-stack">
        {stories.map((story, index) => (
          <StoryCard
            key={story.tag}
            story={story}
            index={index}
            progress={scrollYProgress}
          />
        ))}
      </div>
    </section>
  );
}
