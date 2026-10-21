# Material uploads

Library uploads in Admin, CR and Lecturer start with **All streams**. Staff can instead choose an active class. CRs and lecturers can publish to any supported class, as explicitly requested by the site owner. Lecturers remain limited to their teaching modules. Unassigned lecturer modules never fall back to the entire catalog.

The file picker and drop area accept multiple files. Every file has its own editable title and upload state. Type, module, stream and optional assignment deadline apply to the pending batch. Three files upload concurrently, each limited to 500 MiB (shown as 500 MB in the interface). A failed file does not cancel its siblings; retry publishes only files that have not succeeded. The library refresh event runs once after each batch.

A global publication uses `materials.stream_id = NULL` and one private R2 object under `__all__/material-id/uploader-id/random-id/file-name`. Class publications retain their class prefix. Global files are not copied once per stream. Private read/download URLs still require a signed-in viewer and existing approval/cohort checks.

`can_publish_material` controls the expanded publication audience. `can_manage_material` preserves existing class/module management rights and adds ownership of the uploader's publications outside those original classes. Reading someone else's global publication does not grant editing or deletion. An author guard prevents non-admins from changing the uploader identity or role. New inserts must identify the authenticated uploader and their actual staff role. Administrator email step-up remains mandatory.

Material RLS, shared links and download counting use the same global-aware read predicate. Pending students, anonymous users and inactive lecturers do not gain access. There were no existing published global records when this migration was applied.

Verification includes `tests/upload-batch.cjs`, `tests/r2-files.cjs` and `tests/private-sharing.cjs`. For database checks, clone the isolated security fixture, apply `tests/global-materials-fixture.sql`, then the global-material migration and `tests/global-materials.sql`. These fixtures use only synthetic identities/files and send no emails or R2 uploads. Actual large-file transfer throughput depends on the uploader's connection and must be checked with their own signed-in session.
