"use client";

export async function pushRegistration() {
  await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  return navigator.serviceWorker.ready;
}

export function pushSupported() {
  return window.isSecureContext && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function detachPhoneNotifications() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  // Unsubscribe at the browser push service even if the app session has expired.
  const { createClient } = await import("@/lib/supabase/client");
  await createClient().rpc("remove_push_subscription", { push_endpoint: subscription.endpoint });
  await subscription.unsubscribe();
  for (const notification of await registration!.getNotifications()) notification.close();
}
