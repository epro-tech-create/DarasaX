"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { signOutAndForget } from "@/lib/auth/sign-out";
import { StaffSessionContext } from "@/lib/staff-session-context";
import { cachedQuery, invalidateQueries } from "@/lib/supabase/query-cache";
import { createClient } from "@/lib/supabase/client";
import { ensureStaffProfile, getStaffProfile } from "@/lib/auth/staff-profile";
import {
  clearActiveLecturerStream,
  getActiveLecturerStream,
  setActiveLecturerStream,
} from "@/lib/lecturer-context";
import type { ClassStreamId, StaffRole } from "@/types";
import type { StaffProfile } from "@/types/database";

const SESSION_EVENT = "darasax:staff-session";

export type StaffSession = {
  id: string;
  role: StaffRole;
  email: string;
  name: string;
  streamId: ClassStreamId | null;
  streamIds: ClassStreamId[];
  moduleIds: string[];
  onboardingCompleted: boolean;
};

function asStreamIds(profile: StaffProfile): ClassStreamId[] {
  const fromArray = (profile.stream_ids ?? []).filter(Boolean) as ClassStreamId[];
  if (fromArray.length > 0) return fromArray;
  if (profile.stream_id) return [profile.stream_id as ClassStreamId];
  return [];
}

export function toSession(profile: StaffProfile, emailFallback = ""): StaffSession {
  const streamIds = asStreamIds(profile);
  const moduleIds = Array.isArray(profile.module_ids) ? profile.module_ids : [];
  const onboarded =
    profile.role !== "lecturer"
      ? true
      : Boolean(profile.onboarding_completed) &&
        streamIds.length > 0 &&
        moduleIds.length > 0;
  return {
    id: profile.id,
    role: profile.role,
    email: profile.email ?? emailFallback,
    name: profile.full_name ?? "Staff",
    streamId: (profile.stream_id as ClassStreamId | null) ?? streamIds[0] ?? null,
    streamIds,
    moduleIds,
    onboardingCompleted: onboarded,
  };
}

function isConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Where a lecturer should land after auth (onboarding / class pick / desk). */
export function getLecturerEntryPath(session: StaffSession): string {
  if (!session.onboardingCompleted || session.streamIds.length === 0) {
    return "/lecturer/onboarding";
  }
  if (session.streamIds.length === 1) {
    setActiveLecturerStream(session.streamIds[0]);
    return "/lecturer";
  }
  const active = getActiveLecturerStream();
  if (active && session.streamIds.includes(active)) {
    return "/lecturer";
  }
  return "/lecturer/select-class";
}

export async function loginStaff(input: {
  role: StaffRole;
  email: string;
  password: string;
}): Promise<StaffSession> {
  if (!isConfigured()) {
    throw new Error(
      "Supabase is not configured on this deployment. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then redeploy.",
    );
  }
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error) throw error;
  if (!data.user) throw new Error("Sign in failed.");

  clearActiveLecturerStream();

  if (input.role === "lecturer") {
    const { error: registrationError } = await supabase.rpc("complete_lecturer_registration");
    if (registrationError) {
      await supabase.auth.signOut();
      throw registrationError;
    }
  }
  const profile = await ensureStaffProfile(supabase, data.user, {
    role: input.role,
  });
  if (!profile || profile.role !== input.role) {
    await supabase.auth.signOut();
    throw new Error(
      input.role === "admin"
        ? "This account is not an admin account."
        : input.role === "lecturer"
          ? "This account is not a lecturer account."
          : "This account is not a class rep account.",
    );
  }
  if (profile.status !== "active") {
    if (input.role === "lecturer") {
      const { data, error } = await supabase.rpc("lecturer_application_status");
      const status = (data as { status?: string } | null)?.status;
      if (!error && (status === "pending" || status === "rejected")) throw new Error("LECTURER_APPROVAL_REQUIRED");
    }
    await supabase.auth.signOut();
    throw new Error("This account has been deactivated.");
  }

  const session = toSession(profile, data.user.email ?? input.email);
  invalidateQueries("staff");
  window.dispatchEvent(new Event(SESSION_EVENT));
  return session;
}


export async function completeLecturerOnboarding(input: {
  streamIds: ClassStreamId[];
  moduleIds: string[];
}): Promise<StaffSession> {
  if (input.streamIds.length === 0) {
    throw new Error("Select at least one class.");
  }
  if (input.moduleIds.length === 0) {
    throw new Error("Select at least one module you teach.");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { error } = await supabase.rpc("complete_lecturer_setup", {
    selected_classes: input.streamIds,
    selected_modules: input.moduleIds,
  });

  if (error) throw error;
  const data = await ensureStaffProfile(supabase, user, { role: "lecturer" });
  if (!data) throw new Error("Could not save teaching profile.");

  clearActiveLecturerStream();
  if (input.streamIds.length === 1) {
    setActiveLecturerStream(input.streamIds[0]);
  }

  const session = toSession(data, user.email ?? "");
  invalidateQueries("staff");
  window.dispatchEvent(new Event(SESSION_EVENT));
  return session;
}

export async function logoutStaff() { await signOutAndForget(); }

async function loadStaffSession(): Promise<StaffSession | null> {
  try {
    if (!isConfigured()) return null;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const profile = await getStaffProfile(supabase, user.id).catch(() => null);
    if (!profile || profile.status !== "active") return null;
    if (
      profile.role !== "admin" &&
      profile.role !== "class_rep" &&
      profile.role !== "lecturer"
    ) {
      return null;
    }
    return toSession(profile, user.email ?? "");
  } catch {
    return null;
  }
}

export function fetchStaffSession(): Promise<StaffSession | null> {
  return cachedQuery("staff:session", loadStaffSession, 15000);
}

export function useStaffSession() {
  const shared = useContext(StaffSessionContext);
  const [session, setSession] = useState<StaffSession | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const next = await fetchStaffSession();
    setSession(next);
    setReady(true);
  }, []);

  useEffect(() => {
    if (shared) return;
    const timer = setTimeout(() => void refresh(), 0);
    const onFocus = () => void refresh();
    window.addEventListener(SESSION_EVENT, onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(SESSION_EVENT, onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh, shared]);

  return shared ?? { session, ready, refresh };
}
