"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StaffSection } from "@/components/staff/staff-ui";
import { useTranslate } from "@/components/providers/language-provider";
import { createClient } from "@/lib/supabase/client";
import { invalidateQueries } from "@/lib/supabase/query-cache";
type Request = { user_id: string; name: string | null; email: string | null; class_name: string; registration_number: string | null; status: string };
export function StudentApprovals() {
  const t = useTranslate();
  const [requests, setRequests] = useState<Request[]>([]);
  const [filter, setFilter] = useState("pending");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    const { data, error } = await createClient().rpc("list_student_registrations");
    if (error) setError("Could not load registrations. Please try again.");
    else { setRequests((data ?? []) as unknown as Request[]); setError(""); }
    setLoading(false);
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    const poll = setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 30000);
    return () => { clearTimeout(timer); clearInterval(poll); };
  }, [refresh]);
  async function review(id: string, decision: "approved" | "rejected" | "suspended") {
    if (busy) return;
    setBusy(id); setError("");
    try {
      const { error } = await createClient().rpc("review_student_registration", { student_id: id, decision });
      if (error) throw error;
      invalidateQueries("people");
      window.dispatchEvent(new Event("focus"));
      await refresh();
    } catch { setError("Could not update approval. Please try again."); }
    finally { setBusy(null); }
  }
  const pending = requests.filter(r => r.status === "pending").length;
  return <StaffSection title={t("Student approvals")} description={t("Approve or reject completed student registrations.")}>
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <select aria-label={t("Approval status")} value={filter} onChange={e => setFilter(e.target.value)} className="h-10 rounded-xl border border-border bg-background px-3 text-sm">
        <option value="pending">{t("Pending approval")} ({pending})</option>
        <option value="approved">{t("Approved")}</option><option value="rejected">{t("Rejected")}</option><option value="suspended">{t("Suspended")}</option>
      </select>
      <Button variant="outline" size="sm" onClick={() => void refresh()}>{t("Refresh")}</Button>
    </div>
    {error && <p role="alert" className="mb-3 text-sm text-danger">{t(error)}</p>}
    {loading ? <p className="text-sm text-muted-foreground">{t("Loading...")}</p> : <div className="space-y-3">
      {requests.filter(r => r.status === filter).map(r => <article key={r.user_id} className="flex flex-col justify-between gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 text-sm"><p className="font-semibold">{r.name || r.email}</p><p className="break-all text-muted-foreground">{r.email}</p>
          <p className="mt-1 break-all">{t("Registration number")}: {r.registration_number ?? "—"}</p><p className="text-muted-foreground">{r.class_name}</p></div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {r.status !== "approved" && <Button size="sm" disabled={!!busy} onClick={() => void review(r.user_id, "approved")}>{t(busy === r.user_id ? "Please wait..." : "Approve")}</Button>}
          {r.status === "pending" && <Button variant="outline" size="sm" disabled={!!busy} onClick={() => void review(r.user_id, "rejected")}>{t("Reject")}</Button>}
          {r.status === "approved" && <Button variant="outline" size="sm" disabled={!!busy} onClick={() => void review(r.user_id, "suspended")}>{t("Suspend access")}</Button>}
        </div>
      </article>)}
      {!requests.some(r => r.status === filter) && <p className="text-sm text-muted-foreground">{t("No registrations in this status.")}</p>}
    </div>}
  </StaffSection>;
}
