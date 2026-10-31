"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LifeBuoy, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useTranslate } from "@/components/providers/language-provider";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Request = Database["public"]["Tables"]["helpdesk_requests"]["Row"];
const pageSize = 20;
const inputClass = "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus-ring";

function AdminResponse({ request, onSaved }: { request: Request; onSaved: () => void }) {
  const t = useTranslate();
  const [reply, setReply] = useState(request.admin_reply);
  const [status, setStatus] = useState(request.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const { error } = await createClient().from("helpdesk_requests")
        .update({ admin_reply: reply.trim(), status }).eq("id", request.id).select("id").single();
      if (error) throw error;
      onSaved();
    } catch { setError("Could not save the response. Please try again."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={save} className="mt-4 space-y-3 border-t border-border pt-3">
    <label className="block text-xs font-medium">{t("Admin response")}<textarea value={reply} onChange={e => setReply(e.target.value)} maxLength={3000} rows={3} disabled={busy} className={inputClass} /></label>
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-xs font-medium">{t("Status")}<select value={status} onChange={e => setStatus(e.target.value as Request["status"])} disabled={busy} className={inputClass}><option value="open">{t("Open request")}</option><option value="resolved">{t("Resolved")}</option></select></label>
      <Button type="submit" disabled={busy}>{t(busy ? "Saving…" : "Save response")}</Button>
    </div>
    {error ? <p role="alert" className="text-xs text-danger">{t(error)}</p> : null}
  </form>;
}

export function Helpdesk({ admin = false }: { admin?: boolean }) {
  const t = useTranslate();
  const [page, setPage] = useState(0);
  const [version, setVersion] = useState(0);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
  const key = `${page}:${version}:${filter}`;
  const [result, setResult] = useState<{ key: string; rows: Request[]; count: number; error: string }>({ key: "", rows: [], count: 0, error: "" });
  const loading = result.key !== key;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const refresh = () => setVersion(value => value + 1);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = createClient();
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) throw new Error("Sign in required");
        let query = client.from("helpdesk_requests").select("*", { count: "exact" });
        if (!admin) query = query.eq("user_id", user.id);
        if (filter !== "all") query = query.eq("status", filter);
        const { data, count, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1);
        if (error) throw error;
        if (!cancelled) setResult({ key, rows: data ?? [], count: count ?? 0, error: "" });
      } catch {
        if (!cancelled) setResult({ key, rows: [], count: 0, error: "Could not load helpdesk messages. Please try again." });
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [admin, page, filter, key]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const sender_name = String(values.get("name") ?? "").trim();
    const subject = String(values.get("subject") ?? "").trim();
    const message = String(values.get("message") ?? "").trim();
    const category = String(values.get("category")) as Request["category"];
    setSuccess(""); setError("");
    if (!sender_name || !subject || !message) { setError("Please fill in your name, subject, and message."); return; }
    setBusy(true);
    try {
      const client = createClient();
      const { data: { user }, error: authError } = await client.auth.getUser();
      if (authError || !user) throw new Error("Sign in required");
      const { error } = await client.from("helpdesk_requests").insert({ user_id: user.id, sender_name, category, subject, message });
      if (error) throw error;
      form.reset(); setPage(0); setFilter("all"); refresh();
      setSuccess("Your message has been sent to the admins. Check here for their response.");
    } catch { setError("Could not send your message. Please try again."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-5">
    <PageHeader title={t("Helpdesk")} description={t(admin ? "Read private questions, feedback, and reviews. Reply and resolve requests." : "Ask a question, share feedback, or leave a review. Only you and admins can see your messages.")} />
    {!admin ? <form onSubmit={submit} className="surface space-y-4 rounded-2xl p-4 sm:p-5">
      <h2 className="flex items-center gap-2 font-semibold"><LifeBuoy className="h-4 w-4 text-primary" aria-hidden />{t("Send a message")}</h2>
      <fieldset disabled={busy} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">{t("Your name")}<input name="name" required maxLength={100} autoComplete="name" className={inputClass} /></label>
          <label className="block text-sm font-medium">{t("Message type")}<select name="category" className={inputClass}><option value="question">{t("Question")}</option><option value="feedback">{t("Feedback")}</option><option value="review">{t("Review")}</option></select></label>
        </div>
        <label className="block text-sm font-medium">{t("Subject")}<input name="subject" required maxLength={150} className={inputClass} /></label>
        <label className="block text-sm font-medium">{t("Message")}<textarea name="message" required maxLength={3000} rows={5} className={inputClass} /></label>
        <Button type="submit" disabled={busy}>{t(busy ? "Sending…" : "Submit message")}</Button>
      </fieldset>
      {error ? <p role="alert" className="text-sm text-danger">{t(error)}</p> : null}
      {success ? <p role="status" className="text-sm text-primary">{t(success)}</p> : null}
    </form> : null}

    <section className="space-y-3" aria-label={t(admin ? "Helpdesk inbox" : "Your messages")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold">{t(admin ? "Helpdesk inbox" : "Your messages")}</h2>
        <div className="flex items-center gap-2">
          <select aria-label={t("Filter status")} value={filter} onChange={e => { setFilter(e.target.value as typeof filter); setPage(0); }} className="rounded-xl border border-border bg-background p-2 text-sm"><option value="all">{t("All statuses")}</option><option value="open">{t("Open request")}</option><option value="resolved">{t("Resolved")}</option></select>
          <Button variant="outline" disabled={loading} onClick={refresh}>{t("Refresh")}</Button>
        </div>
      </div>
      {loading ? <p role="status" className="py-6 text-center text-sm text-muted-foreground">{t("Loading messages…")}</p> : result.error ? <p role="alert" className="text-sm text-danger">{t(result.error)}</p> : result.rows.length === 0 ? <div className="surface rounded-2xl p-8 text-center text-muted-foreground"><MessageSquare className="mx-auto mb-2 h-6 w-6" aria-hidden /><p>{t("No messages yet.")}</p></div> : result.rows.map(request => <article key={request.id} className="surface rounded-2xl p-4 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-md bg-primary/10 px-2 py-1 font-semibold text-primary">{t(request.category === "question" ? "Question" : request.category === "feedback" ? "Feedback" : "Review")}</span>
          <span className="font-medium text-primary">{t(request.status === "resolved" ? "Resolved" : "Open request")}</span>
          <time dateTime={request.created_at} className="text-muted-foreground">{new Date(request.created_at).toLocaleString(t.locale, { timeZone: "Africa/Dar_es_Salaam", dateStyle: "medium", timeStyle: "short" })}</time>
        </div>
        <h3 className="break-words font-semibold">{request.subject}</h3>
        {admin ? <p className="mt-1 break-words text-xs text-muted-foreground">{request.sender_name} · {request.user_id}</p> : null}
        <p className="mt-2 whitespace-pre-wrap break-words text-sm">{request.message}</p>
        {admin ? <AdminResponse key={`${request.id}:${request.admin_reply}:${request.status}`} request={request} onSaved={refresh} /> : request.admin_reply ? <div className="mt-4 rounded-xl bg-primary/5 p-3"><p className="text-xs font-semibold text-primary">{t("Admin response")}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm">{request.admin_reply}</p></div> : null}
      </article>)}
      <nav aria-label={t("Helpdesk pages")} className="flex justify-between gap-3">
        <Button variant="outline" disabled={loading || page === 0} onClick={() => setPage(value => value - 1)}>{t("Previous")}</Button>
        <Button variant="outline" disabled={loading || !!result.error || (page + 1) * pageSize >= result.count} onClick={() => setPage(value => value + 1)}>{t("Next")}</Button>
      </nav>
    </section>
  </div>;
}
