"use client";

import { useCallback, useEffect, useState } from "react";
import { monitoredStudents as seedStudents } from "@/data/staff-mock";
import { classStreams } from "@/data/mock";
import type {
  AuditAction,
  AuditLogEntry,
  ClassRepAccount,
  ClassStreamId,
  StudentMonitor,
} from "@/types";

const STUDENTS_KEY = "darasax-admin-students-v1";
const CRS_KEY = "darasax-admin-crs-v1";
const AUDIT_KEY = "darasax-admin-audit-v1";

const seedCRs: ClassRepAccount[] = [
  {
    id: "cr-1",
    name: "Amina Hassan",
    email: "amina.cr@student.dit.ac.tz",
    streamId: "BENG24COE-1",
    phone: "+255 712 000 111",
    status: "active",
    appointedAt: "2026-08-20T10:00:00",
  },
  {
    id: "cr-2",
    name: "James Mwita",
    email: "james.cr@student.dit.ac.tz",
    streamId: "BENG24COE-2",
    phone: "+255 713 000 222",
    status: "active",
    appointedAt: "2026-08-21T10:00:00",
  },
  {
    id: "cr-3",
    name: "Neema Said",
    email: "neema.cr@student.dit.ac.tz",
    streamId: "BENG24COE-3",
    status: "active",
    appointedAt: "2026-08-22T10:00:00",
  },
];

const seedAudit: AuditLogEntry[] = [
  {
    id: "aud-1",
    at: "2026-09-18T09:12:00",
    actor: "Admin Desk",
    role: "admin",
    action: "upload",
    summary: "Published DSA CAT 2025 past paper",
    detail: "Visible to all streams",
  },
  {
    id: "aud-2",
    at: "2026-09-18T08:40:00",
    actor: "Amina Hassan",
    role: "class_rep",
    action: "upload",
    summary: "Shared Sensor Networks notes",
    streamId: "BENG24COE-1",
  },
  {
    id: "aud-3",
    at: "2026-09-17T16:05:00",
    actor: "Admin Desk",
    role: "admin",
    action: "timetable_edit",
    summary: "Moved Electronics Lab to Lab 05",
    streamId: "BENG24COE-4",
  },
  {
    id: "aud-4",
    at: "2026-09-17T11:20:00",
    actor: "Admin Desk",
    role: "admin",
    action: "issue_update",
    summary: "Marked Lab 03 clash as in progress",
    streamId: "BENG24COE-3",
  },
  {
    id: "aud-5",
    at: "2026-09-16T10:00:00",
    actor: "system",
    role: "system",
    action: "login",
    summary: "Failed login attempts blocked (2)",
    detail: "IP range throttled",
  },
  {
    id: "aud-6",
    at: "2026-09-15T14:30:00",
    actor: "Admin Desk",
    role: "admin",
    action: "cr_add",
    summary: "Appointed Neema Said as CR",
    streamId: "BENG24COE-3",
  },
];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T, event: string) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(event));
}

function pushAudit(
  entry: Omit<AuditLogEntry, "id" | "at"> & { at?: string },
) {
  const logs = readJson(AUDIT_KEY, seedAudit);
  const next: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    at: entry.at ?? new Date().toISOString(),
    actor: entry.actor,
    role: entry.role,
    action: entry.action,
    summary: entry.summary,
    detail: entry.detail,
    streamId: entry.streamId,
  };
  writeJson(AUDIT_KEY, [next, ...logs], "darasax:audit");
  return next;
}

export type StudentInput = {
  name: string;
  email: string;
  streamId: ClassStreamId;
  year?: number;
  risk?: StudentMonitor["risk"];
  attendancePct?: number;
};

export type ClassRepInput = {
  name: string;
  email: string;
  streamId: ClassStreamId;
  phone?: string;
  status?: ClassRepAccount["status"];
};

