# Student registration directory and downloads

Admin > Students, CR > Class members and Lecturer > Students display Registration number. Lecturer Students is read-only and follows the selected teaching class. Missing numbers on older accounts display Not provided; students can add their own number in Profile. Numbers remain text and are never inferred from names or emails.

Every role has Download students (CSV). It requests a fresh complete roster from the server rather than exporting a possibly stale/paginated UI list. Fields: Full name, Registration number, Email, Class, Year, Admission status. The CSV is UTF-8 with a BOM, correctly escapes commas/quotes/newlines and protects against formula injection. It contains no passwords or auth tokens. When importing into spreadsheet software, select Text for registration numbers to retain leading zeros and long values.

`list_staff_students()` requires active authenticated staff. Admins can read all roster classes, CRs only their assigned class and lecturers only their teaching classes (with a fallback to the primary class for older staff records with no stream_ids). Registration data is joined via profile_id; admission table permissions are not broadened.

The export route checks the authenticated role again, applies the same class scope and allows a requested class only to narrow permitted records. All responses are private/no-store. Each portal's proxy leaves this endpoint to its own authorization checks, so admin/lecturer requests do not redirect to an HTML portal page. The client also verifies CSV content type before downloading.

Tests: `tests/student-export.cjs` checks all role scopes, selected-class filtering, anonymous/inactive denial, exact registration strings, formula safety and more than 1000 records. Run `tests/student-admission.sql` then `tests/student-directory.sql` in one rollback-only transaction to verify real database scopes. Existing invitations and student approval rules are unchanged.
