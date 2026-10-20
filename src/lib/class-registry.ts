"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cachedQuery, invalidateQueries } from "@/lib/supabase/query-cache";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { ClassStream } from "@/types";
export type AcademicClass =
  Database["public"]["Tables"]["academic_classes"]["Row"];
export const ACTIVE_INSTITUTION = "Dar es Salaam Institute of Technology (DIT)";
export const UNIVERSITIES = [
  ACTIVE_INSTITUTION,
  "University of Dar es Salaam (UDSM)",
  "University of Dodoma (UDOM)",
  "Ardhi University (ARU)",
  "Mzumbe University",
  "Sokoine University of Agriculture (SUA)",
  "Muhimbili University of Health and Allied Sciences (MUHAS)",
  "Mbeya University of Science and Technology (MUST)",
];
export function activeCohort(c: AcademicClass) {
  return (
    !c.archived &&
    c.institution === ACTIVE_INSTITUTION &&
    c.programme === "BENG24COE" &&
    c.year === 3 &&
    c.semester === 1
  );
}
export function useClassRegistry({ enabled = true }: { enabled?: boolean } = {}) {
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [ready, setReady] = useState(!enabled);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const data = await cachedQuery("classes:all", async () => {
        const { data, error } = await createClient().from("academic_classes").select("*").eq("archived", false).order("label");
        if (error) throw error;
        return data ?? [];
      });
      setClasses(data); setError("");
    } catch { setError("Could not load classes. Please try again."); }
    finally { setReady(true); }
  }, [enabled]);
  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(() => void refresh(), 0);
    const reload = () => void refresh();
    window.addEventListener("focus", reload);
    const changed = () => { invalidateQueries("classes"); void refresh(); };
    window.addEventListener("darasax:classes", changed);
    return () => {
      clearTimeout(t);
      window.removeEventListener("focus", reload);
      window.removeEventListener("darasax:classes", changed);
    };
  }, [enabled, refresh]);
  const streams = useMemo<ClassStream[]>(
    () =>
      classes.map((c) => ({
        id: c.id as ClassStream["id"],
        label: c.label,
        isEvening: c.is_evening,
        description: c.is_evening ? "Evening stream" : "Day stream",
      })),
    [classes],
  );
  return { classes, streams, ready, error, refresh };
}
