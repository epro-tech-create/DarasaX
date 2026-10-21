"use client";
import { usePathname } from "next/navigation";

export function useLearningPrefix() {
  return usePathname().startsWith("/cr/") ? "/cr" : "";
}
