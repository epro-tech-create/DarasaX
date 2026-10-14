# DarasaX — Supabase Backend Setup

This guide covers the manual steps you must complete in Supabase / Google Cloud.
The application code is already wired for authentication and data.

All three portals (student, admin, class rep) share **one** Supabase project.
Staff (admin / class rep) sign in with Supabase Auth; their role and stream
come from the `staff_profiles` table. The `service_role` key is never used
by the app — all access is anon key + Row Level Security.

---

## 1) Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project (or select an existing one)
3. Wait until the database is ready

---

## 2) Environment variables

Copy `.env.example` to `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Fill in values from **Supabase → Project Settings → API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key
```

Never put the **service_role** key in frontend or `.env.local` for this Next.js app.

Restart the dev server after changing env vars.

---

## 3) Run the database migrations

In **Supabase → SQL Editor**, run each file in order
(**copy the full SQL contents**, not the file path):

1. `supabase/migrations/20260917000000_profiles.sql` — student `profiles`
2. `supabase/migrations/20260922000000_academic_data.sql` — everything else
3. `supabase/migrations/20260923100000_module_topics.sql` — staff-managed module topics
4. `supabase/migrations/20260923120000_lecturer_role.sql` — add `lecturer` staff role

Do **not** paste `supabase/migrations/...sql` as the query — that is a path, not SQL.

Alternatively, from the project root (after `supabase link`):

```bash
npx supabase db push
```

Migration 2 creates:

- `staff_profiles` (+ auto-create trigger for signups with staff role metadata)
- `timetable_entries`, `materials`, `monitored_students`, `issues`, `audit_log`
- RLS policies (students read own stream; staff scoped by role/stream)
- `increment_material_downloads()` RPC for download counting
- Private storage bucket `materials` (+ storage RLS; app mints signed URLs)
- Starter seed rows (timetable, students, issues, demo materials)

Migration 3 creates:

- `module_topics` — Admin/CR course outline per module (students mark done for progress)
- RLS: authenticated users read published topics; staff can create/edit/delete
- Seed topics for Sensor Networks, Database Admin, and Software Engineering

### 3a) Create the admin login

There is no public admin registration. In **Supabase → Authentication → Users → Add user**:

1. Create user with the admin email + a strong password (check "Auto Confirm User")
2. In **SQL Editor**, grant the admin role:

```sql
insert into public.staff_profiles (id, email, full_name, role, status)
select id, email, 'Admin Desk', 'admin', 'active'
from auth.users where email = 'admin@darasax.app'
on conflict (id) do update set role = 'admin', status = 'active';
```

Class reps self-register on the Class Rep portal (`/register`); an admin
then sets their stream/status on the Admin → Class reps page.

Lecturers self-register on the Lecturer portal, then complete onboarding
(classes + modules). Run these migrations in the SQL Editor if not applied yet:

- `supabase/migrations/20260923140000_lecturer_onboarding.sql`
- `supabase/migrations/20260923150000_staff_email_and_update_policy.sql`
  (keeps `staff_profiles.email` filled from Auth; fixes lecturer self-update RLS)

---

## 4) Enable Email authentication

**Authentication → Providers → Email**

Enable:

- Email provider
- Confirm email (recommended for V1)

Recommended for OTP flow:

- Use **OTP / token** email templates (see section 7)
- Disable “Secure email change” only if you understand the tradeoffs

---

## 5) Configure Site URL + Redirect URLs

**Authentication → URL Configuration**

### Local development

- Site URL: `http://localhost:3005`
- Redirect URLs (add all):
  - `http://localhost:3005/auth/callback`
  - `http://localhost:3005/**`

### Production

- Site URL: `https://your-domain.com`
- Redirect URLs:
  - `https://your-domain.com/auth/callback`
  - `https://your-domain.com/**`

---

## 6) Enable Google provider

**Authentication → Providers → Google**

1. Enable Google
2. Paste **Client ID** and **Client Secret** from Google Cloud
3. Save

Supabase callback URL (copy exactly from the Google provider panel):

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

---

## 7) Google Cloud Console setup

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. **APIs & Services → OAuth consent screen**
   - User type: External (or Internal for Workspace)
   - App name: DarasaX
   - Support email: your email
   - Save
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**  
   - Name: DarasaX Web
5. Authorized JavaScript origins: 
   - Local: `http://localhost:3005`
   - Production: `https://your-domain.com`
6. Authorized redirect URIs:
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
7. Copy Client ID + Client Secret into Supabase Google provider settings

--- 

## 8) Email templates (OTP)

Go to **Authentication → Email Templates**

### Confirm signup

Subject:

```text
Your DarasaX verification code
```

Body (use OTP token, not only a link):

```html
<h2>DarasaX</h2>
<p>Verify your email</p>
<p>Use the following verification code to finish creating your DarasaX account:</p>
<h1>{{ .Token }}</h1>
<p>This code will expire shortly.</p>
<p>If you didn't create a DarasaX account, you can ignore this email.</p>
<p><strong>DarasaX</strong><br/>Everything for class. One place.</p>
```

A polished HTML version is also in:

`supabase/email-templates/confirm-signup.html`

### Magic Link / Email OTP (used for password recovery OTP)

Ensure the template also prominently includes:

```html
{{ .Token }}
```

You can reuse the same branding from `supabase/email-templates/recovery-otp.html`.

---

## 9) Auth flows implemented in the app    

| Flow | Routes |
|---|---|
| Sign up + OTP | `/signup` → `/verify-email` → `/onboarding` → `/dashboard` |
| Login | `/login` → `/dashboard` or `/onboarding` |
| Google | `/login` or `/signup` → Google → `/auth/callback` |
| Forgot password OTP | `/forgot-password` → `/forgot-password/verify` → `/reset-password` → `/login` |
| Sign out | Settings → Account → Sign out |
| Class Rep register | CR `/register` → `/verify-email` (if confirmation on) → `/cr` |
| Staff login | Admin/CR `/login` → `/admin` or `/cr` |

