import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileText, Download, Eye, ArrowRight } from "lucide-react";
import { getSharedMaterial } from "@/lib/material-sharing";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MaterialShareButton } from "@/components/modules/material-share-button";
import { LocalizedText } from "@/components/profile/localized-text";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const item = await getSharedMaterial(token);
  return {
    title: item
      ? `${item.title} · Shared material`
      : "Shared material unavailable",
    description: "View and download learning materials shared through DarasaX.",
    robots: { index: false, follow: true },
    openGraph: {
      title: item?.title || "Shared on DarasaX",
      description:
        "Notes, assignments and past papers. Everything for class. One place.",
    },
  };
}
export default async function SharedPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const item = await getSharedMaterial(token);
  if (!item) notFound();
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-6 sm:px-6">
      <header className="mb-12 flex items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>
      <main>
        <section className="surface rounded-3xl p-6 sm:p-9">
          <span className="mb-5 inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <FileText className="h-6 w-6" />
          </span>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-primary">
            <LocalizedText>Shared</LocalizedText> <LocalizedText>{item.kind.replace("_", " ")}</LocalizedText>
          </p>
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
            {item.title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {item.size || <LocalizedText>Learning material</LocalizedText>} <LocalizedText>· Shared through DarasaX</LocalizedText>
          </p>
          {item.body && (
            <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">
              {item.body}
            </p>
          )}
          <div className="mt-7 flex flex-wrap gap-2">
            <Button href={`/share/${token}/file`}>
              <Eye className="h-4 w-4" />
              <LocalizedText>View file</LocalizedText>
            </Button>
            <Button variant="outline" href={`/share/${token}/file?download=1`}>
              <Download className="h-4 w-4" />
              <LocalizedText>Download</LocalizedText>
            </Button>
            <MaterialShareButton title={item.title} token={token} />
          </div>
        </section>
        <section className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 p-6">
          <h2 className="font-heading text-xl font-semibold">
            <LocalizedText>Keep your class in one place.</LocalizedText>
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            <LocalizedText>Explore DarasaX for notes, timetables and coursework. Student workspace registration is currently available for DIT BENG24COE, Year 3, Semester 1.</LocalizedText>
          </p>
          <Button href="/signup" className="mt-5">
            <LocalizedText>Join DarasaX</LocalizedText>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </section>
      </main>
    </div>
  );
}
