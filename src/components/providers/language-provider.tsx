"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { translate, type Language } from "@/lib/i18n/translate";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
};
export const LanguageContext = createContext<LanguageContextValue | null>(null);
const storageKey = "darasax:language";
function remember(language: Language) {
  try { localStorage.setItem(storageKey, language); } catch { /* Storage may be disabled. */ }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setValue] = useState<Language>("en");
  const version = useRef(0);
  useEffect(() => {
    let disposed = false;
    // Run after hydration; the authenticated account preference takes precedence.
    let receivedAccount = false;
    const initial = setTimeout(() => {
      if (receivedAccount) return;
      try { if (localStorage.getItem(storageKey) === "sw") setValue("sw"); } catch { /* Use English. */ }
    }, 0);
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session || event === "SIGNED_OUT") receivedAccount = true;
      if (event === "SIGNED_OUT") { version.current++; setValue("en"); remember("en"); return; }
      if (session && ["INITIAL_SESSION", "SIGNED_IN", "USER_UPDATED", "TOKEN_REFRESHED"].includes(event)) {
        const request = ++version.current;
        const next = session.user.user_metadata?.preferred_language === "sw" ? "sw" : "en";
        setValue(next);
        remember(next);
        // Refresh a cached session's preference once, without delaying the page.
        // Auth calls run outside the auth callback to avoid Supabase's callback lock.
        if (event === "INITIAL_SESSION") setTimeout(() => {
          if (request !== version.current) return;
          void supabase.auth.getUser().then(({ data, error }) => {
            if (disposed || error || !data.user || data.user.id !== session.user.id || request !== version.current) return;
            const saved = data.user.user_metadata?.preferred_language === "sw" ? "sw" : "en";
            setValue(saved); remember(saved);
          }).catch(() => { /* Keep the cached preference while offline. */ });
        }, 0);
      }
    });
    const sync = (event: StorageEvent) => {
      if (event.key === storageKey && (event.newValue === "en" || event.newValue === "sw")) setValue(event.newValue);
    };
    window.addEventListener("storage", sync);
    return () => { disposed = true; clearTimeout(initial); data.subscription.unsubscribe(); window.removeEventListener("storage", sync); };
  }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const setLanguage = useCallback(async (next: Language) => {
    if (next !== "en" && next !== "sw") return;
    const request = ++version.current;
    const { error } = await createClient().auth.updateUser({ data: { preferred_language: next } });
    if (error) throw new Error("Could not save your language. Please try again.");
    if (request !== version.current) return;
    setValue(next);
    remember(next);
  }, []);
  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("LanguageProvider is missing");
  return context;
}

export function useTranslate() {
  const { language } = useLanguage();
  return useMemo(() => Object.assign(<T,>(value: T): T => translate(value, language), {
    locale: language === "sw" ? "sw-TZ" : "en-GB",
  }), [language]);
}
