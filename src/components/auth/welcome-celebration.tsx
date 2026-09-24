"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PETALS = [
  { left: "8%", delay: 0, duration: 4.2, size: 14, rotate: 20 },
  { left: "18%", delay: 0.4, duration: 5.1, size: 10, rotate: -30 },
  { left: "28%", delay: 0.15, duration: 4.6, size: 16, rotate: 45 },
  { left: "40%", delay: 0.7, duration: 5.4, size: 12, rotate: -15 },
  { left: "52%", delay: 0.25, duration: 4.8, size: 15, rotate: 35 },
  { left: "64%", delay: 0.55, duration: 5.2, size: 11, rotate: -40 },
  { left: "74%", delay: 0.1, duration: 4.4, size: 13, rotate: 10 },
  { left: "86%", delay: 0.85, duration: 5.6, size: 17, rotate: -25 },
  { left: "12%", delay: 1.1, duration: 4.9, size: 9, rotate: 50 },
  { left: "58%", delay: 1.3, duration: 5.3, size: 14, rotate: -10 },
  { left: "92%", delay: 0.35, duration: 4.7, size: 12, rotate: 28 },
  { left: "34%", delay: 1.5, duration: 5.0, size: 10, rotate: -55 },
];

function FlowerMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden
      fill="none"
    >
      <circle cx="32" cy="32" r="7" fill="#1E88E5" />
      <ellipse cx="32" cy="16" rx="9" ry="12" fill="#4FC3F7" opacity="0.9" />
      <ellipse cx="32" cy="48" rx="9" ry="12" fill="#4FC3F7" opacity="0.9" />
      <ellipse cx="16" cy="32" rx="12" ry="9" fill="#1565C0" opacity="0.85" />
      <ellipse cx="48" cy="32" rx="12" ry="9" fill="#1565C0" opacity="0.85" />
      <ellipse
        cx="20"
        cy="20"
        rx="9"
        ry="11"
        fill="#4FC3F7"
        opacity="0.7"
        transform="rotate(-40 20 20)"
      />
      <ellipse
        cx="44"
        cy="20"
        rx="9"
        ry="11"
        fill="#4FC3F7"
        opacity="0.7"
        transform="rotate(40 44 20)"
      />
      <ellipse
        cx="20"
        cy="44"
        rx="9"
        ry="11"
        fill="#1E88E5"
        opacity="0.65"
        transform="rotate(40 20 44)"
      />
      <ellipse
        cx="44"
        cy="44"
        rx="9"
        ry="11"
        fill="#1E88E5"
        opacity="0.65"
        transform="rotate(-40 44 44)"
      />
    </svg>
  );
}

function Petal({
  left,
  delay,
  duration,
  size,
  rotate,
}: {
  left: string;
  delay: number;
  duration: number;
  size: number;
  rotate: number;
}) {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute top-[-10%] text-primary"
      style={{ left }}
      initial={{ y: "-10vh", opacity: 0, rotate }}
      animate={{
        y: "110vh",
        opacity: [0, 0.85, 0.85, 0],
        rotate: rotate + 180,
        x: [0, 18, -12, 8],
      }}
      transition={{
        duration,
        delay,
        ease: "easeIn",
        repeat: Infinity,
        repeatDelay: 0.4,
      }}
    >
      <svg width={size} height={size * 1.4} viewBox="0 0 12 18" fill="none">
        <ellipse cx="6" cy="9" rx="5" ry="8" fill="currentColor" opacity="0.55" />
      </svg>
    </motion.span>
  );
}

export function WelcomeCelebration({
  title = "You're all set",
  subtitle = "Welcome to DarasaX — your academic home is ready.",
  ctaLabel = "Go to dashboard",
  onContinue,
  tone = "default",
}: {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  onContinue: () => void;
  tone?: "default" | "dark";
}) {
  const isDark = tone === "dark";

  return (
    <div className="relative flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-[22px] px-4 py-8 text-center">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0",
          isDark
            ? "bg-[radial-gradient(ellipse_at_center,rgba(79,195,247,0.22),transparent_65%)]"
            : "bg-[radial-gradient(ellipse_at_center,rgba(79,195,247,0.18),transparent_65%)]",
        )}
      />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {PETALS.map((petal, i) => (
          <Petal key={i} {...petal} />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.6, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="relative z-10"
      >
        <motion.div
          animate={{ y: [0, -6, 0], rotate: [0, 4, -4, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <FlowerMark className="mx-auto h-14 w-14 drop-shadow-sm" />
        </motion.div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.35 }}
        className={cn(
          "relative z-10 mt-4 font-heading text-lg font-semibold tracking-tight",
          isDark && "text-white",
        )}
      >
        {title}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.35 }}
        className={cn(
          "relative z-10 mt-1.5 max-w-sm text-[12px]",
          isDark ? "text-white/65" : "text-muted-foreground",
        )}
      >
        {subtitle}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.3 }}
        className="relative z-10 mt-5 w-full max-w-xs"
      >
        <Button className="h-9 w-full text-[13px]" onClick={onContinue}>
          {ctaLabel}
        </Button>
      </motion.div>
    </div>
  );
}
