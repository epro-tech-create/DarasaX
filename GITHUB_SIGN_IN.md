GitHub buttons are enabled on student login/signup and assigned staff login screens after the user confirmed the Supabase provider is enabled. Staff signup retains its email verification flow.

# GitHub sign-in

The login, signup and assigned staff login screens use Supabase GitHub OAuth with PKCE. The existing `/auth/callback` exchanges the code, creates/synchronizes the profile, records sign-in and enforces role, cohort, registration and approval gates. Shared-file return paths are preserved for students. GitHub sign-in never grants staff membership or student approval.

Production Supabase project: `psrtifnhstkujmschwem`.

Enable GitHub under Authentication > Sign In / Providers in that project, with the Client ID and Client Secret from the GitHub OAuth App. GitHub's Authorization callback URL must be:

`https://psrtifnhstkujmschwem.supabase.co/auth/v1/callback`

Supabase's redirect allow list must include `https://www.darasax.com/auth/callback`, `https://darasax.com/auth/callback`, and the admin/lecturer callback URLs if using GitHub on those portals. Keep client secrets in Supabase only.

At implementation, the production `/auth/v1/settings` endpoint reported `external.github=false`; `/auth/v1/authorize?provider=github` returned HTTP 400. The frontend is ready, but successful sign-in cannot be verified until the provider is enabled and configured. A GitHub connector connection does not enable application OAuth.

Run `node tests/github-oauth.cjs`, `node tests/auth-redirect.cjs`, `node tests/portal-access.cjs` and `node tests/private-sharing.cjs` for regressions. Live verification should click Continue with GitHub, authorize the named OAuth App, return to DarasaX, and check the appropriate existing student/staff admission state. Do not grant organization/repository permissions: only profile/email identity is requested.
