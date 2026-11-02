"use client";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { StaffSection } from "@/components/staff/staff-ui";
import { useClassRegistry } from "@/lib/class-registry";
import { createClient } from "@/lib/supabase/client";

type Student = { id: string; name: string | null; email: string | null; registration_number: string | null; class_name: string };
export default function Page() {
  const { streams, error: classesError } = useClassRegistry();
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState("all");
  const [search, setSearch] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    const { data, error } = await createClient().rpc("mbunge_students");
    if (error) { setStudents([]); setError("Could not load students. Check your appointment and try again."); }
    else { setStudents(Array.isArray(data) ? data as Student[] : []); setError(""); }
    setReady(true);
  }, []);
  useEffect(() => { void refresh(); window.addEventListener("focus", refresh); return () => window.removeEventListener("focus", refresh); }, [refresh]);
  const filtered = students.filter(s => (selected === "all" || s.class_name === selected) && `${s.name || ""} ${s.email || ""} ${s.registration_number || ""}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-5"><PageHeader title="Student list" description="View approved students across classes." /><div className="flex flex-wrap gap-3"><select aria-label="Class" value={selected} onChange={e => setSelected(e.target.value)} className="focus-ring h-11 rounded-xl border border-border bg-background px-3"><option value="all">All classes</option>{streams.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select><input aria-label="Search students" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, email, or registration number" className="focus-ring h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm" /></div>{(error || classesError) && <p role="alert" className="text-sm text-danger">{error || classesError}<button className="ml-3 underline" onClick={() => void refresh()}>Retry</button></p>}<StaffSection title="Student directory" description={`${filtered.length} students`}>{!ready ? <p role="status">Loading students…</p> : !filtered.length ? <p className="text-sm text-muted-foreground">No students match this selection.</p> : <div className="space-y-2">{filtered.map(s => <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 p-3"><div><p className="text-[13px] font-semibold">{s.name || "Student"}</p><p className="mt-1 break-all text-xs text-muted-foreground">{s.email}</p></div><div className="text-xs text-muted-foreground"><p>{s.class_name}</p><p className="mt-1">{s.registration_number || "No registration number"}</p></div></div>)}</div>}</StaffSection></div>;
}
