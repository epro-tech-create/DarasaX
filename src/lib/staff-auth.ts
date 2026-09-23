"use client";

import { useCallback, useEffect, useState } from "react";
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

function toSession(profile: StaffProfile, emailFallback = ""): StaffSession {
  const streamIds = asStreamIds(profile);
  const moduleIds = Array.isArray(profile.module_ids) ? profile.module_ids : [];
  const onboarded =
    profile.role !== "lecturer"
      ? true
      : Boolean(profile.onboarding_completed) &&
        streamIds.length > 0 &&
        moduleIds.length > 0;
  return {
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
    await supabase.auth.signOut();
    throw new Error("This account has been deactivated.");
  }

  const session = toSession(profile, data.user.email ?? input.email);
  window.dispatchEvent(new Event(SESSION_EVENT));
  return session;
}

export async function registerClassRep(input: {
  name: string;
  email: string;
  password: string;
  streamId: string;
}): Promise<{ session: StaffSession | null; needsVerification: boolean }> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.name,
        role: "class_rep",
        stream_id: input.streamId,
      },
    },
  });
  if (error) throw error;
  if (!data.user) throw new Error("Registration failed.");

  if (!data.session) {
    return { session: null, needsVerification: true };
  }

  const profile = await ensureStaffProfile(supabase, data.user, {
    role: "class_rep",
    streamId: input.streamId,
    fullName: input.name,
  });
  if (!profile) throw new Error("Registration failed.");

  const session = toSession(profile, data.user.email ?? input.email);
  window.dispatchEvent(new Event(SESSION_EVENT));
  return { session, needsVerification: false };
}

export async function registerLecturer(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ session: StaffSession | null; needsVerification: boolean }> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.name,
        role: "lecturer",
        email: input.email,
      },
    },
  });
  if (error) throw error;
  if (!data.user) throw new Error("Registration failed.");

  if (!data.session) {
    return { session: null, needsVerification: true };
  }

  let profile = await ensureStaffProfile(supabase, data.user, {
    role: "lecturer",
    fullName: input.name,
  });
  if (!profile) throw new Error("Registration failed.");

  if (!profile.email || profile.email !== input.email) {
    const { data: patched } = await supabase
      .from("staff_profiles")
      .update({ email: input.email, full_name: input.name })
      .eq("id", data.user.id)
      .select("*")
      .maybeSingle();
    if (patched) profile = patched;
    else profile = { ...profile, email: input.email, full_name: input.name };
  }

  const session = toSession(profile, input.email);
  window.dispatchEvent(new Event(SESSION_EVENT));
  return { session, needsVerification: false };
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

  const { data, error } = await supabase
    .from("staff_profiles")
    .update({
      stream_ids: input.streamIds,
      module_ids: input.moduleIds,
      stream_id: input.streamIds[0],
      onboarding_completed: true,
      email: user.email ?? undefined,
      full_name:
        (user.user_metadata?.full_name as string | undefined) ?? undefined,
    })
    .eq("id", user.id)
    .eq("role", "lecturer")
    .select("*")
    .single();

  if (error) throw error;
  if (!data) throw new Error("Could not save teaching profile.");

  clearActiveLecturerStream();
  if (input.streamIds.length === 1) {
    setActiveLecturerStream(input.streamIds[0]);
  }

  const session = toSession(data, user.email ?? "");
  window.dispatchEvent(new Event(SESSION_EVENT));
  return session;
}

export async function logoutStaff() {
  clearActiveLecturerStream();
  const supabase = createClient();
  await supabase.auth.signOut();
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export async function fetchStaffSession(): Promise<StaffSession | null> {
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

export function useStaffSession() {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const next = await fetchStaffSession();
    setSession(next);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener(SESSION_EVENT, onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener(SESSION_EVENT, onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  return { session, ready, refresh };
}
