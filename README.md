# DarasaX

**Everything for class. One place.**

DarasaX is a modern academic workspace for university students. It organizes modules, notes, assignments, past papers, timetables, announcements, study planning, and AI-assisted study tools in one responsive web app.

The same Next.js codebase serves four role-isolated web portals from one repository:

| Portal | Production URL | Role | Home | Auth |
|---|---|---|---|---|
| Student | https://darasax.vercel.app | `student` | `/dashboard` | Supabase email OTP + Google |
| Admin | https://darasax-admin.vercel.app | `admin` | `/admin` | Supabase staff session |
| Class Rep | https://darasax-cr.vercel.app | `class_rep` | `/cr` | Supabase staff session, self-register |
| Lecturer | https://darasax-lecturer.vercel.app | `lecturer` | `/lecturer` | Supabase staff session, self-register |

## Features

### Student portal

- Marketing landing page with features, how it works, Ask DarasaX, testimonials, and theme toggle.
- Sign up, email OTP verification, login, Google OAuth, forgot-password OTP, reset password, and onboarding for institution, programme, year, semester, and class.
- Dashboard with greeting, date pill, next-class banner, stat cards, and upcoming work.
- Next-class banner with Time, Room, and Lecturer blocks, humanized countdown, and white `View Module` action.
- Modules, topics, notes and materials, assignments, timetable, past papers, announcements, planner, Ask DarasaX, What Did I Miss, profile, and settings.
- Light and dark themes with Figtree typography across body and headings.

### Admin portal

- Secure staff login and role guard for programme operations.
- Students, class reps, streams, timetable editing, materials library, past papers, uploads, announcements, issues, analytics, and audit views.
- Timetable edits and uploads feed the live student timetable and library experience.

### Class Rep portal

- Self-registration with name, email, password, and stream, plus staff login.
- Class desk for members, attendance, assignments, materials, past papers, uploads, timetable, announcements, issues, and analytics.
- Supports day-to-day class operations without access to admin routes.

### Shared UX

- Figtree loaded with `next/font/google` and applied through the root layout.
- Responsive mobile-first layouts, dashboard shells, command search, notifications, empty states, and reusable UI primitives.
- Hard role isolation in routing so students cannot open `/admin` or `/cr`, and staff portals cannot open student routes.

## Tech stack

- Next.js 16.3.5 App Router + TypeScript
- React 19.2.8
- Tailwind CSS 4
- Framer Motion
- Lucide icons
- Supabase Auth and Postgres for student identity and profiles
- `next/font/google` self-hosted Figtree
- ESLint with `eslint-config-next`

## Repository structure

```text
src/
  app/
    page.tsx                  # Public landing page
    layout.tsx                # Root layout, Figtree, theme bootstrap
    globals.css               # Design tokens and global styles
    (auth)/                   # login, signup, register, verify-email, password flows, onboarding
    (dashboard)/              # dashboard, modules, assignments, timetable, past-papers, planner, ask, missed, profile, settings
    (admin)/admin/            # Admin portal routes
    (cr)/cr/                  # Class Rep portal routes
    api/staff/                # login, logout, register, session
  proxy.ts                    # Role isolation and auth gating
  lib/
    app-role.ts               # APP_ROLE resolution and route permissions
    staff-auth-server.ts      # Staff sessions and CR registry
    supabase/                 # Browser, server, and middleware clients
    auth/                     # Student profile helpers
    timetable-store.ts        # Timetable state
    materials-store.ts        # Materials state
    admin-people-store.ts     # Admin people state
  components/
    dashboard/                # Next-class banner, countdown, stat cards
    staff/                    # Staff shells, guards, editors, upload workspace
    auth/                     # Auth shells, alerts, forms, OAuth buttons
    layout/                   # Dashboard shell, navigation, search, notifications
    ui/                       # Buttons, badges, inputs, theme toggle
    brand/                    # Logo and branding
  data/                       # Mock academic and staff data
  types/                      # Shared TypeScript types
supabase/
  migrations/                 # Profiles table, triggers, RLS
  email-templates/            # Signup and recovery OTP templates
scripts/run-app.mjs           # Role-aware dev/start launcher
APPS.md                       # Local multi-portal ports and isolation notes
SUPABASE_SETUP.md             # Supabase, Google, SMTP, and production checklist
```

