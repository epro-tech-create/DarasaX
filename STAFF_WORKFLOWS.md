# Staff workflows

Uploads are available from Library > Upload in each staff portal. The upload
form opens in a modal; old /uploads bookmarks redirect to Library. Files still
use private R2 storage with the 500 MB limit and Supabase class/module scope.

CR Classes, Issues and Attendance pages have been retired. Old links redirect
to the CR overview. Admin Issues links redirect to the admin overview. Only
active admins can create or archive classes, including through database RPCs.

Admin > Students and CR > Members now require a temporary password when adding
a new student. The create-student Supabase Edge Function validates the caller
session and active staff membership. CRs can create students only in their own
class; admins choose an available class in the current cohort. It creates a
confirmed Supabase Auth account and initializes the matching profile; the
existing profile trigger populates the linked roster. Existing accounts and
passwords are never overwritten. Failed profile/roster setup rolls back the
new account.

Staff must share the temporary password privately. Passwords are not saved in
roster records, returned in responses, or included in audit logs. Students sign
in with their email and temporary password, then use Profile > Change password.
Changing the password verifies their current password first. This flow allows
password changes; it does not force a change at first login. Existing Google-only
users can continue using the email recovery flow to set a password.

The function is deployed to the existing DarasaX Supabase project with JWT
verification enabled and uses the built-in server environment secrets. It
requires no service-role key in Vercel or the browser.

Checks: node tests/student-provisioning.cjs and the existing portal, auth callback,
and R2 tests. Provisioning tests mock Auth and database responses; live checks
verify anonymous rejection, CORS and admin-only class permissions. Signed-in
account creation and password changes still require a live staff/student test.
