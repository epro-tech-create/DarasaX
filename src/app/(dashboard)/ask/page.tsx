"use client";
import { useTranslate } from "@/components/providers/language-provider";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AskPage() {
  const translateUI = useTranslate();
  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-6 text-center sm:p-10">
      <Sparkles className="mx-auto h-8 w-8 text-primary" aria-hidden />
      <h1 className="mt-4 font-heading text-xl font-semibold">{translateUI("Ask DarasaX")}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{translateUI("Coming in the next version of DarasaX.")}</p>
      <Button href="/dashboard" className="mt-6">{translateUI("Back to Home")}</Button>
    </section>
  );
}
