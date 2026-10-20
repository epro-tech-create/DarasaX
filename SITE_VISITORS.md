# Website visitors in admin Overview

The public student site sends a same-origin POST to /api/site-visits on browser
navigation. Admin and lecturer portals and preview deployments do not record
visits. Known crawler/headless user agents are skipped; this is not exhaustive
bot detection. Ad blockers, disabled JavaScript and failed requests can undercount.

On production Vercel the route uses x-vercel-forwarded-for, validates it as an
IP, and derives an HMAC-SHA256 identifier from the Tanzania calendar day and IP.
Raw IPs and visited URLs are never stored in the analytics database. Different
days produce different identifiers. Shared networks can undercount people and
IP changes can overcount them. A reverse proxy in front of Vercel may obscure
the real visitor IP; use DNS-only Vercel records unless trusted proxy handling
has been deliberately configured.

VISITOR_TRACKING_SECRET is a server-only production secret in the darasax Vercel
project. Its SHA-256 digest is provisioned separately into the private database
config table. Neither value belongs in source control. A protected recording
RPC validates the secret before inserting a day/hash key, then atomically
increments the day's aggregate only for a new key. Hashed keys older than
30 days are cleaned up on new visits; aggregate daily totals remain. There is
no attempt to backfill historical visitors.

Only an authenticated admin can read the 14-day summary. No raw identifiers or
tracking configuration are exposed to the browser. Changing the secret during
a day can cause repeat visitors to count again that day.

Tests: node tests/site-visitors.cjs checks timezone, header handling and hashing.
Transactional database checks verify deduplication, invalid-secret rejection and
admin-only summaries, rolling test counts back afterward.
