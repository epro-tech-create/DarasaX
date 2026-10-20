# Private material storage on Cloudflare R2

New material uploads use R2. Authentication, metadata and class/module access
remain in the existing Supabase project. Existing Supabase material files are
still read through Supabase signed links; no bulk migration is performed.
Student avatars also remain in Supabase.

Configure these server-only environment variables on every active Vercel portal
(`darasax`, `darasax-admin`, `darasax-lecturer`) and in `.env.local` for local tests:

```dotenv
R2_BUCKET_NAME=notes
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY
```

Use the actual endpoint supplied by Cloudflare (jurisdiction-specific buckets
have different endpoints). Never prefix credentials with NEXT_PUBLIC_. Use an
R2 token with Object Read & Write restricted to the notes bucket. Keep public
bucket access disabled. No service-role Supabase key is needed.

In bucket Settings > CORS, allow GET, HEAD and PUT from the actual app origins;
allow the Content-Type header and expose ETag. Include http://localhost:3005,
http://localhost:3006 and http://localhost:3008 only when testing those local
portals. Browser-generated Content-Length is signed but does not need to be
manually set in JavaScript or added as a custom CORS header.

The server uses the existing staff_material_scope RPC and caller-session RLS.
Upload links are limited to a unique object, declared content type and byte
length, and expire in one hour. Files must be nonempty and at most 500 MiB
(524,288,000 bytes; shown as 500 MB in the app).
Read links also expire after 60 seconds. File paths prefixed with r2: identify
R2 objects; plain paths continue using the legacy Supabase bucket.

Replacement uploads use new keys. The metadata change completes before the old
object is removed. Deletion removes the authorized metadata row before deleting
the object. Failed cleanup, an interrupted upload or a failed metadata insert
can leave an unreferenced object; there is no automatic orphan sweeper yet.
Do not use a blanket lifecycle expiry on the material prefix, since that would
also delete active class files. Usage quotas, duplicate detection and billing
alerts are separate features and are not implemented by this integration.

## Verification before release

1. Deploy this updated source, not just a redeployment of the old source.
2. Sign in as an active class rep and upload a small PDF to their own class.
3. Confirm an object appears in notes and the metadata file_path starts r2:.
4. View and download it as a student in the same class; verify another class
   cannot read it or obtain its signed URL.
5. Check an anonymous request cannot obtain a private material URL.
6. Open an explicit material share link without signing in; verify that removing
   publication/share access prevents new signed links being generated.
7. Replace and delete the test material and check bucket cleanup.
8. Open a pre-existing Supabase file and its share link.
9. Test uploads from the admin and lecturer origins as well.

Local checks: node tests/r2-files.cjs, node tests/portal-access.cjs,
node tests/auth-redirect.cjs. The R2 test uses synthetic credentials for SDK
signing and mocked Supabase permission decisions; it does not contact R2.
