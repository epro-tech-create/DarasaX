"use client";
import { useEffect } from "react";

// Recheck the actual account when restoring an old browser-history snapshot.
// This has no clock, inactivity limit, or sign-out action.
export function SessionRestore() {
  useEffect(() => {
    const restore = (event: PageTransitionEvent) => { if (event.persisted) window.location.reload(); };
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);
  return null;
}
