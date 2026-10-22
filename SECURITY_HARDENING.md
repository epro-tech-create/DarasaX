# Security hardening release - 22 October 2026

No database migrations, grants, table changes, or account deletions are part of this release. The user separately authorized adding tricksrayy@gmail.com to the existing administrator allowlist; only that invitation and administrator membership were added.

Implemented:
- Per-request cryptographic script nonces and strict CSP; production scripts cannot use inline code without the matching nonce or eval. Next runtime, theme initialization and structured data receive the nonce.
- Dynamic rendering and private/no-store page responses prevent sharing a nonce across users. Static image caching remains.
- Frame-ancestors none plus X-Frame-Options DENY, MIME-sniffing protection, referrer and browser-permission restrictions, HSTS including subdomains.
- Required Supabase HTTPS/WebSocket, R2 upload/download, image, PDF preview and service-worker connections remain permitted. Inline styles remain allowed for React/Framer Motion; this is not a style-injection ban.
- New passwords chosen through the app require at least 12 characters and reject a small explicit list of common/repeated strings. This is a local screening list, not a comprehensive breached-password service. Existing login passwords remain valid. Supabase Auth now also enforces a 12-character minimum for future passwords.
- Signup no longer displays an existing-account-specific error based on the identity response.

Outstanding outside this code release:
- Managed Turnstile integration now obtains a fresh single-use token for password login, signup, recovery, OTP sends and resends; verification, OAuth and refresh are excluded. The admin email sender forwards the token to Supabase for validation. The public widget key is configured on all production portal projects; the private verification key belongs only in Supabase Auth. All four production builds deployed successfully; the user confirmed administrator sign-in and OTP before enforcement. Supabase Turnstile enforcement is now enabled and persisted. Production password requests without a token were rejected with captcha_failed, both with and without an Authorization header. The user has not yet confirmed a full sign-in after provider enforcement.
- Auth settings verified: signup/sign-in requests 100 per five minutes per IP; minimum interval between emails to the same user 60 seconds. These existing limits were retained to avoid penalizing shared campus networks. The Auth minimum has been set to 12; leaked-password rejection is unavailable on the current Free plan.
- Anonymous database grants and invitation-resolver throttling remain unchanged under the user's no-database-change restriction.
- DNS DMARC/DKIM changes require verifying actual legitimate senders first; this release changes no DNS.

Validation: tests/security-headers.cjs, tests/password-policy.cjs, tests/portal-access.cjs, existing auth redirect, upload, sharing and web-push tests; TypeScript and focused ESLint. Browser/runtime nonce and CSP checks are required before deployment. Build checks do not constitute a complete security audit.
