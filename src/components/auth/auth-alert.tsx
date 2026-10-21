"use client";
import { useTranslate } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

export function AuthAlert({
  message,
  tone = "error",
}: {
  message: string;
  tone?: "error" | "success" | "info";
}) {
  const translateUI = useTranslate();
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        "rounded-[10px] border px-2.5 py-2 text-[11px] transition",
        tone === "error" && "border-danger/30 bg-danger/10 text-danger",
        tone === "success" && "border-success/30 bg-success/10 text-success",
        tone === "info" && "border-primary/25 bg-primary/10 text-primary",
      )}
    >
      {translateUI(message)}
    </div>
  );
}