Protected app routes redirect unauthenticated users to `/login`.

---

## 10) Local smoke test checklist

1. Register with a real email inbox you can open
2. Receive 6-digit code
3. Verify on `/verify-email`
4. Complete onboarding
5. Refresh `/dashboard` (session should persist)
6. Sign out
7. Sign in with email/password
8. Try Google sign-in
9. Forgot password → OTP → new password → login with new password

---

## Troubleshooting

**No email arrives**

- Check Supabase Auth logs
- Confirm email provider is enabled
- Check spam folder
- For production, configure custom SMTP in Supabase

**Google redirect mismatch**

- Redirect URI must be the Supabase callback URL, not your Next.js URL

**OTP always invalid**

- Confirm template uses `{{ .Token }}`
- Ensure you are verifying with the same email used at signup/recovery
- Check clock / expired token

**Profile errors**

- Re-run the SQL migration
- Confirm RLS policies exist


## Student and CR access on one domain

Apply `supabase/migrations/20261014000000_admin_managed_staff.sql` after earlier migrations using the Supabase SQL editor or `supabase db push` against the production project. Apply this security migration before deploying this revision. Review existing staff memberships and remove any unapproved accounts created under the former self-registration flow.

Deploy the updated student and admin projects. Students and CRs use `https://darasax.eprotechtz.com/login`. An active CR goes to `/cr`; other students go through normal onboarding/dashboard. In Admin > Class representatives > Add CR, enter the registered email of a verified student and select the stream. Their existing password stays unchanged. Delete CR membership to restore student access; inactive memberships remain blocked pending review.

Update the old CR deployment to redirect visitors to `https://darasax.eprotechtz.com/cr`, or set an equivalent Vercel domain redirect. The new code redirects the old portal without copying tokens between domains. Users sign in on the student domain if needed.

Admin and lecturer portals require active matching staff membership. Public staff registration is disabled. Administrators must manage lecturer stream/module assignments; staff cannot grant themselves additional scope. Keep service-role credentials server-only; this CR appointment flow uses an admin-authorized database function and needs no service-role key in the application.


### Production security migration status

On 2026-10-14, `20261014000000_admin_managed_staff.sql` was applied to project `psrtifnhstkujmschwem` and recorded as applied in migration history. Live checks confirmed staff self-registration is disabled, the membership guard is installed, and the admin appointment function exists. Transactional tests confirmed a CR cannot change their role or class scope, or appoint staff; those test writes were rolled back. Existing seven staff memberships were preserved. Application deployment remains separate.

Earlier schema changes exist in this database without recorded migration history. Do not blindly replay all earlier migrations with `db push`; reconcile their history against the live schema first. For another Supabase project, apply migrations in order and verify the resulting policies.


### Two representatives per class

On 2026-10-14, `20261014010000_two_class_representatives.sql` was applied to production. Each configured class supports two active CRs. Database triggers enforce this on appointment, activation, and class changes. Appointing a second CR does not replace the first. Deactivating or removing a CR frees a slot. Transactional live tests passed and were rolled back.

CRs retain their existing student authentication account and password. Administrators appoint them by verified email; passwords are never displayed to administrators. A CR who forgets their password uses the normal Forgot password flow. The updated admin UI must be deployed: older versions automatically deactivate other CRs when editing membership.


### Student profile photos

On 2026-10-15, `20261015000000_private_student_avatars.sql` was applied to project `psrtifnhstkujmschwem` and recorded in migration history. It creates a private `avatars` bucket with a 1 MB object limit and JPEG/PNG/WebP MIME types. Authenticated users may read, upload, and remove files only within their own UUID folder. The app validates images up to 5 MB, decodes and resizes them to at most 768 pixels, and uploads WebP images using unique filenames. Private photos use signed URLs; passwords and staff roles are not part of profile editing.

Transactional live RLS tests passed for own-avatar access, blocked foreign-avatar reads/uploads, and blocked edits to another student's profile. Profile and sidebar UI updates require deployment of the corresponding application commit.


### Topic explanations

On 2026-10-15, `20261015010000_topic_explanations.sql` was applied to production and recorded in migration history. It adds plain-text `content` and `learning_objectives` to `module_topics`, preserving existing summaries and RLS. In Admin > Topics, choose the module, enter the title, overview, explanation, and objectives (one per line), then publish. Students open the topic from the module Overview. Unpublished topics remain hidden from student accounts. The page lists module-level uploaded notes; those files are not represented as topic-specific attachments.


### Personal notification inboxes

On 2026-10-15, `20261015020000_personal_notifications.sql` was applied to production and recorded in migration history. Notifications are stored per authenticated recipient, with RLS preventing access to another user's inbox. Clients can update only their own `read_at` field, not notification content or recipients.

There is no historical backfill. Publishing a new material or topic captures the existing verified recipients at that moment. New accounts start with no notifications and receive future publications; draft content and ordinary edits create no new alerts. Class-specific materials notify the matching class and authorized staff. Authors are excluded from their own publications. Withdrawn/deleted sources remove their alerts. Historical materials remain accessible in their normal pages without appearing as new notifications.

The updated app removes shared localStorage read markers and mock assignment-deadline alerts. Read status persists across devices. Inboxes refresh on sign-in, window focus, marking read, and every 30 seconds while visible; no Realtime configuration is required. Database tests covered signup cutoffs, publication/draft transitions, deduplication, class isolation, independent read status, and blocked cross-user access, with all fixtures rolled back.
