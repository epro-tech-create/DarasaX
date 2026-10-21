"use client";

import { useTranslate } from "@/components/providers/language-provider";

export function WorkspaceLoading() {
  const t = useTranslate();
  return <div role="status" aria-live="polite" className="space-y-5">
    <span className="sr-only">{t("Loading page...")}</span>
    <div aria-hidden="true" className="space-y-5 motion-safe:animate-pulse">
      <div className="h-8 w-48 rounded-xl bg-muted" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[0, 1, 2].map(index => <div key={index} className="h-24 rounded-2xl border border-border bg-card" />)}
      </div>
      <div className="h-64 rounded-2xl border border-border bg-card" />
    </div>
  </div>;
}
