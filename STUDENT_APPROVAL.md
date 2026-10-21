# Student admission and private sharing

New students verify their email, provide a unique registration number, choose their class and complete onboarding. Registration numbers are text containing ASCII digits only; any prefix is accepted (example: `240242400506`). There is no fixed length; a 64-character input ceiling prevents oversized requests. Leading zeroes are preserved. UUIDs remain the internal account keys.

Completed registrations wait on `/pending-approval`. Administrators review all classes from Students; CRs review only their assigned class from Class members. Approve and Reject require no separate number-verification step. Approved students see `/welcome` once, acknowledge it, then enter the dashboard (or resume a shared file). Rejected or suspended accounts cannot access class resources. Active staff accounts keep their existing role permissions.

Existing completed students retain approved access and can add a registration number in Profile. Their numbers are not invented or copied from emails. Administrator/CR-created students require a unique number and temporary password and are approved immediately; their first login shows the welcome page. Approved registration numbers cannot be changed by students.

Approval is held in `student_admissions`, not user-editable auth metadata. Authenticated clients can read their own record, but can write only through scoped database functions. Database RLS uses `active_student_stream()` to restrict materials, timetable, topics and notifications. Share links identify resources and require a signed-in approved student in the same class, or authorized staff. Anonymous share RPC access and the old share-token storage policy are removed. Storage remains private and signed file links expire after 60 seconds.

## Deployment order

Apply `supabase/migrations/20261021053428_student_registration_approval_and_private_sharing.sql`, deploy `supabase/functions/create-student/index.js` with JWT verification, then deploy all portals from the same commit. Existing users are preserved by the migration.

## Verification

`tests/student-admission.cjs`, `tests/private-sharing.cjs`, `tests/auth-redirect.cjs`, `tests/portal-access.cjs`, and `tests/student-provisioning.cjs` exercise input, redirects, authorization and provisioning. Run `tests/student-admission.sql` in a transaction after the migration and roll it back: it checks real database privileges, unique-number claims, CR class boundaries, pending/approved/suspended file visibility, sharing and welcome acknowledgement with synthetic users. Fixture class BENG24COE-4 must have capacity for a temporary CR.

CR invitation exception: reusable invitations expire after seven days and automatically approve the invited class after the same verified-email and unique-number checks. Existing class assignments, rejections and suspensions cannot be bypassed. See CLASS_INVITATIONS_AND_SIGNOUT.md.