## Getting started

Prerequisites:

- Node.js 20+
- npm
- Supabase project for student auth
- Vercel access for production deploys

```bash
npm install
npm run dev:student
```

Open the requested portal:

| App | Command | Local URL |
|---|---|---|
| Student | `npm run dev:student` | http://localhost:3005/dashboard |
| Admin | `npm run dev:admin` | http://localhost:3006/admin |
| Class Rep | `npm run dev:cr` | http://localhost:3007/cr |

`npm run dev` defaults to the student app. Each role uses a separate Next.js dist directory locally so all three can run together.

Production behavior:

```bash
npm run build
npm run start:student
npm run start:admin
npm run start:cr
```

## Environment variables

Copy `.env.example` to `.env.local` for local student auth:

```bash
cp .env.example .env.local
```

| Variable | Used by | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Public Supabase project URL (one project for all portals). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Public anon key only. Never use service_role in the app. |
| `APP_ROLE` | All | Build-time role: `student`, `admin`, `class_rep`, or `lecturer`. Set this on Vercel. Do not add `NEXT_PUBLIC_APP_ROLE` manually. |

Class Rep accounts self-register at `/register` on the Class Rep app. The admin account is created once in Supabase Auth + `staff_profiles` (see `SUPABASE_SETUP.md` §3a).

## Authentication model

- Student routes use Supabase sessions. Protected pages redirect to `/login`, completed onboarding redirects to `/dashboard`, and incomplete onboarding redirects to `/onboarding`.
- Staff (admin / class rep) also sign in with Supabase Auth. Their role and stream come from `staff_profiles`; `src/proxy.ts` gates `/admin` and `/cr` on the matching active staff row.
- `src/proxy.ts` enforces role isolation before Supabase checks and adds `x-darasax-role` diagnostics headers.

## Data and storage

- `public.profiles` stores student profile and onboarding state with Row Level Security so users can only read and update their own profile.
- New Supabase users automatically get a profile row through `handle_new_user` (staff via `handle_new_staff`).
- Timetable, materials, monitored students, issues, and audit logs live in Supabase tables (`supabase/migrations/20260922000000_academic_data.sql`), scoped by RLS (students read own stream; staff scoped by role/stream).
- Uploaded files live in the private `materials` storage bucket; the app mints signed URLs for view/download. Only UI prefs (theme, selected stream) stay in `localStorage`.
- Supabase email templates for signup and recovery are versioned under `supabase/email-templates`.

## Deployment

One GitHub repository deploys to three Vercel projects under the `epro-tech` team:

- `darasax` with `APP_ROLE=student`
- `darasax-admin` with `APP_ROLE=admin`
- `darasax-cr` with `APP_ROLE=class_rep`
- `darasax-lecturer` with `APP_ROLE=lecturer`

Pushes to `main` trigger production deployments for all three portals. `next.config.ts` uses the default `.next` output on Vercel and role-specific `.next-*` directories only for local development.

## Scripts

- `npm run dev` — student development server
- `npm run dev:student` — student on port 3005
- `npm run dev:admin` — admin on port 3006
- `npm run dev:cr` — class rep on port 3007
- `npm run build` — production build
- `npm run start` — student production server
- `npm run start:student`, `npm run start:admin`, `npm run start:cr` — role-aware production servers
- `npm run lint` — ESLint

## Documentation

- `APPS.md` — local ports and role isolation summary
- `SUPABASE_SETUP.md` — full Supabase Auth, Google OAuth, redirect URL, SMTP, migration, and smoke-test guide
- `supabase/migrations/20260917000000_profiles.sql` — profiles schema and policies
- `supabase/migrations/20260922000000_academic_data.sql` — staff, timetable, materials, students, issues, audit, storage bucket, seeds

## Collaborating

1. Clone the repo and install dependencies.
2. Create a feature branch from `main`.
3. Make focused commits and open a pull request.
4. Review, merge to `main`, and let Vercel deploy all portals.
5. Share `.env.local` values securely and never commit secrets.
6. Add collaborators to GitHub, the Vercel `epro-tech` team, and Supabase as needed.

## Current limitations worth knowing

- Broader `npm run lint` reports pre-existing errors in unrelated files; targeted checks for changed UI files pass.
- Production email delivery needs custom SMTP in Supabase for reliable OTP delivery.
