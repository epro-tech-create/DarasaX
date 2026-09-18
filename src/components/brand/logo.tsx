"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/components/providers/theme-provider";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: { width: 132, height: 28, className: "h-[22px] w-auto", mark: 22 },
  md: { width: 160, height: 34, className: "h-7 w-auto", mark: 28 },
  lg: { width: 210, height: 44, className: "h-9 w-auto", mark: 36 },
} as const;

function useLogoVariant(variant: "auto" | "light" | "dark") {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const themeIsDark = mounted ? resolvedTheme === "dark" : true;
  return variant === "dark" || (variant === "auto" && themeIsDark);
}

export function Logo({
  className,
  href = "/",
  size = "md",
  markOnly = false,
  variant = "auto",
}: {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
  markOnly?: boolean;
  variant?: "auto" | "light" | "dark";
}) {
  const useDark = useLogoVariant(variant);
  const dims = sizeMap[size];

  if (markOnly) {
    return (
      <Link
        href={href}
        className={cn("focus-ring inline-flex items-center rounded-lg", className)}
        aria-label="DarasaX"
      >
        <Image
          src="/brand/icon-x.png"
          alt=""
          width={dims.mark * 2}
          height={dims.mark * 2}
          quality={100}
          className="object-contain"
          style={{ width: dims.mark, height: dims.mark }}
          priority
        />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn("focus-ring inline-flex items-center rounded-lg", className)}
      aria-label="DarasaX"
    >
      <Image
        src={useDark ? "/brand/logo-dark.png" : "/brand/logo-light.png"}
        alt="DarasaX"
        width={dims.width * 3}
        height={dims.height * 3}
        quality={100}
        className={cn("object-contain object-left", dims.className)}
        priority
      />
    </Link>
  );
}

export function BrandMark({
  className,
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Image
      src="/brand/icon-x.png"
      alt="DarasaX"
      width={size * 2}
      height={size * 2}
      quality={100}
      className={cn("object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function LogoImage({
  className,
  size = "md",
  variant = "auto",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "auto" | "light" | "dark";
}) {
  const useDark = useLogoVariant(variant);
  const dims = sizeMap[size];

  return (
    <Image
      src={useDark ? "/brand/logo-dark.png" : "/brand/logo-light.png"}
      alt="DarasaX"
      width={dims.width * 3}
      height={dims.height * 3}
      quality={100}
      className={cn("object-contain object-left", dims.className, className)}
      priority
    />
  );
}
