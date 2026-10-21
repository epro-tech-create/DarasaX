"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useTranslate } from "@/components/providers/language-provider";
import { createClient } from "@/lib/supabase/client";

export type LecturerApplication = { user_id: string; name: string | null; email: string; status: string; submitted_at: string; verified_at: string | null };
export function LecturerApplications({ rows }: { rows: LecturerApplication[] }) {
  const t = useTranslate();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, startTransition] = useTransition();
  const [error, setError] = useState("");
  async function review(id: string, decision: "approve" | "reject") {
    if (busy || refreshing) return;
    setBusy(id); setError("");
    try {
      const { error: reviewError } = await createClient().rpc("review_lecturer_application", { applicant_id: id, decision });
      if (reviewError) throw reviewError;
      startTransition(() => router.refresh());
    } catch { setError("Could not review the application. Refresh and try again."); }
    finally { setBusy(null); }
  }
  return <div className="space-y-5"><PageHeader title={t("Lecturers")} description={t("Approve verified lecturer accounts before they can access their workspace.")} />
    {error && <p role="alert" className="text-sm text-danger">{t(error)}</p>}
    <section className="surface overflow-x-auto rounded-2xl"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b border-border bg-muted/40"><tr>{["Full Name", "Email", "Email verification", "Status", "Actions"].map(label => <th key={label} className="px-4 py-3 font-medium">{t(label)}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.user_id} className="border-b border-border last:border-0"><td className="px-4 py-4">{row.name || t("Not provided")}</td><td className="break-all px-4 py-4">{row.email}</td><td className="px-4 py-4">{t(row.verified_at ? "Verified" : "Not verified")}</td><td className="px-4 py-4">{t(row.status === "pending" ? "Pending approval" : row.status === "approved" ? "Approved" : row.status === "rejected" ? "Rejected" : "Inactive")}</td><td className="px-4 py-4">{row.status === "pending" && <div className="flex gap-2"><Button size="sm" disabled={Boolean(busy) || refreshing || !row.verified_at} onClick={() => void review(row.user_id, "approve")}>{t(busy === row.user_id ? "Saving..." : "Approve")}</Button><Button size="sm" variant="outline" disabled={Boolean(busy) || refreshing} onClick={() => void review(row.user_id, "reject")}>{t("Reject")}</Button></div>}</td></tr>)}{!rows.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">{t("No lecturer applications yet.")}</td></tr>}</tbody>
    </table></section>
  </div>;
}
