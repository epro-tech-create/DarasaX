/* Push only: never cache authenticated pages or API responses. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data?.json() || {}; } catch { /* Show a safe fallback. */ }
  // Both phases share a tag for this dated lesson. Also accept queued payloads
  // from before the rollout and retire their old, phase-specific alerts.
  const rawTag = typeof data.tag === 'string' ? data.tag : 'darasax-update';
  const tag = rawTag.startsWith('lesson:') ? rawTag.replace(/:(advance|start)$/, '') : rawTag;
  event.waitUntil((async () => {
    if (tag.startsWith('lesson:')) {
      for (const previous of await self.registration.getNotifications()) {
        if (previous.tag === `${tag}:advance` || previous.tag === `${tag}:start`) previous.close();
      }
    }
    await self.registration.showNotification(data.title || 'DarasaX · New update', {
    body: data.body || 'You have a new update. Open DarasaX to view it.',
    icon: '/apple-touch-icon.png', badge: '/favicon-32.png',
    tag, renotify: data.lessonPhase === 'start' || rawTag.endsWith(':start'),
    timestamp: data.timestamp || Date.now(),
    data: { href: safeHref(data.href) },
    });
  })());
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
