# Mbunge and student messages

The database migration was applied to DarasaX on 2 November 2026 with user
authorization. No website deployment was made. Existing records were retained;
the three new tables started empty. The previous mock preview was removed.

## Administrator appointment

The existing administrator portal has a **Mbunge** page at `/admin/mbunge`.
An administrator who has completed email verification can appoint a student
using their existing registered email, or revoke the appointment. The selected
student must be verified, approved, onboarded, and in an active supported class.
An account with a staff membership cannot be appointed through this flow.
There is one active appointment for the current supported cohort. Remove it
before appointing a different student.

The student keeps their login, class, dashboard, sidebar, and five-item mobile
bottom navigation. **Mbunge tools** appears in the sidebar and the existing
More menu, leading to:

- `/mbunge/announcements`: the existing CR announcement workspace.
- `/mbunge/students`: read-only directory of approved students, filtered by class.
- `/mbunge/timetable`: the CR timetable/session editor with all-class selection.
- `/mbunge/materials`: the CR library and upload dialog with all-class recipients.

The role is a separate `mbunge_appointments` capability. It does not create a
`staff_profiles` row, change `is_staff()`, or grant student approval, topic
editing, account administration, or access to other students' assignment hand-ins.
Existing CR material components still store the `class_rep` content publisher
value; database authorization requires the separate active Mbunge appointment
and matching author ID. UI compatibility never grants database membership.
Revocation is checked on every database operation and each server render.
Client navigation refreshes membership on focus and within 30 seconds.

## Messages

A bottom-right floating button is available throughout the student, CR and admin
portals, above the mobile navigation. It opens `/messages`, `/cr/messages` or
`/admin/messages` in the appropriate layout. Lecturers have no chat button or
chat access. The Messages heading and introductory description are omitted. **My Class** uses the authenticated student's actual class;
**All Classes** is shared by students, CRs and verified administrators. CRs also
have their assigned class room; administrators use the shared room. Rooms start empty. Messages, sender
identity, read receipts and unread counts are stored in Supabase. There is no
mock chat or browser-local message storage.

Messages refresh every five seconds while visible. Badge counts refresh every
15 seconds, on focus, and after sending/reading. Enter sends; Shift+Enter adds a
line. Senders can delete their own messages. Database rules block other-class
rooms, author spoofing, unapproved students and nonmembers. Names/timestamps
are stamped by the database; sending is limited to 30 messages per minute.
The latest 60 messages load initially; earlier messages can be loaded in batches
up to 600. Message history uses polling.

Typing uses private Supabase Realtime Presence channels scoped to the same
rooms. An animated three-dot bubble says “Someone is typing…” or “Several
people are typing…”. Only activity flags are shared, never draft text. Activity
is throttled, stops after 2.5 seconds idle, and clears on send, blur, background,
room change or disconnect. Stale remote flags expire after six seconds. The
animation respects reduced-motion preferences and has a live status label.
The additive `20261102041432_chat_typing_presence.sql` migration installs the
room-scoped Presence policies. No existing records were changed or removed.

## Migration and verification

The applied migration is
`supabase/migrations/20261102041042_mbunge_and_class_chat.sql`.
Its timestamp matches the hosted migration history. It adds the chat and
appointment tables, access policies and supporting functions without deleting
or updating existing records. No fake appointments or messages were inserted.

Tests can run against an empty, isolated local PostgreSQL database:

```powershell
psql -v ON_ERROR_STOP=1 -d <empty-test-database> -f tests/mbunge-fixture.sql -f tests/mbunge-security.sql
```

The fixture contains only synthetic test identities and must never run on a
hosted database. Security assertions roll back all identities and records.
They cover administrator step-up, self-appointment denial, duplicate appointment
denial, cohort/class scope, normal CR behavior, revocation, publishing, timetable
permissions, chat author stamping, room privacy, deletion and unread receipts.
Scheduling scope tests use minimal stand-ins for existing scheduling transactions;
the migration only changes their access predicate and retains existing behavior.

The additive `20261102045753_staff_chat_access.sql` migration enables scoped CR
and verified administrator chat access without changing existing records.
