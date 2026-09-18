import Image from "next/image";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AuthShell({
  children,
  title,
  subtitle,
  footer,
}: {
  children: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen font-sans lg:grid-cols-2">
      <div className="relative hidden overflow-hidden p-8 text-white lg:flex lg:flex-col lg:justify-between xl:p-10">
        <Image
          src="/auth-panel.jpg"
          alt="Student studying with joy"
          fill
          priority
          className="object-cover object-center"
          sizes="50vw"
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B2B] via-[#0B1B2B]/55 to-[#1565C0]/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1B2B]/70 via-transparent to-[#1E88E5]/35" />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#0B1B2B] to-transparent" />

        <div className="relative z-10 flex items-center justify-between">
          <Logo variant="dark" className="drop-shadow-sm" href="/" />
          <ThemeToggle lightOnDark />
        </div>
        <div className="relative z-10">
          <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tight xl:text-[1.85rem]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2.5 max-w-md text-sm leading-relaxed text-white/80">
              {subtitle}
            </p>
          ) : null}
        </div>
        <p className="relative z-10 text-sm text-white/65">
          Everything for class. One place.
        </p>
      </div>

      <div className="relative flex items-center justify-center px-4 py-8 sm:py-10">
        <div className="absolute right-4 top-4 lg:hidden">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-[400px] text-[15px] sm:text-[13px]">
          <div className="mb-6 lg:hidden">
            <Logo href="/" />
          </div>
          {children}
          {footer ? <div className="mt-5">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
