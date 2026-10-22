export const moduleNames = {
  'mod-numerical': 'Numerical Methods and Matrices', 'mod-sensor-networks': 'Sensor Networks',
  'mod-cyber': 'Cyber Security', 'mod-db-admin': 'Database Programming and Administration',
  'mod-web': 'Web Application Development', 'mod-dsa': 'Data Structures and Algorithms',
  'mod-se': 'Software Engineering', 'mod-dsp': 'Digital Signal Processing',
  'mod-electrical': 'Principles of Electrical Machines', 'mod-hci': 'Human Computer Interaction',
  'mod-electronics': 'Electronics',
};

export function validEndpoint(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port
      && /^(fcm\.googleapis\.com|([a-z0-9-]+\.)*push\.services\.mozilla\.com|([a-z0-9-]+\.)*push\.apple\.com|([a-z0-9-]+\.)*notify\.windows\.com)$/.test(url.hostname);
  } catch { return false; }
}

export function notificationPayload(job) {
  const payload = { ...job.payload };
  payload.body = String(payload.body || '').replace(/mod-[a-z0-9-]+/g, id => moduleNames[id] || 'Your scheduled class');
  // Staff portal destinations mirror the routes used by the existing inbox.
  let href = String(payload.href || '/dashboard');
  const origin = new URL(job.origin);
  const portal = job.portal === 'admin' || origin.hostname.startsWith('admin.') ? '/admin'
    : job.portal === 'lecturer' || origin.hostname.startsWith('lecturer.') ? '/lecturer'
    : job.portal === 'class_rep' || origin.hostname.startsWith('cr.') ? '/cr' : '';
  if (portal) {
    if (href === '/dashboard') href = portal;
    else if (href === '/timetable' || href === '/announcements' || href === '/past-papers') href = portal + href;
    else if (href === '/assignments') href = portal === '/admin' ? '/admin/materials' : portal + '/assignments';
    else if (href.includes('/topics/')) href = portal + '/topics';
    else href = portal + '/materials';
  }
  payload.href = href.startsWith('/') && !href.startsWith('//') ? href : '/dashboard';
  return payload;
}

export function deliveryOutcome(status) {
  if (status >= 200 && status < 300) return 'sent';
  if (status === 404 || status === 410) return 'expired';
  if (status === 429 || status >= 500 || status === 0) return 'retry';
  return 'failed';
}

export async function sendBatch(jobs, { send, finish, now = Date.now }) {
  const stats = { sent: 0, retry: 0, failed: 0, expired: 0 };
  // Bound encryption work and outbound connections on the Edge runtime.
  for (let i = 0; i < jobs.length; i += 8) {
    await Promise.all(jobs.slice(i, i + 8).map(async job => {
      let outcome = 'failed';
      let status = 'invalid_endpoint';
      if (validEndpoint(job.endpoint) && Date.parse(job.expiresAt) > now()) {
        try {
          const response = await send(job, notificationPayload(job), Math.min(3600, Math.max(0, Math.floor((Date.parse(job.expiresAt) - now()) / 1000))));
          outcome = deliveryOutcome(response.status);
          status = String(response.status);
        } catch { outcome = 'retry'; status = 'network_error'; }
      }
      await finish(job, outcome, outcome === 'sent' ? null : status);
      stats[outcome]++;
    }));
  }
  return stats;
}
