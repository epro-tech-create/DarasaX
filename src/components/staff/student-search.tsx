"use client";

import { Search, X } from "lucide-react";
import { useTranslate } from "@/components/providers/language-provider";

export function StudentSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useTranslate();
  return <div className="relative mb-4 w-full sm:max-w-md">
    <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
    <input type="search" value={value} onChange={event => onChange(event.target.value)}
      aria-label={t("Search students by name, email, or registration number")}
      placeholder={t("Search name, email, or registration number…")}
      className="focus-ring h-11 w-full rounded-xl border border-border bg-background pl-10 pr-11 text-sm [&::-webkit-search-cancel-button]:appearance-none" />
    {value && <button type="button" onClick={() => onChange("")} aria-label={t("Clear search")}
      className="focus-ring absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground">
      <X aria-hidden="true" className="h-4 w-4" />
    </button>}
  </div>;
}
