"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Branded boot screen with an animated X.
 *
 * Rendered by the root layout so the very first paint shows the brand
 * instead of an empty themed void. Fades out shortly after hydration and
 * unmounts itself — it never blocks interaction for long.
 */
export function BootSplash() {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const fade = window.setTimeout(() => setLeaving(true), 450);
    const remove = window.setTimeout(() => setGone(true), 850);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(remove);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      id="darasax-boot"
      aria-hidden
      className={cn("boot-splash", leaving && "boot-splash-leaving")}
    >
      <svg
        viewBox="700 255 670 675"
        className="boot-x text-primary"
        role="presentation"
      >
        <g fill="currentColor">
          <path d="M1105.55,590.49l170.36,310.03h-140.89l-108.99-212.34-.82-3.3-157.02,215.64h-140.48l234.54-310.03-170.36-310.03h140.89l109.8,213.14h3.23l153.8-213.14h140.48l-234.54,310.03Z" />
          <polygon points="1042.57 493.61 991.19 280.47 905.17 280.47 1042.57 493.61" />
          <polygon points="1219.59 280.47 1149.88 280.47 1045.8 493.61 1219.59 280.47" />
          <polygon points="1024.68 685.36 940.77 900.53 845.85 900.53 1024.68 685.36" />
          <polygon points="1195.74 902.07 1093.03 902.07 1022.67 678.8 1195.74 902.07" />
        </g>
      </svg>
      <p className="boot-word">
        Darasa<span className="brand-x">X</span>
      </p>
      <div className="boot-bar">
        <span />
      </div>
    </div>
  );
}
