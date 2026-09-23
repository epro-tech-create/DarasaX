"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ensureStaffProfile, getStaffProfile } from "@/lib/auth/staff-profile";
import type { ClassStreamId, StaffRole } from "@/types";

const SESSION_EVENT = "darasax:staff-session";

export type StaffSession = {
  role: StaffRole;
  email: string;
  name: string;
  streamId: ClassStreamId | null;
};

function toSession(
  role: StaffRole,
  email: string,
  name: string,
  streamId: string | null,
): StaffSession {
  return { role, email, name, streamId: (streamId as ClassStreamId | null) ?? null };
}

function isConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
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

  const session = toSession(
    profile.role,
    profile.email ?? data.user.email ?? input.email,
    profile.full_name ?? "Staff",
    profile.stream_id,
  );
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
    // Email confirmation is on — the code arrives by email.
    return { session: null, needsVerification: true };
  }

  const profile = await ensureStaffProfile(supabase, data.user, {
    role: "class_rep",
    streamId: input.streamId,
    fullName: input.name,
  });
  if (!profile) throw new Error("Registration failed.");

  const session = toSession(
    "class_rep",
    profile.email ?? data.user.email ?? input.email,
    profile.full_name ?? input.name,
    profile.stream_id ?? input.streamId,
  );
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
      },
    },
  });
  if (error) throw error;
  if (!data.user) throw new Error("Registration failed.");

  if (!data.session) {
    return { session: null, needsVerification: true };
  }

  const profile = await ensureStaffProfile(supabase, data.user, {
    role: "lecturer",
    fullName: input.name,
  });
  if (!profile) throw new Error("Registration failed.");

  const session = toSession(
    "lecturer",
    profile.email ?? data.user.email ?? input.email,
    profile.full_name ?? input.name,
    profile.stream_id,
  );
  window.dispatchEvent(new Event(SESSION_EVENT));
  return { session, needsVerification: false };
}

export async function logoutStaff() {
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
    return toSession(
      profile.role,
      profile.email ?? user.email ?? "",
      profile.full_name ?? "Staff",
      profile.stream_id,
    );
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
