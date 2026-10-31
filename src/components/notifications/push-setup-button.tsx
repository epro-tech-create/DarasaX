"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslate } from "@/components/providers/language-provider";
import { ensurePhoneNotifications, requestPhonePermission, setPhoneNotificationsDisabled } from "@/lib/push-client";

export function PushSetupButton({ userId, reconnect = false, onConnected }: { userId: string; reconnect?: boolean; onConnected?: () => void }) {
  const t = useTranslate();
  const account = useRef<string | null>(null);
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { account.current = userId; return () => { account.current = null; }; }, [userId]);
  async function enable() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError("");
    const active = () => account.current === userId;
    try {
      // Keep the native permission call inside the user's button gesture.
      const permission = await requestPhonePermission();
      if (!active()) return;
      if (permission !== "granted") throw new Error(permission === "denied" ? "Notifications are blocked by your browser. Allow them in your browser or phone settings. In-app notifications remain active." : "Notification permission was not granted. You can try again.");
      setPhoneNotificationsDisabled(userId, false);
      const device = await ensurePhoneNotifications(userId, active);
      if (active()) {
        if (!device?.id) throw new Error("Could not connect notifications. Please try again.");
        onConnected?.();
      }
    } catch (error) { if (active()) setError(error instanceof Error ? error.message : "Could not connect notifications. Please try again."); }
    finally { pending.current = false; if (active()) setBusy(false); }
  }
  return <div className="mt-3"><Button size="sm" disabled={busy} onClick={() => void enable()}>{t(busy ? "Connecting…" : reconnect ? "Reconnect notifications" : "Enable notifications")}</Button>{error ? <p role="status" className="mt-2 text-xs text-danger">{t(error)}</p> : null}</div>;
}
