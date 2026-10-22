import { createClient } from 'npm:@supabase/supabase-js@2.116.0';
import webpush from 'npm:web-push@3.6.7';
import { timingSafeEqual } from 'node:crypto';
import { sendBatch } from './push-core.mjs';

function sameSecret(a, b) {
  const left = new TextEncoder().encode(a || '');
  const right = new TextEncoder().encode(b || '');
  return left.length > 0 && left.length === right.length && timingSafeEqual(left, right);
}

export async function handler(request) {
  const origin = request.headers.get('origin') || '';
  const allowed = /^https:\/\/(www\.|admin\.|cr\.|lecturer\.)?darasax\.com$/.test(origin);
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin',
    ...(allowed ? { 'Access-Control-Allow-Origin': origin } : {}) };
  const respond = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
  if (origin && !allowed) return respond({ error: 'Invalid origin' }, 403);
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) return respond({ error: 'Sign in first' }, 401);
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });
    const rpc = async (name, args = {}) => {
      const { data, error } = await service.rpc(name, args);
      if (error) throw new Error(`Push operation failed: ${name}`);
      return data;
    };
    const config = await rpc('push_worker_config');
    if (!config?.public_key || !config?.private_key || !config?.worker_secret) return respond({ error: 'Push is not configured' }, 503);
    const scheduler = sameSecret(authorization.slice(7), config.worker_secret);
    let onlyUser = null;
    if (!scheduler) {
      const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY'), { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
      const { data: { user }, error } = await caller.auth.getUser();
      if (error || !user) return respond({ error: 'Sign in first' }, 401);
      const body = await request.json();
      if (body.action !== 'test' || !/^[0-9a-f-]{36}$/i.test(body.deviceId || '')) return respond({ error: 'Invalid request' }, 400);
      const { error: testError } = await caller.rpc('enqueue_push_test', { device_id: body.deviceId });
      if (testError) return respond({ error: 'Wait one minute between tests and check that this device is enabled.' }, 429);
      onlyUser = user.id;
    } else await rpc('enqueue_lesson_push');

    const stats = { sent: 0, retry: 0, failed: 0, expired: 0 };
    const started = Date.now();
    // Up to 600 devices per minute, while staying within execution limits.
    for (let batch = 0; batch < 10 && Date.now() - started < 45000; batch++) {
      const jobs = await rpc('claim_push_deliveries', { only_user: onlyUser });
      if (!jobs.length) break;
      const result = await sendBatch(jobs, {
        send: async (job, payload, ttl) => {
          // Use the maintained library for encryption/VAPID; fetch gives us a hard timeout and disables redirects.
          const details = webpush.generateRequestDetails({ endpoint: job.endpoint, keys: { p256dh: job.p256dh, auth: job.auth } }, JSON.stringify(payload), {
            TTL: ttl, urgency: job.payload.tag?.startsWith('lesson:') ? 'high' : 'normal',
            vapidDetails: { subject: 'https://www.darasax.com', publicKey: config.public_key, privateKey: config.private_key },
          });
          const response = await fetch(job.endpoint, { method: 'POST', headers: details.headers, body: details.body,
            redirect: 'error', signal: AbortSignal.timeout(8000) });
          await response.body?.cancel();
          return response;
        },
        finish: (job, outcome, code) => rpc('finish_push_delivery', { delivery_id: job.id, delivery_attempt: job.attempts, outcome, error_code: code }),
      });
      for (const name of Object.keys(stats)) stats[name] += result[name];
      if (onlyUser) break;
    }
    console.log(JSON.stringify({ event: 'push_delivery', ...stats }));
    if (onlyUser && stats.sent === 0) return respond({ error: 'The test was not accepted by the push service. Please retry.' }, 502);
    return respond(stats);
  } catch { console.error('Push delivery failed; pending jobs will be retried.'); return respond({ error: 'Push delivery is temporarily unavailable' }, 503); }
}

Deno.serve(handler);
