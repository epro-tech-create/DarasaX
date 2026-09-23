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
