# Timetable imports and assignment hand-in

CRs and admins can open **Timetable → Import timetable**, choose a document, review all extracted sessions, correct missing details or clashes, choose the effective date, and apply the schedule atomically. Imports support `.xlsx`, PDF, JPG/JPEG, and PNG, up to 10 MB and five PDF pages. Row-based Excel columns `Day, Start, End, Module, Room, Lecturer` are the most reliable format. Common day/time matrix layouts are also recognized. PDF and image recognition may require manual corrections; documents never update the schedule without confirmation.

Text extraction uses ExcelJS and pdf-parse. Image and scanned-PDF OCR uses Tesseract, with no AI API key. Its English language model downloads on first use and is cached in the host's temporary directory. Parser dependencies remain server-only. A class rep can import only their class; lecturers use the existing session editor. Imports retain previous schedule versions and carry future exceptions onto matching module/day sessions. Unmatched dated exceptions remain visible on their original series. Only the latest import can be undone while its effective date has not passed, and undo is blocked after session edits to the imported schedule.

Staff can open **three-dot menu → Assignments** or use the Library. Publishing an assignment includes an **Accept online submissions** checkbox, off by default. Online assignments must target a specific class. Each assignment's **Submissions** button opens the private inbox and allows staff to enable or disable uploads later.

Students open the assignment detail page to upload a single PDF, JPG/PNG, DOCX, XLSX, ZIP, or TXT file up to 20 MB. A replacement is accepted only while online hand-in remains enabled and the deadline has not passed. Without a deadline, submissions remain open until staff disable them. Server-side checks enforce deadlines and approved class membership; the client clock is only a display aid. Student names and registration numbers are copied from the account, not the upload request.

Student work uses the private Supabase `assignment-submissions` bucket, separate from public teaching material. Only the submitting student, active class CR, verified admins, and active lecturers assigned to both the class and module may read it. Downloads use short-lived signed URLs and attachment disposition. Failed uploads and replaced objects are cleaned up where possible.

Database migrations: `20261031105707_timetable_imports_assignment_submissions.sql` and `20261031110342_preserve_import_exceptions.sql`.

Validation: `node tests/timetable-import.cjs` exercises real Excel, PDF, image OCR, and scanned-PDF extraction. `tests/imports-submissions.sql` is a rollback-only database integration test covering authorization, storage policies, deadline/replacement rules, offline hand-in, imports, clashes, history, dated exceptions, and undo. Existing upload, timetable, portal, and file authorization checks also apply.
