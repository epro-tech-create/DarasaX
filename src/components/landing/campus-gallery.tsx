"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
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

export function CampusGallery() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  useEffect(() => {
    if (reduced !== false || paused || hovering) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible")
        setActive((value) => (value + 1) % photos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [reduced, paused, hovering]);

  return (
    <div
      className="relative isolate aspect-[4/3] w-full overflow-hidden rounded-3xl border border-white/20 bg-[#0B1B2B] shadow-2xl lg:aspect-[4/5]"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setHovering(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setHovering(false);
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Student life gallery"
    >
      {photos.map((photo, index) => (
        <motion.div
          key={photo.src}
          className="absolute inset-0"
          initial={false}
          animate={{
            opacity: active === index ? 1 : 0,
            scale: !reduced && active === index ? 1.035 : 1,
          }}
          transition={{
            opacity: { duration: reduced ? 0 : 0.6 },
            scale: { duration: reduced ? 0 : 5 },
          }}
          aria-hidden={active !== index}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 70vw, 420px"
            priority={index === 0}
            className="object-cover"
            style={{ objectPosition: photo.position }}
          />
        </motion.div>
      ))}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B1B2B]/95 via-transparent to-black/10" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-white/65">
          Life beyond the lecture
        </p>
        <p className="font-heading text-2xl font-semibold text-white">
          {photos[active].label}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex gap-1" role="group" aria-label="Choose a photo">
            {photos.map((photo, index) => (
              <button
                key={photo.src}
                type="button"
                onClick={() => {
                  setActive(index);
                  setPaused(true);
                }}
                aria-label={`Show photo ${index + 1}: ${photo.label}`}
                aria-pressed={active === index}
                className="focus-ring flex h-11 w-10 items-center justify-center rounded-lg"
              >
                <span
                  className={`h-1 rounded-full transition-all duration-300 ${active === index ? "w-8 bg-white" : "w-3 bg-white/40"}`}
                />
              </button>
            ))}
          </div>
          {reduced === false && (
            <button
              type="button"
              onClick={() => setPaused(!paused)}
              aria-label={paused ? "Play slideshow" : "Pause slideshow"}
              className="focus-ring flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-white"
            >
              {paused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
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
}: {
  story: (typeof stories)[number];
  index: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  return (
    <div className="campus-stack-slot" style={{ zIndex: index + 1 }}>
      <motion.article
        ref={ref}
        style={{ scale: reduced ? 1 : scale }}
        className="campus-story relative grid overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-black/10 md:grid-cols-2"
      >
        <div className="relative aspect-[4/3] md:aspect-auto">
          <Image
            src={story.photo.src}
            alt={story.photo.alt}
            fill
            sizes="(max-width: 768px) 90vw, 550px"
            className="object-cover"
            style={{ objectPosition: story.photo.position }}
          />
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {story.tag}
          </p>
          <h3 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {story.title}
          </h3>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
            {story.text}
          </p>
        </div>
      </motion.article>
    </div>
  );
}

export function CampusStories() {
  return (
    <section
      className="mx-auto max-w-6xl px-5 pb-16 sm:px-8 sm:pb-24"
      aria-labelledby="campus-stories-title"
    >
      <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            More than a workspace
          </p>
          <h2
            id="campus-stories-title"
            className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            A little more campus.
            <br />A little less chaos.
          </h2>
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          Keep scrolling <ArrowDown className="h-4 w-4" aria-hidden />
        </p>
      </div>
      <div className="campus-stack">
        {stories.map((story, index) => (
          <StoryCard key={story.tag} story={story} index={index} />
        ))}
      </div>
    </section>
  );
}
