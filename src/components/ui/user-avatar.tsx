import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function UserAvatar({
  name,
  className,
  size = "md",
}: {
  name: string;
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
        "inline-flex items-center justify-center rounded-full bg-primary/15 font-semibold text-primary",
        sizes[size],
        className,
      )}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
