"use client";
import { useCallback, useEffect, useState } from "react";
import { Globe, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import { Button } from "@/components/ui/button";

type Day = { day: string; visitors: number };
export function SiteVisitorAnalytics() {
  const [days, setDays] = useState<Day[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const refresh = useCallback(async () => {
    const { data, error } = await createClient().rpc("site_visitor_summary");
    if (error || !data) { setState("error"); return; }
    setDays(data as unknown as Day[]); setState("ready");
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    const poll = setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 60000);
    const onFocus = () => void refresh(); window.addEventListener("focus", onFocus);
    return () => { clearTimeout(timer); clearInterval(poll); window.removeEventListener("focus", onFocus); };
  }, [refresh]);
  const today = days.at(-1)?.visitors ?? 0;
  const max = Math.max(1, ...days.map(day => day.visitors));
  return <StaffSection title="Website visitors" description="Daily unique IP estimates · Tanzania time · includes visitors who have not signed in">
    {state === "error" ? <div role="alert"><p className="mb-3 text-sm">Could not load visitor counts.</p><Button onClick={() => void refresh()} variant="outline" size="sm">Retry</Button></div>
      : state === "loading" ? <p role="status" className="text-sm text-muted-foreground">Loading visitors…</p> : <>
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <StaffStatCard label="Visitors today" value={String(today)} icon={Globe} />
          <StaffStatCard label="Daily visitors · last 14 days" value={String(days.reduce((sum, day) => sum + day.visitors, 0))} icon={Users} hint="Returning visitors count again on a new day" />
        </div>
        <div className="space-y-2" aria-label="Daily website visitor counts">
          {days.slice().reverse().map(day => <div key={day.day} className="flex items-center gap-3 text-xs">
            <span className="w-24 shrink-0">{new Date(`${day.day}T12:00:00+03:00`).toLocaleDateString("en-GB", { timeZone: "Africa/Dar_es_Salaam", day: "numeric", month: "short" })}</span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-primary/10"><div className="h-full rounded-full bg-primary" style={{ width: `${day.visitors / max * 100}%` }} /></div>
            <span className="w-10 text-right tabular-nums">{day.visitors}</span>
          </div>)}
        </div>
      </>}
    <p className="mt-4 text-xs leading-relaxed text-muted-foreground">One IP counts once per day. Shared networks can undercount people; changing networks can overcount them. Raw IPs are not stored. Counts start with this update and include only browser visits that reach tracking.</p>
  </StaffSection>;
}
