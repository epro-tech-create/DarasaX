# Administrator email verification

The administrator flow uses a password and an emailed verification code. This is email step-up verification, not Supabase authenticator-app MFA; it does not claim `aal2`.

After password sign-in, administrators visit `/admin-verify-email` and continue securely. A browser that has not been trusted receives a numeric code at the authenticated administrator's own email address. The user enters the code before opening `/admin`. There is no user-supplied recipient field.

The optional **Trust this browser for 30 days** checkbox is off by default and is intended for personal devices only. A trusted browser still requires the correct password. Cookies are host-only, HttpOnly, Secure in production, SameSite Strict, and account-bound. Database records contain token hashes, never the raw browser token or the email code. IP addresses and browser fingerprints are not collected.

Normal sign-out removes the authenticated session, pending challenge cookie and cached identity, while an explicitly trusted browser remains recognized. **Personal Profile > Forget this browser and sign out** revokes its trust. Clearing browser cookies, using private browsing, or trust expiry requires email verification again.

## Enforcement

- Only active administrator accounts can start or finish verification.
- A challenge requires a recent password-authenticated session. It is bound to that administrator, expires after ten minutes, allows five verification attempts, and cannot be resent more than once per minute. Resending does not reset exhausted attempts within that challenge window.
- Verification uses Supabase Auth email OTP and checks that the resulting identity is the same administrator. The database independently requires a fresh Auth-signed OTP proof and a matching, unused challenge.
- A verified session lasts up to twelve hours and is tied to a live Supabase session. Session revocation removes its approval. The app's existing inactivity sign-out still applies.
- Server layouts, proxy guards, private file handlers and student exports enforce the email check. Existing database and Storage policies reuse authorization helpers whose administrator branch now requires verification. Privileged RPCs that inspected administrator membership directly perform the same check. There is no project-wide request hook or blanket RLS policy change.
- Membership RLS still allows an unverified administrator to read their own profile, which is necessary to finish sign-in. Student, CR and Lecturer permission branches are preserved.

## Email configuration and real-mail test

Use production project `psrtifnhstkujmschwem`. Email OTP uses **Authentication > Email Templates > Magic Link**, separate from the student/lecturer **Confirm signup** template. The Magic Link template must contain `{{ .Token }}` and OTP length must match `AUTH_OTP_LENGTH` (currently six). The user confirmed that this template displays the code. Existing Resend SMTP settings are reused.

Verify with an administrator's own mailbox: sign out, use a new browser, sign in with the password, send and enter the code, and check that Admin opens only after verification. Optionally trust that browser, sign out and sign in again to check recognition, then revoke it from Personal Profile. Automated tests never send real emails.

## Migration rollout and rollback

Supporting schema is applied with enforcement initially disabled. Deploy the verification screens to all portals and check that they are reachable before applying the activation migration. The existing lecturer is also placed into pending approval, preserving their teaching setup. This order prevents the old administrator UI from being locked out before the verification UI exists.

The isolated PostgreSQL fixture and `tests/admin-email-security.sql` exercise the migrations with synthetic users, sessions, claims, RLS and account-bound proofs. `tests/admin-email-api.cjs` covers the server endpoint without sending email. These complement, rather than replace, a real Supabase mailbox test.

An authorized database operator can roll back enforcement by setting `private.admin_security_policy.enabled` to false. Keep the schema and pending lecturer approvals in place; never automatically approve pending lecturers as part of an administrator-login rollback.

## Invited administrator accounts

Only the operator-designated invitations in `private.administrator_invitations` provision new administrators. The table is private, protected by RLS, and unavailable to browser roles. An Auth trigger claims an invitation only after Supabase confirms the exact email address; user-editable metadata never grants a role. Invitations bind to an Auth user ID and cannot be claimed by another account. Reconfirming an email cannot reactivate a disabled membership. Changing away from the invited email disables the membership and removes verified sessions and trusted browsers.

The retired `admin@darasax.app` membership is inactive and its sessions and browser approvals are revoked. Its records are preserved. Allan's verified account (`allandavinc89@gmail.com`) is claimed immediately upon migration. For `eprocreativ12@gmail.com`, any pre-existing password and active sessions are cleared, and the invitation remains unbound until their first sign-in.

New invitees open `https://admin.darasax.com/signup`, choose their password, verify their email code, and sign in with that password. An invited account with a cleared password can set their password via `https://admin.darasax.com/forgot-password` (or via an email invitation link) and bind on their first sign-in. Administrator sign-in still requires the separate email check.

Local integration coverage: `tests/designated-administrators.sql` runs on the isolated security fixture, with the designated-administrator migration substituted at its `APPLY_MIGRATION_HERE` marker. It tests the old account's revocation, Allan's immediate verified claim, Epro's cleared password and binding on first sign-in, uninvited metadata rejection, private-table/RPC denial, inactive membership preservation, and email-change revocation. All emails in the fixture are synthetic Auth rows; no email is sent.
