# Staff loading and CR timetable

The student login form warms the CAPTCHA script on mount, while the visitor
enters their credentials. This removes script loading from submission whenever
the warm-up has completed. It does not execute or cache verification tokens;
each protected operation still performs a fresh check. A failed warm-up is
retried by the normal submission path.

Google sign-in performs one browser redirect. The OAuth callback uses the user
returned by the authenticated PKCE code exchange, loads independent account
checks concurrently, and reuses the profile read during profile completion.
The proxy lets the callback perform its own authentication and authorization
instead of first checking the previous session. Login audit writes run after the
server response, or in the background during client navigation, so logging does
not delay entry. Role, enrollment, admission and administrator email checks
still finish before access is granted.

Vercel Functions are pinned to Dublin (dub1), matching the existing Supabase
project in eu-west-1, instead of using the default US region (iad1). Static
assets continue to use the global CDN. This reduces the geographic distance
for server-to-database requests; it is not a measured latency guarantee.

Staff layouts pass their already verified server profile to a shared client
session provider. Staff guards, navigation, library controls and page components
use that profile immediately instead of independently repeating getUser and
staff_profiles calls after hydration. Server membership checks and database RLS
remain in place. Focus/session events refresh the shared client session; signout
clears it immediately and invalidates outstanding refreshes.

Outside these layouts, concurrent staff-session reads share one in-flight
request and reuse the result for 15 seconds. Class lists and staff directory
reads are also deduplicated. CR overview/member pages load the roster without
fetching the audit log, CR directory or class registry. Background roster polling
pauses while the tab is hidden. The startup splash starts fading as soon as
hydration completes and is removed after 180 ms instead of 850 ms.

Cache invalidation cannot allow an older in-flight result to overwrite a new
result or evict it after an older request fails. Auth changes clear query caches.
The test in tests/query-cache.cjs verifies this behavior and confirms that six
concurrent fallback staff-session consumers make one auth/profile request pair.
These are request-count checks, not a real-user latency benchmark.

Student and CR timetables use the same TimetableView component. The CR is locked
to their assigned class and can add/edit sessions in a lazily loaded modal.
Other classes remain governed by existing database permissions. Successful
changes refresh other mounted timetable views and the CR next-class banner.
Each overview navigation card has a unique destination; recent material items
open their actual file instead of all navigating to Library.

The topic form exposes module, number, title, optional description and published
state. Duration, duplicate summary and learning-objective inputs are removed.
Existing stored details are preserved during edits for compatibility.
