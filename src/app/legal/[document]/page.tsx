import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { policies } from "@/data/policies";
import { APP_HOME, getAppRole, roleFromHost } from "@/lib/app-role";

function findPolicy(document: string) {
  if (document !== "privacy" && document !== "terms" && document !== "security") notFound();
  return policies[document];
}

export async function generateMetadata({ params }: { params: Promise<{ document: string }> }): Promise<Metadata> {
  const policy = findPolicy((await params).document);
  return { title: policy.title, description: policy.summary };
}

export default async function PolicyPage({ params }: { params: Promise<{ document: string }> }) {
  const { document } = await params;
  const policy = findPolicy(document);
  const role = roleFromHost((await headers()).get("host")) ?? getAppRole();
  const home = APP_HOME[role];
  const helpdesk = role === "student" ? "/helpdesk" : `${home}/helpdesk`;

  return <main className="mx-auto min-h-dvh w-full max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <Link href={home} className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-lg text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" aria-hidden />Back to portal</Link>
      <span className="flex items-center gap-2 font-heading text-lg font-semibold"><ShieldCheck className="h-5 w-5 text-primary" aria-hidden />DarasaX</span>
    </header>
    <nav aria-label="Policies" className="mb-8 flex flex-wrap gap-2">
      {Object.entries(policies).map(([key, item]) => <Link key={key} href={`/legal/${key}`} aria-current={document === key ? "page" : undefined} className={`focus-ring inline-flex min-h-11 items-center rounded-xl border px-4 py-2 text-sm ${document === key ? "border-primary/30 bg-primary/10 font-semibold text-primary" : "border-border hover:bg-muted"}`}>{item.title}</Link>)}
    </nav>
    <article lang="en" className="surface rounded-2xl border border-border p-5 sm:p-9">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">Your trust matters</p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{policy.title}</h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">{policy.summary}</p>
      <p className="mt-4 text-xs text-muted-foreground">Effective <time dateTime="2026-11-04">4 November 2026</time> · Applies to all DarasaX portals</p>
      <div className="mt-8 space-y-8">
        {policy.sections.map((section, index) => <section key={section.title} aria-labelledby={`section-${index}`}>
          <h2 id={`section-${index}`} className="font-heading text-lg font-semibold">{section.title}</h2>
          {section.paragraphs.map(paragraph => <p key={paragraph} className="mt-3 text-sm leading-7 text-muted-foreground">{paragraph}</p>)}
        </section>)}
      </div>
    </article>
    <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-5 text-sm">
      <p className="text-muted-foreground">Have a privacy or security concern?</p>
      <a href="mailto:eprocreativ12@gmail.com" className="focus-ring break-all rounded underline underline-offset-4">eprocreativ12@gmail.com</a>
      <Link href={helpdesk} className="focus-ring inline-flex min-h-11 items-center rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground">Contact Helpdesk</Link>
      <a href="https://www.pdpc.go.tz/" target="_blank" rel="noopener noreferrer" className="focus-ring rounded text-sm underline underline-offset-4">Tanzania PDPC (opens in a new tab)</a>
    </footer>
  </main>;
}
