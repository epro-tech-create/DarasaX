# Phone notifications

Open the notification bell or student Settings → Notifications. Choose **Enable notifications** and approve the browser prompt. On iPhone/iPad (iOS 16.4+), first add DarasaX to the Home Screen and open its icon. Permissions and subscriptions are specific to each device and site origin.

The device receives announcements, assignments, published notes/slides/past papers, and new topics from the existing personal inbox. A separate preference controls recurring timetable reminders approximately ten minutes before class, in Africa/Dar_es_Salaam time. The existing next-class banner is unchanged. Phone layout, sound, visibility, and timing are controlled by the OS; delivery is best-effort. There is no SMS or email sending in this feature.

**Send test** performs an actual encrypted Web Push request, not a local demo notification. It is limited to once per minute per owned device. A successful response means the push service accepted it; verify appearance on the physical phone. New opt-ins do not receive historical notifications. Updates already read in the inbox are skipped if they have not been dispatched yet.

## Delivery and security

- `public/sw.js` displays push and routes taps within the current origin. It does not cache pages, sessions, or API responses.
- Browser RPCs verify account eligibility and device ownership. Device endpoints and encryption keys live in private, RLS-enabled tables with no browser table grants. Ten subscriptions per user are allowed.
- Private VAPID key and scheduler secret are stored in Supabase Vault. Only the service-role worker can retrieve them; no Vercel secrets or client private keys are required. Preserve the existing VAPID pair when redeploying; changing it requires devices to subscribe again.
- `deliver-web-push` validates the scheduler secret, or verifies a user JWT for a rate-limited self-test. Gateway JWT checking is intentionally disabled for the private cron credential. No arbitrary send endpoint exists.
- `darasax-web-push` runs every minute through pg_cron/pg_net. Idle ticks without pending jobs or opted-in lesson subscriptions do not invoke the Edge Function. Database scheduling does not depend on an open browser or Vercel Cron.
- Jobs are claimed with a two-minute lease and `SKIP LOCKED`; sends run eight at a time, with at most 600 devices handled per invocation. Delivery retries transient errors up to four attempts, using exponential backoff. HTTP 404/410 removes an expired subscription. Queue history is removed after expiry plus seven days when the worker runs.
- Content access, current class, current timetable, and preferences are checked when jobs are claimed. Source deletion cancels related jobs. Notification tags reduce duplicates following an interrupted delivery.
- Explicit sign-out unsubscribes this browser. Automatic idle session expiry keeps opted-in alerts active. On a shared device, opening another account cancels the browser's previous subscription; the new user must opt in themselves.
- Lesson reminders follow the published weekly timetable. Administrators must keep it accurate during holidays and breaks. No reminder is sent after the scheduled start time (the push service also receives an expiry TTL).

## Operations

Deploy the three migrations, provision `darasax_push_public_key`, `darasax_push_private_key`, and `darasax_push_worker_secret` in Vault, and deploy `deliver-web-push` using `supabase/config.toml`. These are already configured for `psrtifnhstkujmschwem`. Deployment scripts and migration history contain no secret values.

Check Supabase Edge Function logs for `push_delivery` counts. Inspect `cron.job` / `cron.job_run_details` and `net._http_response` for scheduler or HTTP errors. Inspect only delivery counts/status/error codes when troubleshooting; do not log subscription URLs or private keys. Pausing the `darasax-web-push` cron job stops background delivery while leaving the in-app inbox available.

Validation: `node tests/web-push.mjs`; `tests/web-push.sql` is a rollback-only database test (no HTTP or pushes). The JS test includes a simulated 300-device batch, service-worker notification display/tap routing, endpoint SSRF checks, formatting, retry, and expiry handling. A physical Android/iPhone check remains necessary to confirm OS delivery and permission settings.
