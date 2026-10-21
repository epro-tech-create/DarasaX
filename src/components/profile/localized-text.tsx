"use client";
import { useTranslate } from "@/components/providers/language-provider";

/** Client text boundary for labels rendered inside server pages. */
export function LocalizedText({ children }: { children: string }) {
  const translateUI = useTranslate();
  return <>{translateUI(children)}</>;
}
