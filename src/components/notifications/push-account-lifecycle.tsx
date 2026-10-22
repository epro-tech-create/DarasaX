"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { pushSupported } from "@/lib/push-client";

// Automatic session expiry keeps opt-in alive. Switching accounts never inherits
// the previous account's push subscription or displayed notifications.
export function PushAccountLifecycle({ userId }: { userId: string | null }) {
  useEffect(() => {
    if (!userId || !pushSupported()) return;
    let disposed = false;
    const sync = async () => {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const sub = await registration?.pushManager.getSubscription();
      if (!sub || disposed) return;
      const { data, error } = await createClient().rpc("get_push_device", { push_endpoint: sub.endpoint });
      if (!error && !data && !disposed) {
        await sub.unsubscribe();
        for (const notification of await registration!.getNotifications()) notification.close();
      }
    };
    void sync().catch(() => { /* Retry on the next workspace load. */ });
    return () => { disposed = true; };
  }, [userId]);
  return null;
}
