# Interface languages

Students choose English or Kiswahili in Profile (also available in Settings).
Admin, CR and Lecturer each have a Personal Profile navigation item with the
same language control and account security form.

English is the default. Choosing Kiswahili changes interface labels, navigation,
forms, empty states, known validation messages and dynamic activity counts.
Switching languages uses React context without reloading pages or clearing forms.
Course names, student names, uploaded filenames and authored academic content
are kept in their original language. Documents themselves are not translated.

The setting is stored in the signed-in user's Supabase Auth metadata as
`preferred_language: "en" | "sw"`. This is a display preference only; it is never
used to grant roles or access. Local storage caches the preference for rendering
and synchronizes tabs. A cached auth session's preference is refreshed in the
background when the app opens; sign-in and token refresh events also apply it.
Failed saves report an error and retain the existing language.

`src/lib/i18n/sw.json` contains explicit English-to-Kiswahili interface phrases.
`useTranslate()` subscribes components to the selected language and exposes
`locale` for date formatting (`en-GB` or `sw-TZ`). Unrecognized text is preserved.
Dynamic phrases use numbered placeholders such as `{0}`; match more specific
phrases first. No external translation service, API key or schema migration is
required. Add a translation when adding new interface copy.

Verification: `node tests/language.cjs` checks both rendered language controls,
dynamic counts, unknown-content preservation, account persistence, failed saves,
switching accounts and synchronization between tabs. The standard portal, auth,
upload and provisioning regression tests remain applicable.
