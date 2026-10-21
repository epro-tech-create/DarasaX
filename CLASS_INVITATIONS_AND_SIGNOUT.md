# Class invitations and sign-out

GitHub sign-in stays hidden until the owner requests activation.

## CR invitations

Class members > Invite students generates a reusable 128-bit random invitation code with a seven-day expiry, a join link and a downloadable PNG QR code. CRs may revoke or replace their own invitation. A replacement invalidates the old code. An invitation also stops working when its CR becomes inactive, changes class, or its class is archived.

The public `/join` page reveals only the target class label/ID and expiry for a valid code. Students authenticate first and supply a unique digits-only registration number. Redemption reuses the standard verified-email, academic cohort, registration-number uniqueness and immutability checks. It completes onboarding into the invitation class and approves access atomically, with an audit entry. New approvals retain the one-time congratulations page.

Students who register normally still wait for CR/admin approval. Existing completed accounts cannot switch classes through invitations. Rejected or suspended students cannot use invitations to regain access. Staff accounts cannot redeem invitations as students. Raw invitation rows are not exposed to browser clients; creation and redemption have explicit role checks and no anonymous write grants.

## Sign-out

Student, CR, admin and lecturer headers show a labelled Sign out button at phone widths. Student Profile and Settings also expose sign-out. All portals use the same flow: POST to a same-origin-only sign-out handler, revoke the current Supabase session, expire its cookie chunks and PKCE verifier, clear temporary verification/class selection/auth storage and query caches, then replace the page with Login to discard the Next router cache. Google already requests account selection on each OAuth attempt.

The handler still expires this browser's authentication cookies if Supabase is unavailable; it does not claim successful remote revocation in that case. Browser Back restores trigger a reload to enforce server authorization instead of displaying an old account snapshot. Theme preferences and account records are preserved.

## Verification

Run `tests/sign-out.cjs`, `tests/student-admission.cjs`, `tests/auth-redirect.cjs`, `tests/portal-access.cjs`, `tests/query-cache.cjs`, and `tests/private-sharing.cjs`. Database integration tests run `tests/student-admission.sql` followed by `tests/class-invitations.sql` in one rollback-only transaction after applying the migrations. All synthetic users, materials and codes roll back.
