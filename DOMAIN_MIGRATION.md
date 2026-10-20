# Move to darasax.com

Status: code prepared locally; production domains, DNS, authentication settings,
HTTPS, and deployment have not been changed or verified.

## Domain assignments

- `darasax.com`: Vercel project `darasax`, students and class reps (`/cr`).
- `www.darasax.com`: same project, redirect to `darasax.com`.
- `admin.darasax.com`: project `darasax-admin`.
- `lecturer.darasax.com`: project `darasax-lecturer`.
- Optional `cr.darasax.com`: project `darasax-cr`, which redirects to
  `https://darasax.com/cr` after deploying the updated code.

Keep the existing Supabase project and storage. This domain change does not
require copying users, academic data, or uploaded files.

## Cutover order

1. In the Vercel `epro-tech` team, add each domain in its project's Settings >
   Domains. Record the exact DNS and any ownership verification values shown.
2. In Namecheap, open Domain List > Manage > Advanced DNS for `darasax.com`.
   If Namecheap is the authoritative DNS provider, enter Vercel's assigned A
   record for host `@` and CNAME records for `www`, `admin`, and `lecturer`.
   Add any requested verification TXT record. Use Vercel's actual values;
   do not guess the IP or CNAME. Replace only conflicting web/parking records
   for these hosts. Preserve MX and unrelated TXT records.
   If custom nameservers are already in use, edit DNS at that provider instead.
3. In Supabase Authentication > URL Configuration, set Site URL to
   `https://darasax.com`. Allow the actual new authentication callback URLs,
   including `https://darasax.com/auth/callback`, and the admin/lecturer callback
   URLs if those portals use OAuth. Retain old URLs during transition.
   Review email templates for hardcoded old links. If a Google OAuth consent
   screen or authorized origin lists the old website, update it as appropriate;
   the existing Supabase OAuth callback remains on the Supabase project domain.
4. Wait until Vercel reports valid configuration and HTTPS for all new domains.
   Deploy the prepared code to the existing projects. Keep their APP_ROLE values.
5. Verify student login, signup/OTP, Google callback, password recovery, CR
   access at `/cr`, admin and lecturer access, and a material share link/QR code.
   Existing sessions are tied to the old origins: users should sign in again.
6. Once these checks pass, configure the old custom domains to redirect to their
   corresponding new domains, preserving paths and query strings. Keep old
   material share URLs working through redirects. Redirect the old CR entry to
   `https://darasax.com/cr`. Do not redirect the entire unrelated
   `eprotechtz.com` website.

## Access needed

The connected Vercel account returned HTTP 403 for team
`team_dxCuoZATX4yySlOmSSYwYCB0` (`epro-tech`). No authenticated local Vercel CLI
was found. Domain attachment and exact DNS values still require access to this
team. Namecheap DNS and Supabase settings also remain pending.

References:
- https://vercel.com/docs/domains/working-with-domains/add-a-domain
- https://www.namecheap.com/support/knowledgebase/article.aspx/434/2237/how-do-i-set-up-host-records-for-a-domain/
