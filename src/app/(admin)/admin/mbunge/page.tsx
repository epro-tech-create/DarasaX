"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StaffModal } from "@/components/staff/staff-modal";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import { createClient } from "@/lib/supabase/client";

type Appointment = { student_id: string; name: string | null; email: string | null; class_name: string; appointed_at: string; revoked_at: string | null };
export default function MbungeAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [removing, setRemoving] = useState<Appointment | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    const { data, error } = await createClient().rpc("list_mbunge_appointments");
    if (error) { setError("Could not load Mbunge appointments. The Mbunge database migration must be installed before this feature can be used."); setReady(true); return; }
    setAppointments(Array.isArray(data) ? data as Appointment[] : []); setError(""); setReady(true);
  }, []);
  useEffect(() => { void refresh(); window.addEventListener("focus", refresh); return () => window.removeEventListener("focus", refresh); }, [refresh]);
  async function appoint(e: FormEvent) {
    e.preventDefault(); if (busy) return; setBusy(true); setError(""); setMessage("");
    const { error } = await createClient().rpc("appoint_mbunge", { student_email: email.trim() });
    if (error) setError(error.message);
    else { setEmail(""); setOpen(false); setMessage("Mbunge appointed. The student keeps their normal login and dashboard."); await refresh(); }
    setBusy(false);
  }
  async function revoke() {
    if (!removing || busy) return; setBusy(true); setError(""); setMessage("");
    const { error } = await createClient().rpc("revoke_mbunge", { target_student: removing.student_id });
    if (error) setError(error.message);
    else { setRemoving(null); setMessage("Mbunge access removed. The student account remains active."); await refresh(); }
    setBusy(false);
  }
  const active = appointments.filter(a => !a.revoked_at);
  return <div className="space-y-5"><PageHeader title="Mbunge" description="Appoint an existing student to coordinate announcements, student lists, timetables, and learning materials across classes." actions={<Button size="sm" disabled={!ready || active.length > 0 || !!error} onClick={() => { setOpen(true); setError(""); }}><Plus className="h-3.5 w-3.5" />Appoint Mbunge</Button>} />
    <div className="grid gap-2.5 sm:grid-cols-3"><StaffStatCard label="Active Mbunge" value={String(active.length)} icon={Users} tone="success" /></div>
    {error && <p role="alert" className="text-sm text-danger">{error}<button className="ml-3 underline" onClick={() => void refresh()}>Retry</button></p>}{message && <p role="status" className="text-sm text-success">{message}</p>}
    <StaffSection title="Mbunge directory" description="The appointment adds tools to the student portal. It does not create a CR account.">{!ready ? <p role="status">Loading appointments…</p> : appointments.length === 0 ? <p className="text-sm text-muted-foreground">No Mbunge appointed yet.</p> : <div className="space-y-2">{appointments.map(a => <div key={a.student_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-3"><div><div className="flex items-center gap-2"><p className="text-[13px] font-semibold">{a.name || "Student"}</p><Badge tone={a.revoked_at ? "default" : "success"}>{a.revoked_at ? "Removed" : "Active"}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{a.class_name} · {a.email}</p><p className="mt-1 text-xs text-muted-foreground">Appointed {new Date(a.appointed_at).toLocaleDateString("en-GB", { timeZone: "Africa/Dar_es_Salaam" })}</p></div>{!a.revoked_at && <Button variant="outline" size="sm" disabled={busy} onClick={() => { setRemoving(a); setError(""); }}>Remove appointment</Button>}</div>)}</div>}</StaffSection>
    <StaffModal open={open} onClose={() => { if (!busy) setOpen(false); }} title="Appoint Mbunge" description="Enter the registered email of a verified, approved student. They keep their class and existing student account."><form onSubmit={appoint} className="space-y-4"><label className="block text-sm">Student email<input type="email" required autoComplete="off" maxLength={254} className="focus-ring mt-1 h-11 w-full rounded-xl border border-border bg-background px-3" value={email} onChange={e => setEmail(e.target.value)} /></label>{error && <p role="alert" className="text-sm text-danger">{error}</p>}<Button disabled={busy || !email.trim()}>{busy ? "Appointing…" : "Appoint Mbunge"}</Button></form></StaffModal>
    <StaffModal open={!!removing} onClose={() => { if (!busy) setRemoving(null); }} title="Remove Mbunge appointment?" description={`${removing?.name || "This student"} will lose the management tools and keep their normal student account.`}>{error && <p role="alert" className="mb-3 text-sm text-danger">{error}</p>}<div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setRemoving(null)}>Cancel</Button><Button variant="danger" disabled={busy} onClick={() => void revoke()}>{busy ? "Removing…" : "Remove appointment"}</Button></div></StaffModal>
  </div>;
}
