"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function UserAvatar({
  name,
  src,
  className,
  size = "md",
}: {
  name: string;
  src?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
} & HTMLAttributes<HTMLDivElement>) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-xl",
  };

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden items-center justify-center rounded-full bg-primary/15 font-semibold text-primary",
        sizes[size],
        className,
      )}
      aria-label={name}
    >
      {initials}
      {src ? (
        // Signed/private avatar URLs and OAuth images are resolved by the caller.
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={src} alt="" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />
      ) : null}
    </div>
  );
}