export function useAdminPeopleStore() {
  const [students, setStudents] = useState<StudentMonitor[]>(seedStudents);
  const [classReps, setClassReps] = useState<ClassRepAccount[]>(seedCRs);
  const [audit, setAudit] = useState<AuditLogEntry[]>(seedAudit);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setStudents(readJson(STUDENTS_KEY, seedStudents));
    setClassReps(readJson(CRS_KEY, seedCRs));
    setAudit(readJson(AUDIT_KEY, seedAudit));
    setReady(true);
    const sync = () => {
      setStudents(readJson(STUDENTS_KEY, seedStudents));
      setClassReps(readJson(CRS_KEY, seedCRs));
      setAudit(readJson(AUDIT_KEY, seedAudit));
    };
    window.addEventListener("storage", sync);
    window.addEventListener("darasax:people", sync);
    window.addEventListener("darasax:audit", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("darasax:people", sync);
      window.removeEventListener("darasax:audit", sync);
    };
  }, []);

  const log = useCallback(
    (input: {
      actor?: string;
      role?: AuditLogEntry["role"];
      action: AuditAction;
      summary: string;
      detail?: string;
      streamId?: ClassStreamId;
    }) => {
      const entry = pushAudit({
        actor: input.actor ?? "Admin Desk",
        role: input.role ?? "admin",
        action: input.action,
        summary: input.summary,
        detail: input.detail,
        streamId: input.streamId,
      });
      setAudit((prev) => [entry, ...prev]);
      return entry;
    },
    [],
  );

  const addStudent = useCallback(
    (
      input: StudentInput,
      meta?: { actor?: string; role?: AuditLogEntry["role"] },
    ) => {
      const student: StudentMonitor = {
        id: `st-${Date.now()}`,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        streamId: input.streamId,
        year: input.year ?? 3,
        attendancePct: input.attendancePct ?? 100,
        assignmentsDone: 0,
        assignmentsTotal: 5,
        lastActive: new Date().toISOString(),
        risk: input.risk ?? "low",
      };
      setStudents((prev) => {
        const next = [student, ...prev];
        writeJson(STUDENTS_KEY, next, "darasax:people");
        return next;
      });
      log({
        actor: meta?.actor,
        role: meta?.role,
        action: "student_add",
        summary: `Added student ${student.name}`,
        detail: student.email,
        streamId: student.streamId,
      });
      return student;
    },
    [log],
  );

  const updateStudent = useCallback(
    (
      id: string,
      patch: Partial<Omit<StudentMonitor, "id">>,
      meta?: { actor?: string; role?: AuditLogEntry["role"] },
    ) => {
      const current = readJson(STUDENTS_KEY, seedStudents);
      const existing = current.find((s) => s.id === id);
      if (!existing) return undefined;
      const updated: StudentMonitor = {
        ...existing,
        ...patch,
        name: patch.name?.trim() ?? existing.name,
        email: patch.email?.trim().toLowerCase() ?? existing.email,
      };
      const next = current.map((s) => (s.id === id ? updated : s));
      writeJson(STUDENTS_KEY, next, "darasax:people");
      setStudents(next);
      log({
        actor: meta?.actor,
        role: meta?.role,
        action: "student_update",
        summary: `Updated student ${updated.name}`,
        detail: updated.email,
        streamId: updated.streamId,
      });
      return updated;
    },
    [log],
  );

  const deleteStudent = useCallback(
    (
      id: string,
      meta?: { actor?: string; role?: AuditLogEntry["role"] },
    ) => {
      const current = readJson(STUDENTS_KEY, seedStudents);
      const removed = current.find((s) => s.id === id);
      if (!removed) return;
      const next = current.filter((s) => s.id !== id);
      writeJson(STUDENTS_KEY, next, "darasax:people");
      setStudents(next);
      log({
        actor: meta?.actor,
        role: meta?.role,
        action: "student_delete",
        summary: `Removed student ${removed.name}`,
        detail: removed.email,
        streamId: removed.streamId,
      });
    },
    [log],
  );

  const updateStudentRisk = useCallback(
    (id: string, risk: StudentMonitor["risk"]) => {
      updateStudent(id, { risk });
    },
    [updateStudent],
  );

  const addClassRep = useCallback(
    (input: ClassRepInput) => {
      const streamTaken = readJson(CRS_KEY, seedCRs).find(
        (c) => c.streamId === input.streamId && c.status === "active",
      );
      const cr: ClassRepAccount = {
        id: `cr-${Date.now()}`,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        streamId: input.streamId,
        phone: input.phone?.trim() || undefined,
        status: input.status ?? "active",
        appointedAt: new Date().toISOString(),
      };
      setClassReps((prev) => {
        const demoted =
          cr.status === "active"
            ? prev.map((c) =>
                c.streamId === cr.streamId && c.status === "active"
                  ? { ...c, status: "inactive" as const }
                  : c,
              )
            : prev;
        const next = [cr, ...demoted];
        writeJson(CRS_KEY, next, "darasax:people");
        return next;
      });
      log({
        action: "cr_add",
        summary: `Appointed ${cr.name} as CR for ${cr.streamId}`,
        detail: streamTaken ? `Replaced ${streamTaken.name}` : cr.email,
        streamId: cr.streamId,
      });
      return cr;
    },
    [log],
  );

  const updateClassRep = useCallback(
    (id: string, patch: Partial<Omit<ClassRepAccount, "id" | "appointedAt">>) => {
      const current = readJson(CRS_KEY, seedCRs);
      const target = current.find((c) => c.id === id);
      if (!target) return undefined;
      const updated: ClassRepAccount = {
        ...target,
        ...patch,
        name: patch.name?.trim() ?? target.name,
        email: patch.email?.trim().toLowerCase() ?? target.email,
        phone:
          patch.phone !== undefined
            ? patch.phone.trim() || undefined
            : target.phone,
      };
      const nextStatus = updated.status;
      const nextStream = updated.streamId;
      let next = current.map((c) => (c.id === id ? updated : c));
      if (nextStatus === "active") {
        next = next.map((c) =>
          c.id !== id && c.streamId === nextStream && c.status === "active"
            ? { ...c, status: "inactive" as const }
            : c,
        );
      }
      writeJson(CRS_KEY, next, "darasax:people");
      setClassReps(next);
      log({
        action: "cr_update",
        summary: `Updated CR ${updated.name}`,
        detail: updated.email,
        streamId: updated.streamId,
      });
      return updated;
    },
    [log],
  );

  const deleteClassRep = useCallback(
    (id: string) => {
      const current = readJson(CRS_KEY, seedCRs);
      const removed = current.find((c) => c.id === id);
      if (!removed) return;
      const next = current.filter((c) => c.id !== id);
      writeJson(CRS_KEY, next, "darasax:people");
      setClassReps(next);
      log({
        action: "cr_delete",
        summary: `Removed CR ${removed.name}`,
        detail: removed.email,
        streamId: removed.streamId,
      });
    },
    [log],
  );

  const setClassRepStatus = useCallback(
    (id: string, status: ClassRepAccount["status"]) => {
      updateClassRep(id, { status });
    },
    [updateClassRep],
  );

  const streamsWithoutCr = classStreams.filter(
    (s) => !classReps.some((c) => c.streamId === s.id && c.status === "active"),
  );

  const studentsForStream = useCallback(
    (streamId: ClassStreamId) => students.filter((s) => s.streamId === streamId),
    [students],
  );

  return {
    ready,
    students,
    classReps,
    audit,
    streamsWithoutCr,
    studentsForStream,
    addStudent,
    updateStudent,
    deleteStudent,
    updateStudentRisk,
    addClassRep,
    updateClassRep,
    deleteClassRep,
    setClassRepStatus,
    log,
  };
}
