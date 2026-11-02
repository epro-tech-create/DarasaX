"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { NotificationsProvider } from "@/lib/notifications-store";

type Context = { profile: Profile | null; avatarUrl: string | null; isMbunge: boolean; updateProfile: (profile: Profile) => void };
const StudentProfileContext = createContext<Context | null>(null);

export function StudentProfileProvider({ initialProfile, initialMbunge = false, children }: { initialProfile: Profile | null; initialMbunge?: boolean; children: React.ReactNode }) {
  const [isMbunge, setIsMbunge] = useState(initialMbunge);
  useEffect(() => {
    const timer = setTimeout(() => setIsMbunge(initialMbunge), 0);
    return () => clearTimeout(timer);
  }, [initialMbunge]);
  const [profile, setProfile] = useState(initialProfile);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setProfile(initialProfile), 0);
    return () => clearTimeout(timer);
  }, [initialProfile]);
  useEffect(() => {
    let disposed = false;
    const refresh = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== initialProfile?.id) return;
      const { data: membership, error: membershipError } = await supabase.rpc("is_mbunge");
      if (!disposed) setIsMbunge(!membershipError && membership === true);
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!disposed && data) setProfile(data);
    };
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => { disposed = true; window.removeEventListener("focus", onFocus); };
  }, [initialProfile?.id]);
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
  return <StudentProfileContext.Provider value={{ profile, avatarUrl, isMbunge, updateProfile }}><NotificationsProvider key={initialProfile?.id} userId={initialProfile?.id ?? null}>{children}</NotificationsProvider></StudentProfileContext.Provider>;
}

export function useStudentProfile() {
  const context = useContext(StudentProfileContext);
  if (!context) throw new Error("StudentProfileProvider is required");
  return context;
}
