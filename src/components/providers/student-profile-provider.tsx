"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

type Context = { profile: Profile | null; avatarUrl: string | null; updateProfile: (profile: Profile) => void };
const StudentProfileContext = createContext<Context | null>(null);

export function StudentProfileProvider({ initialProfile, children }: { initialProfile: Profile | null; children: React.ReactNode }) {
  const [profile, setProfile] = useState(initialProfile);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const updateProfile = useCallback((next: Profile) => setProfile(next), []);
  useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      const value = profile?.avatar_url;
      let url: string | null = null;
      if (value?.startsWith("https://")) url = value;
      else if (value && value.startsWith(`${profile?.id}/`)) {
        const { data } = await createClient().storage.from("avatars").createSignedUrl(value, 3600);
        url = data?.signedUrl ?? null;
      }
      if (!cancelled) setAvatarUrl(url);
    };
    void resolve();
    const timer = setInterval(() => void resolve(), 45 * 60 * 1000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [profile?.avatar_url, profile?.id]);
  return <StudentProfileContext.Provider value={{ profile, avatarUrl, updateProfile }}>{children}</StudentProfileContext.Provider>;
}

export function useStudentProfile() {
  const context = useContext(StudentProfileContext);
  if (!context) throw new Error("StudentProfileProvider is required");
  return context;
}
