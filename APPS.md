# DarasaX apps (separate ports)

Run each workspace on its own port. Roles are isolated by proxy + client guards.

| App | Command | Port | Home |
|---|---|---|---|
| Student | `npm run dev:student` | **3005** | `/dashboard` |
| Admin | `npm run dev:admin` | **3006** | `/admin` |
| Class Rep | `npm run dev:cr` | **3007** | `/cr` |

- Students cannot open `/admin` or `/cr`
- Admin cannot open student routes or `/cr`
- Class Rep cannot open student routes or `/admin`

Timetable edits on Admin/CR update the live student timetable (shared local store).
Uploads publish straight into the student Past Papers / library feed.
