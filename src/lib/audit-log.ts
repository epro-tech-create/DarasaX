"use client";

import { createClient } from "@/lib/supabase/client";
import type { AuditAction, ClassStreamId } from "@/types";

export async function recordAudit(input: {
  action: AuditAction;
  summary: string;
  detail?: string;
  actor?: string;
  role?: string;
  streamId?: ClassStreamId | string | null;
}) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let actor = input.actor?.trim() || "";
    let role = input.role?.trim() || "";

    if (!actor || !role) {
      const { data: staff } = await supabase
        .from("staff_profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle();
      if (staff) {
        actor = actor || staff.full_name || user.email || "Staff";
        role = role || staff.role;
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();
        actor = actor || profile?.full_name || user.email || "Student";
        role = role || "student";
      }
    }

    const { error } = await supabase.from("audit_log").insert({
      actor,
      role,
      action: input.action,
      summary: input.summary,
      detail: input.detail ?? null,
      stream_id: input.streamId ?? null,
      actor_id: user.id,
    });
    if (error) {
      console.warn("Audit log was not saved.", error.message);
    }
  } catch (err) {
    console.warn("Audit log was not saved.", err);
  }
}
