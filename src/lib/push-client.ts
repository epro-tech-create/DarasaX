"use client";

export function phoneNotificationsDisabled(userId: string) {
  try { return localStorage.getItem(`darasax:push-disabled:${userId}`) === "1"; } catch { return false; }
}
export function setPhoneNotificationsDisabled(userId: string, disabled: boolean) {
  localStorage.setItem(`darasax:push-disabled:${userId}`, disabled ? "1" : "0");
  if (disabled) localStorage.removeItem(`darasax:push-banner-dismissed:${userId}`);
  window.dispatchEvent(new Event("darasax:push-preference"));
}
export function notificationBannerDismissed(userId: string) {
  try { return localStorage.getItem(`darasax:push-banner-dismissed:${userId}`) === "1"; } catch { return false; }
}
export function dismissNotificationBanner(userId: string) {
  localStorage.setItem(`darasax:push-banner-dismissed:${userId}`, "1");
  window.dispatchEvent(new Event("darasax:push-preference"));
}

export async function pushRegistration() {
  await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  return navigator.serviceWorker.ready;
}

export function pushSupported() {
  return window.isSecureContext && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function requestPhonePermission(): Promise<NotificationPermission> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("No permission response was received. Open DarasaX in your phone’s main browser, allow notifications, then try again.")), 30000);
    Notification.requestPermission().then(permission => { clearTimeout(timer); resolve(permission); }, error => { clearTimeout(timer); reject(error); });
  });
}

export async function ensurePhoneNotifications(userId: string, isCurrent: () => boolean = () => true) {
  const active = () => isCurrent() && !phoneNotificationsDisabled(userId);
  if (!pushSupported() || Notification.permission !== "granted" || !active()) return null;
  const { createClient } = await import("@/lib/supabase/client");
  const client = createClient();
  const { data: { user } } = await client.auth.getUser();
  if (user?.id !== userId || !active()) return null;
  const { data: publicKey, error: keyError } = await client.rpc("get_push_public_key");
  if (keyError || !publicKey) throw new Error("Phone notifications are not configured yet. Please try again later.");
  const registration = await pushRegistration();
  if (!active()) return null;
  let sub = await registration.pushManager.getSubscription();
  if (sub) {
    const { data: existing, error } = await client.rpc("get_push_device", { push_endpoint: sub.endpoint });
    if (error) throw error;
    if (!active()) return null;
    if (!existing) {
      await sub.unsubscribe(); sub = null;
      for (const notification of await registration.getNotifications()) notification.close();
    }
  }
  if (!active()) return null;
  if (!sub) {
    const key = Uint8Array.from(atob(publicKey.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - publicKey.length % 4) % 4)), c => c.charCodeAt(0));
    sub = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  }
  if (!active()) return null;
  const json = sub.toJSON();
  const { data, error } = await client.rpc("register_push_subscription", {
    push_endpoint: sub.endpoint, push_p256dh: json.keys!.p256dh, push_auth: json.keys!.auth, push_origin: window.location.origin,
  });
  if (error) throw new Error("Could not connect notifications. Please try again.");
  if (phoneNotificationsDisabled(userId)) {
    await client.rpc("remove_push_subscription", { push_endpoint: sub.endpoint });
    await sub.unsubscribe();
    return null;
  }
  window.dispatchEvent(new Event("darasax:push-ready"));
  return data as { id: string; updates: boolean; lessons: boolean };
}

export async function detachPhoneNotifications() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  // Unsubscribe at the browser push service even if the app session has expired.
  const { createClient } = await import("@/lib/supabase/client");
  const { error } = await createClient().rpc("remove_push_subscription", { push_endpoint: subscription.endpoint });
  if (error) throw new Error("Could not disconnect notifications. Please try again.");
  await subscription.unsubscribe();
  for (const notification of await registration!.getNotifications()) notification.close();
}
