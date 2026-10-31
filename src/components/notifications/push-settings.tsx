"use client";

import { useEffect, useState } from "react";
import { PushSetupButton } from "@/components/notifications/push-setup-button";
import { Button } from "@/components/ui/button";
import { Smartphone } from "lucide-react";
import { useNotifications } from "@/lib/notifications-store";
import { createClient } from "@/lib/supabase/client";
import { detachPhoneNotifications, phoneNotificationsDisabled, setPhoneNotificationsDisabled, pushRegistration, pushSupported } from "@/lib/push-client";
import { useTranslate } from "@/components/providers/language-provider";

export function PushSettings() {
  const t = useTranslate();
  const { userId } = useNotifications();
  const [busy, setBusy] = useState(false);
  const [disableError, setDisableError] = useState("");
  const [setup, setSetup] = useState<"none" | "enable" | "reconnect">("none");
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Checking this device…");
  useEffect(() => {
    let cancelled = false;
    async function check() {
      let message = "In-app notifications are always on.";
      let nextSetup: "none" | "enable" | "reconnect" = "none";
      let isConnected = false;
      try {
        if (pushSupported() && userId) {
          if (phoneNotificationsDisabled(userId)) { message = "Device notifications are off. In-app notifications remain active."; nextSetup = "enable"; }
          else if (Notification.permission === "denied") message = "Notifications are blocked by your browser. Allow them in your browser or phone settings. In-app notifications remain active.";
          else if (Notification.permission === "default") { message = "Announcements, assignments, learning updates, and class reminders are enabled by default. Allow browser permission to connect this device."; nextSetup = "enable"; }
          else {
            const registration = await pushRegistration();
            const sub = await registration.pushManager.getSubscription();
            if (sub) {
              const { data, error } = await createClient().rpc("get_push_device", { push_endpoint: sub.endpoint });
              if (error) throw error;
              isConnected = !!data;
              if (!data) nextSetup = "reconnect";
              message = data ? "Notifications are on automatically: announcements, assignments, learning updates, and class reminders." : "Connecting notifications automatically. Reopen the workspace if this message continues.";
            } else { nextSetup = "reconnect"; message = "Connecting notifications automatically. Reopen the workspace if this message continues."; }
          }
        }
      } catch { message = "Phone notification status could not be loaded. In-app notifications remain active."; }
      if (!cancelled) { setStatus(message); setSetup(nextSetup); setConnected(isConnected); }
    }
    void check(); window.addEventListener("darasax:push-ready", check); window.addEventListener("focus", check); window.addEventListener("darasax:push-preference", check); window.addEventListener("storage", check);
    return () => { cancelled = true; window.removeEventListener("darasax:push-ready", check); window.removeEventListener("focus", check); window.removeEventListener("darasax:push-preference", check); window.removeEventListener("storage", check); };
  }, [userId]);
  async function disable() {
    if (!userId || busy) return;
    setBusy(true); setDisableError("");
    try {
      setPhoneNotificationsDisabled(userId, true);
      await detachPhoneNotifications();
      setConnected(false); setSetup("enable"); setStatus("Device notifications are off. In-app notifications remain active.");
    } catch { setDisableError("Could not disconnect notifications. Please try again."); }
    finally { setBusy(false); }
  }
  return <section className="border-b border-border bg-primary/5 px-4 py-4" aria-label={t("Phone notifications")}>
    <div className="flex items-center gap-2 text-sm font-semibold"><Smartphone className="h-4 w-4 text-primary" aria-hidden />{t("Phone notifications")}</div>
    {connected ? <p className="mt-2 text-xs font-semibold text-primary">{t("Notifications on")}</p> : null}
    <p role="status" className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(status)}</p>
    {connected || disableError ? <Button className="mt-3" size="sm" variant="outline" disabled={busy} onClick={() => void disable()}>{t(busy ? "Disconnecting…" : "Disable notifications")}</Button> : null}
    {disableError ? <p role="alert" className="mt-2 text-xs text-danger">{t(disableError)}</p> : null}
    {userId && setup !== "none" ? <PushSetupButton key={userId} userId={userId} reconnect={setup === "reconnect"} /> : null}
    <p className="mt-1 text-xs text-muted-foreground">{t("Class reminders arrive 30 minutes before and at the start of class (Tanzania time).")}</p>
  </section>;
}
