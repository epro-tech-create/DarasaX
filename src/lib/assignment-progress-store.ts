"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Assignment, AssignmentStatus } from "@/types";
import { useMaterialsStore } from "@/lib/materials-store";
import { useStudentProfile } from "@/components/providers/student-profile-provider";

export function useAssignments() {
  const { profile } = useStudentProfile();
  const { published, ready, refresh } = useMaterialsStore();
  const key = profile ? `darasax_assignments_${profile.id}` : null;
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const update = () => setTick((previous) => previous + 1);
    window.addEventListener("storage", update);
    window.addEventListener("darasax:assignments", update);
    return () => { window.removeEventListener("storage", update); window.removeEventListener("darasax:assignments", update); };
  }, []);
  const items = useMemo<Assignment[]>(() => {
    void tick;
    let progress: Record<string, AssignmentStatus> = {};
    try { if (key && typeof window !== "undefined") progress = JSON.parse(localStorage.getItem(key) || "{}"); } catch { /* Ignore invalid personal preferences. */ }
    return published.filter((item) => item.kind === "assignment" && item.moduleId).map((item) => ({
      id: item.id, moduleId: item.moduleId!, title: item.title, description: item.body || "Open the attached coursework file for the full assignment.",
      lecturer: item.uploadedBy, deadline: item.dueAt || "", priority: "medium", status: progress[item.id] || "upcoming",
      instructions: item.body || "Follow the instructions in the published assignment file.", attachedFiles: [], relatedResourceIds: [], material: item,
    }));
  }, [published, key, tick]);
  const setStatus = useCallback((id: string, status: AssignmentStatus) => {
    if (!key) return;
    let progress = {};
    try { progress = JSON.parse(localStorage.getItem(key) || "{}"); } catch { /* Start clean. */ }
    localStorage.setItem(key, JSON.stringify({ ...progress, [id]: status }));
    window.dispatchEvent(new Event("darasax:assignments"));
  }, [key]);
  const markCompleted = useCallback((id: string) => setStatus(id, "completed"), [setStatus]);
  return { items, ready, refresh, setStatus, markCompleted };
}
