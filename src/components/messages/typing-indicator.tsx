"use client";

export function TypingIndicator({ count }: { count: number }) {
  return <div role="status" aria-live="polite" aria-atomic="true" className="flex min-h-9 items-center px-4 sm:px-5">
    {count > 0 && <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
      <span aria-hidden="true" className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-2">
        {[0, 1, 2].map(dot => <span key={dot} className="h-1.5 w-1.5 rounded-full bg-primary motion-safe:animate-bounce" style={{ animationDelay: `${dot * 150}ms`, animationDuration: "1000ms" }} />)}
      </span>
      <span>{count === 1 ? "Someone is typing…" : "Several people are typing…"}</span>
    </div>}
  </div>;
}
