"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { classStreams } from "@/data/mock";
import type {
  AuditLogRow,
  Database,
  MonitoredStudentRow,
  StaffProfile,
} from "@/types/database";
import type {
  AuditAction,
  AuditLogEntry,
  ClassRepAccount,
  ClassStreamId,
  StaffRole,
  StudentMonitor,
} from "@/types";

function isConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function toStudent(row: MonitoredStudentRow): StudentMonitor {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    streamId: row.stream_id as ClassStreamId,
    year: row.year,
    attendancePct: Number(row.attendance_pct),
    assignmentsDone: row.assignments_done,
    assignmentsTotal: row.assignments_total,
    lastActive: row.last_active,
    risk: row.risk as StudentMonitor["risk"],
  };
}

function toClassRep(row: StaffProfile): ClassRepAccount {
  return {
    id: row.id,
    name: row.full_name ?? "Class Rep",
    email: row.email ?? "",
    streamId: (row.stream_id ?? "BENG24COE-1") as ClassStreamId,
    phone: row.phone ?? undefined,
    status: row.status === "inactive" ? "inactive" : "active",
    appointedAt: row.created_at,
  };
}

function toAudit(row: AuditLogRow): AuditLogEntry {
  return {
    id: String(row.id),
    at: row.at,
    actor: row.actor,
    role: row.role as AuditLogEntry["role"],
    action: row.action as AuditAction,
    summary: row.summary,
    detail: row.detail ?? undefined,
    streamId: (row.stream_id as ClassStreamId | null) ?? undefined,
  };
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
  const [students, setStudents] = useState<StudentMonitor[]>([]);
  const [classReps, setClassReps] = useState<ClassRepAccount[]>([]);
  const [audit, setAudit] = useState<AuditLogEntry[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      if (!isConfigured()) {
        setStudents([]);
        setClassReps([]);
        setAudit([]);
        return;
      }
      const supabase = createClient();
      const [studentsRes, crsRes, auditRes] = await Promise.all([
        supabase
          .from("monitored_students")
          .select("*")
          .order("name"),
        supabase
          .from("staff_profiles")
          .select("*")
          .eq("role", "class_rep")
          .order("created_at"),
        supabase
          .from("audit_log")
          .select("*")
          .order("at", { ascending: false })
          .limit(200),
      ]);
      if (studentsRes.error) throw studentsRes.error;
      if (crsRes.error) throw crsRes.error;
      if (auditRes.error) throw auditRes.error;
      setStudents((studentsRes.data ?? []).map(toStudent));
      setClassReps((crsRes.data ?? []).map(toClassRep));
      setAudit((auditRes.data ?? []).map(toAudit));
    } catch {
      // Keep previously loaded data on transient failures.
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const log = useCallback(
    async (input: {
      actor?: string;
      role?: AuditLogEntry["role"];
      action: AuditAction;
      summary: string;
      detail?: string;
      streamId?: ClassStreamId;
    }) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("audit_log")
        .insert({
          actor: input.actor ?? "Admin Desk",
          role: input.role ?? "admin",
          action: input.action,
          summary: input.summary,
          detail: input.detail ?? null,
          stream_id: input.streamId ?? null,
          actor_id: user?.id ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;
      const entry = toAudit(data);
      setAudit((prev) => [entry, ...prev]);
      return entry;
    },
    [],
  );

  const addStudent = useCallback(
    async (
      input: StudentInput,
      meta?: { actor?: string; role?: AuditLogEntry["role"] },
    ) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("monitored_students")
        .insert({
          id: `st-${Date.now()}`,
          name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
          stream_id: input.streamId,
          year: input.year ?? 3,
          attendance_pct: input.attendancePct ?? 100,
          assignments_done: 0,
          assignments_total: 5,
          last_active: new Date().toISOString(),
          risk: input.risk ?? "low",
        })
        .select("*")
        .single();
      if (error) throw error;
      const student = toStudent(data);
      setStudents((prev) => [student, ...prev]);
      await log({
        actor: meta?.actor,
        role: meta?.role,
        action: "student_add",
        summary: `Added student ${student.name}`,
        detail: student.email,
        streamId: student.streamId,
      }).catch(() => null);
      return student;
    },
    [log],
  );

  const updateStudent = useCallback(
    async (
      id: string,
      patch: Partial<Omit<StudentMonitor, "id">>,
      meta?: { actor?: string; role?: AuditLogEntry["role"] },
    ) => {
      const supabase = createClient();
      const dbPatch: Database["public"]["Tables"]["monitored_students"]["Update"] = {};
      if (patch.name !== undefined) dbPatch.name = patch.name.trim();
      if (patch.email !== undefined)
        dbPatch.email = patch.email.trim().toLowerCase();
      if (patch.streamId !== undefined) dbPatch.stream_id = patch.streamId;
      if (patch.year !== undefined) dbPatch.year = patch.year;
      if (patch.attendancePct !== undefined)
        dbPatch.attendance_pct = patch.attendancePct;
      if (patch.assignmentsDone !== undefined)
        dbPatch.assignments_done = patch.assignmentsDone;
      if (patch.assignmentsTotal !== undefined)
        dbPatch.assignments_total = patch.assignmentsTotal;
      if (patch.lastActive !== undefined) dbPatch.last_active = patch.lastActive;
      if (patch.risk !== undefined) dbPatch.risk = patch.risk;
      const { data, error } = await supabase
        .from("monitored_students")
        .update(dbPatch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      const updated = toStudent(data);
      setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)));
      await log({
        actor: meta?.actor,
        role: meta?.role,
        action: "student_update",
        summary: `Updated student ${updated.name}`,
        detail: updated.email,
        streamId: updated.streamId,
      }).catch(() => null);
      return updated;
    },
    [log],
  );

  const deleteStudent = useCallback(
    async (
      id: string,
      meta?: { actor?: string; role?: AuditLogEntry["role"] },
    ) => {
      const supabase = createClient();
      const { data: removed } = await supabase
        .from("monitored_students")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      const { error } = await supabase
        .from("monitored_students")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setStudents((prev) => prev.filter((s) => s.id !== id));
      if (removed) {
        await log({
          actor: meta?.actor,
          role: meta?.role,
          action: "student_delete",
          summary: `Removed student ${removed.name}`,
          detail: removed.email,
          streamId: removed.stream_id as ClassStreamId,
        }).catch(() => null);
      }
    },
    [log],
  );

  const updateStudentRisk = useCallback(
    async (id: string, risk: StudentMonitor["risk"]) => {
      await updateStudent(id, { risk });
    },
    [updateStudent],
  );

  const addClassRep = useCallback(async (input: ClassRepInput) => {
    void input;
    // CRs own a Supabase Auth account, so only they can create their profile
    // row (RLS self-registration). Admins manage registered CRs below.
    throw new Error(
      "CRs create their own login on the Class Rep portal first — then edit their stream and status here.",
    );
  }, []);

  const updateClassRep = useCallback(
    async (
      id: string,
      patch: Partial<Omit<ClassRepAccount, "id" | "appointedAt">>,
    ) => {
      const supabase = createClient();
      const dbPatch: Database["public"]["Tables"]["staff_profiles"]["Update"] = {};
      if (patch.name !== undefined) dbPatch.full_name = patch.name.trim();
      if (patch.email !== undefined)
        dbPatch.email = patch.email.trim().toLowerCase();
      if (patch.phone !== undefined)
        dbPatch.phone = patch.phone.trim() || null;
      if (patch.streamId !== undefined) dbPatch.stream_id = patch.streamId;
      if (patch.status !== undefined) dbPatch.status = patch.status;

      // One active CR per stream: demote the others first.
      if (patch.status === "active") {
        const targetStream =
          patch.streamId ??
          classReps.find((c) => c.id === id)?.streamId ??
          null;
        if (targetStream) {
          await supabase
            .from("staff_profiles")
            .update({ status: "inactive" })
            .eq("role", "class_rep")
            .eq("stream_id", targetStream)
            .eq("status", "active")
            .neq("id", id);
        }
      }

      const { data, error } = await supabase
        .from("staff_profiles")
        .update(dbPatch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      const updated = toClassRep(data);
      setClassReps((prev) => prev.map((c) => (c.id === id ? updated : c)));
      await log({
        action: "cr_update",
        summary: `Updated CR ${updated.name}`,
        detail: updated.email,
        streamId: updated.streamId,
      }).catch(() => null);
      // Refresh to pick up demotions.
      await refresh().catch(() => null);
      return updated;
    },
    [classReps, log, refresh],
  );

  const deleteClassRep = useCallback(
    async (id: string) => {
      const supabase = createClient();
      const removed = classReps.find((c) => c.id === id);
      const { error } = await supabase
        .from("staff_profiles")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setClassReps((prev) => prev.filter((c) => c.id !== id));
      if (removed) {
        await log({
          action: "cr_delete",
          summary: `Removed CR ${removed.name}`,
          detail: removed.email,
          streamId: removed.streamId,
        }).catch(() => null);
      }
    },
    [classReps, log],
  );

  const setClassRepStatus = useCallback(
    async (id: string, status: ClassRepAccount["status"]) => {
      await updateClassRep(id, { status });
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
    refresh,
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

export type { StaffRole };
