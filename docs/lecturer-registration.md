# Lecturer registration and verification

Lecturers use `https://lecturer.darasax.com/signup` with full name, email and a password (minimum eight characters). Google and GitHub are absent from this flow. They enter the emailed verification code and wait on `/lecturer-approval`. An administrator reviews the application at **Admin > Lecturers**. Once approved, the lecturer selects their classes and modules before entering the workspace.

Email verification reserves an inactive lecturer membership and submits a pending application; it does not grant portal or class access. Only an administrator can approve or reject an application. The existing lecturer is also moved to pending approval; their teaching setup is preserved for reactivation after approval. A rejected application cannot be resubmitted to bypass the decision. Existing student registrations and other staff roles cannot use this flow to change roles. Administrator and CR provisioning remain restricted.

## Supabase setup

Use production project `psrtifnhstkujmschwem`, shared by the portals.

1. In **Authentication > Sign In / Providers > Email**, enable Email and **Confirm email**. Allow new signups. Production public Auth settings were checked on 21 October 2026: email enabled, signup enabled, auto-confirm disabled.
2. In **Authentication > URL Configuration > Redirect URLs**, add the exact URL `https://lecturer.darasax.com/auth/callback`. Keep the existing student and other portal URLs. Keep the shared Site URL pointing to the main DarasaX site.
3. In **Authentication > Email Templates > Confirm signup**, include `{{ .Token }}` in the email body. The frontend expects a six-digit code; the Auth email OTP length must match `src/lib/auth/constants.ts`. Example body:

   ```html
   <h2>Verify your DarasaX email</h2>
   <p>Enter this verification code on the DarasaX page where you registered:</p>
   <p style="font-size:28px;letter-spacing:6px;font-weight:bold">{{ .Token }}</p>
   <p>If you did not request this account, ignore this email.</p>
   ```

4. Keep the existing custom SMTP configuration that sends student verification emails. For Resend SMTP, the host is `smtp.resend.com`, username `resend`, password a Resend API key, and port 465 (TLS) or 587 (STARTTLS). The sender address must use a verified Resend domain. Configure secrets directly in Supabase, never in frontend environment variables.
5. Test with a new email you control. Create the lecturer account, confirm receipt (including spam), enter the code, and check that access is pending. Approve it from **Admin > Lecturers**, then let the lecturer check approval status, complete teaching setup, sign out and sign back in. A code expires according to the project's Auth settings. The verification screen provides resend after its cooldown.

SMTP and confirmation templates are shared across the project. Keep the message suitable for both students and lecturers. Delivery to a real mailbox still needs this manual test; automated database tests do not send emails.

## Student PDF exports

Admin, CR and Lecturer student tables use the same PDF download endpoint. Admin can export all or a selected class; CR is limited to their class; lecturers are limited to their assigned classes. The A4 landscape report includes names, exact registration numbers, emails, class, year and admission status, with repeated table headings, generation time in Tanzania time, and page numbers. Downloads require active staff authorization and are never publicly cached.
