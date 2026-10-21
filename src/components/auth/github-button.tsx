"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslate } from "@/components/providers/language-provider";
import { createClient } from "@/lib/supabase/client";
import { signInWithGitHub } from "@/lib/auth/oauth";
import { safeStudentReturnPath } from "@/lib/auth/redirect";
import { getAuthErrorMessage } from "@/lib/auth/errors";
export function GitHubButton({ next, disabled = false, onError }: {
  next?: string | null; disabled?: boolean; onError: (message: string) => void;
}) {
  const t = useTranslate();
  const [loading,setLoading] = useState(false);
  async function connect() {
    if (loading || disabled) return;
    setLoading(true); onError("");
    try {
      const destination = safeStudentReturnPath(next ?? null);
      const callback = `${window.location.origin}/auth/callback${destination ? `?next=${encodeURIComponent(destination)}` : ""}`;
      await signInWithGitHub(createClient(),callback);
    } catch (error) {
      onError(getAuthErrorMessage(error)); setLoading(false);
    }
  }
  return <Button type="button" variant="outline" disabled={disabled || loading} onClick={() => void connect()}
    className="h-11 w-full border-border bg-card text-[15px] text-foreground hover:bg-muted sm:h-9 sm:text-[13px]">
    {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden><path d="M12 .297C5.37.297 0 5.67 0 12.297c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.043-1.61-4.043-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.084 1.838 1.237 1.838 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.776.42-1.305.763-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.31.467-2.381 1.235-3.221-.123-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 3.004-.404c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.654 1.652.242 2.873.119 3.176.77.84 1.233 1.911 1.233 3.221 0 4.609-2.807 5.624-5.479 5.921.431.372.815 1.103.815 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.595 24 12.297c0-6.627-5.373-12-12-12" /></svg>}
    {t(loading ? "Connecting to GitHub..." : "Continue with GitHub")}
  </Button>;
}
