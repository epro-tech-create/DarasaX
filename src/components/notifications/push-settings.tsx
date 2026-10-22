"use client";

import { useEffect, useState } from "react";
import { BellRing, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/lib/notifications-store";
import { createClient } from "@/lib/supabase/client";
import { detachPhoneNotifications, pushRegistration, pushSupported } from "@/lib/push-client";

type Device = { id: string; updates: boolean; lessons: boolean };

export function PushSettings() {
  const { userId } = useNotifications();
  const [supported, setSupported] = useState(false);
  const [installFirst, setInstallFirst] = useState(false);
  const [device, setDevice] = useState<Device | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
      setInstallFirst(ios && !standalone);
      setSupported(pushSupported());
      if (pushSupported() && userId) {
        try {
          const registration = await pushRegistration();
          const sub = await registration.pushManager.getSubscription();
          if (sub) {
            const { data, error } = await createClient().rpc("get_push_device", { push_endpoint: sub.endpoint });
            if (error) throw error;
            if (!cancelled) setDevice(data as Device | null);
          }
        } catch { if (!cancelled) setMessage("Phone notification settings could not be loaded. Try reopening this panel."); }
      }
      if (!cancelled) setReady(true);
    };
    void check();
    return () => { cancelled = true; };
  }, [userId]);

  async function enable() {
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      // Request directly from this click, before any network awaits (required on iOS).
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notifications are blocked. Allow notifications for DarasaX in your browser or phone settings, then try again.");
      const client = createClient();
      const { data: publicKey, error: keyError } = await client.rpc("get_push_public_key");
      if (keyError || !publicKey) throw new Error("Phone notifications are not configured yet. Please try again later.");
      const registration = await pushRegistration();
      let sub = await registration.pushManager.getSubscription();
      if (!sub) {
        const key = Uint8Array.from(atob(publicKey.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - publicKey.length % 4) % 4)), c => c.charCodeAt(0));
        sub = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      }
      const json = sub.toJSON();
      const { data, error } = await client.rpc("register_push_subscription", {
        push_endpoint: sub.endpoint, push_p256dh: json.keys!.p256dh, push_auth: json.keys!.auth,
        push_origin: window.location.origin,
      });
      if (error) throw new Error("Could not enable notifications. Make sure your account has workspace access, then try again.");
      setDevice(data as Device); setMessage("Notifications enabled on this device. You’ll receive new updates and a reminder 10 minutes before class.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not enable phone notifications."); }
    finally { setBusy(false); }
  }

  async function preferences(updates: boolean, lessons: boolean) {
    if (!device || busy) return;
    setBusy(true); setMessage("");
    try {
      const { error } = await createClient().rpc("set_push_preferences", { device_id: device.id, receive_updates: updates, lesson_reminders: lessons });
      if (error) throw error;
      setDevice({ ...device, updates, lessons });
    } catch { setMessage("Could not save your preferences. Please try again."); }
    finally { setBusy(false); }
  }

  async function disable() {
    setBusy(true); setMessage("");
    try { await detachPhoneNotifications(); setDevice(null); setMessage("Phone notifications are off on this device."); }
    catch { setMessage("Could not turn notifications off. Please try again."); }
    finally { setBusy(false); }
  }

  async function test() {
    if (!device) return;
    setBusy(true); setMessage("");
    try {
      const { error } = await createClient().functions.invoke("deliver-web-push", { body: { action: "test", deviceId: device.id } });
      if (error) throw error;
      setMessage("Test sent to the push service. Look for “DarasaX · You’re connected” on this device.");
    } catch { setMessage("The test could not be sent. Wait a minute and try again; check your phone’s notification settings too."); }
    finally { setBusy(false); }
  }

  return <section className="border-b border-border bg-primary/5 px-4 py-4" aria-label="Phone notifications">
    <div className="flex items-center gap-2 text-sm font-semibold"><Smartphone className="h-4 w-4 text-primary" aria-hidden />Phone notifications</div>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Get announcements, assignments, new resources, topics, and class reminders even when DarasaX is closed.</p>
    {installFirst ? <p className="mt-2 text-xs leading-relaxed">On iPhone or iPad: tap Share → Add to Home Screen, open DarasaX from its icon, then enable notifications here.</p>
      : !ready ? <p className="mt-2 text-xs">Checking this device…</p>
      : !supported ? <p className="mt-2 text-xs">This browser does not support phone notifications. Try an up-to-date Chrome, Safari, Firefox, or Edge browser.</p>
      : device ? <div className="mt-3 space-y-2">
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={device.updates} disabled={busy} onChange={e => void preferences(e.target.checked, device.lessons)} />Announcements, assignments, and learning updates</label>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={device.lessons} disabled={busy} onChange={e => void preferences(device.updates, e.target.checked)} />Lesson reminder · 10 minutes before (Tanzania time)</label>
        <div className="flex flex-wrap gap-2 pt-1"><Button size="sm" variant="outline" disabled={busy} onClick={() => void test()}>Send test</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => void disable()}>Turn off on this device</Button></div>
      </div>
      : <Button className="mt-3" size="sm" disabled={busy || !userId} onClick={() => void enable()}><BellRing className="h-4 w-4" aria-hidden />{busy ? "Enabling…" : "Enable notifications"}</Button>}
    {message ? <p role="status" className="mt-2 text-xs leading-relaxed">{message}</p> : null}
  </section>;
}
