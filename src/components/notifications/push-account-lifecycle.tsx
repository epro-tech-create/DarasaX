"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PushSetupButton } from "@/components/notifications/push-setup-button";
import { useTranslate } from "@/components/providers/language-provider";
import { dismissNotificationBanner, notificationBannerDismissed, phoneNotificationsDisabled, ensurePhoneNotifications, pushSupported } from "@/lib/push-client";

// Granted devices connect automatically; first-time setup uses an explicit button.
export function PushAccountLifecycle({ userId }: { userId: string | null }) {
  const t = useTranslate();
  const [status, setStatus] = useState("checking");
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!userId) return;
    let disposed = false, syncing = false;
    const active = () => !disposed;
    const needsInstall = () => {
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
      return ios && !standalone;
    };
    async function sync() {
      if (syncing || !active()) return;
      syncing = true;
      try {
        setDismissed(notificationBannerDismissed(userId!));
        if (phoneNotificationsDisabled(userId!)) { setStatus("disabled"); return; }
        if (needsInstall()) { setStatus("install"); return; }
        if (!pushSupported()) { setStatus("unsupported"); return; }
        setStatus(Notification.permission);
        if (Notification.permission === "granted") {
          const device = await ensurePhoneNotifications(userId!, active);
          if (active()) {
            if (phoneNotificationsDisabled(userId!)) { setStatus("disabled"); return; }
            if (!device?.id) throw new Error("Could not connect notifications. Please try again.");
            setStatus("connected"); setError("");
          }
        }
      } catch (error) { if (active()) setError(error instanceof Error ? error.message : "Could not connect notifications. Please try again."); }
      finally { syncing = false; }
    }
    void sync();
    const onVisible = () => { if (document.visibilityState === "visible") void sync(); };
    const timer = setInterval(onVisible, 60000);
    window.addEventListener("focus", sync);
    window.addEventListener("online", sync);
    window.addEventListener("darasax:push-preference", sync);
    window.addEventListener("storage", sync);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("darasax:push-preference", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync); window.removeEventListener("online", sync);
    };
  }, [userId]);
  if (!userId || dismissed || status === "checking" || status === "connected" && !error) return null;
  return <aside className="fixed inset-x-3 bottom-24 z-40 mx-auto max-w-xl rounded-2xl border border-border bg-card p-5 shadow-xl lg:bottom-4" aria-label={t("Notification setup")}>
    <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">{t("Stay updated with DarasaX")}</p><Button size="sm" variant="ghost" onClick={() => { dismissNotificationBanner(userId); setDismissed(true); }}>{t("Dismiss")}</Button></div>
    <p className="mt-1 text-xs text-muted-foreground">{t(status === "install" ? "On iPhone or iPad, add DarasaX to your Home Screen and open it from its icon to receive notifications automatically." : status === "unsupported" ? "This browser cannot receive device notifications. Open DarasaX in a supported browser or install the Home Screen app. In-app announcements remain available." : status === "denied" ? "Notifications are blocked by your browser. Allow them in your browser or phone settings. In-app notifications remain active." : status === "disabled" ? "Device notifications are off. Enable them to receive announcements, assignments, and class reminders." : status === "default" ? "Enable notifications on this device. Announcements, assignments, learning updates, and class reminders are already selected by default." : "Notifications connect automatically. Check your connection and reopen the app if this message continues.")}</p>
    {status === "default" || status === "disabled" || status === "denied" || error ? <PushSetupButton key={userId} userId={userId} reconnect={status === "granted"} onConnected={() => { setStatus("connected"); setError(""); }} /> : null}
    {error ? <p role="status" className="mt-2 text-xs text-danger">{t(error)}</p> : null}
  </aside>;
}
