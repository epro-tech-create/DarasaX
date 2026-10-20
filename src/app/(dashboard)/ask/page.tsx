import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AskPage() {
  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-6 text-center sm:p-10">
      <Sparkles className="mx-auto h-8 w-8 text-primary" aria-hidden />
      <h1 className="mt-4 font-heading text-xl font-semibold">Ask DarasaX</h1>
      <p className="mt-3 text-sm text-muted-foreground">Coming in the next version of DarasaX.</p>
      <Button href="/dashboard" className="mt-6">Back to Home</Button>
    </section>
  );
}
