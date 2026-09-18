import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  size = "md",
}: {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  };

  return (
    <Link
      href={href}
      className={cn(
        "font-heading font-semibold tracking-tight text-foreground focus-ring rounded-lg",
        sizes[size],
        className,
      )}
    >
      Darasa<span className="brand-x">X</span>
    </Link>
  );
}
