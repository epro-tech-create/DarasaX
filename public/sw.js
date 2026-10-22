/* Push only: never cache authenticated pages or API responses. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data?.json() || {}; } catch { /* Show a safe fallback. */ }
  event.waitUntil(self.registration.showNotification(data.title || 'DarasaX · New update', {
    body: data.body || 'You have a new update. Open DarasaX to view it.',
    icon: '/apple-touch-icon.png', badge: '/favicon-32.png',
    tag: data.tag || 'darasax-update', renotify: false,
    timestamp: data.timestamp || Date.now(),
    data: { href: safeHref(data.href) },
  }));
});
function safeHref(href) {
  try {
    const url = new URL(href || '/dashboard', self.location.origin);
    return url.origin === self.location.origin ? url.href : self.location.origin + '/dashboard';
  } catch { return self.location.origin + '/dashboard'; }
}
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const href = safeHref(event.notification.data?.href);
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) { await existing.navigate(href); return existing.focus(); }
    return self.clients.openWindow(href);
  })());
});
