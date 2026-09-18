import Link from "next/link";
import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "btn-gradient text-primary-foreground shadow-sm shadow-primary/25 hover:brightness-110",
  secondary: "bg-muted text-foreground hover:bg-muted/80",
  ghost: "bg-transparent hover:bg-muted text-foreground",
  outline: "border border-border bg-transparent hover:bg-muted text-foreground",
  danger: "bg-danger text-white hover:brightness-110",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-2.5 text-[12px] rounded-[10px]",
  md: "h-9 px-3.5 text-[12px] rounded-[12px]",
  lg: "h-10 px-4 text-[13px] rounded-[14px]",
  icon: "h-9 w-9 rounded-[12px] p-0",
};

const base =
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-out active:scale-[0.97] focus-ring disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", href, children, disabled, ...props }, ref) => {
    const classes = cn(base, variants[variant], sizes[size], className);

    if (href) {
      return (
        <Link href={href} className={classes} aria-disabled={disabled}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={classes} disabled={disabled} {...props}>
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
