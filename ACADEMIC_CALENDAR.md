# Current-term countdown

The academic dates are configured in `src/lib/school.ts`:

- School opening: 26 October 2026, 00:00 Tanzania time.
- Test 1 period starts: 7 December 2026, 00:00 Tanzania time.

The opening day begins week 1. Test 1 begins 42 days later, at the start of week 7.
Midnight marks the start of the period; no individual exam session time is implied.

Both dashboard countdowns show school opening before 26 October and automatically
switch to Test 1 at that instant. Open pages update every second. After the test
period starts they show a started state; dates never roll forward to another year.
Configure future academic dates explicitly rather than guessing the next term.

The dashboard serializes one initial timestamp for both widgets to keep their
server-rendered and initial browser output consistent. Display dates use Tanzania
time and the selected English/Kiswahili interface language.

Study Planner has been retired. Its navigation, links, sample study sessions and
mock streak statistic were removed. The old `/planner` URL redirects to Home.

Run `node tests/academic-calendar.cjs` to verify the exact transition boundaries,
week-7 date, elapsed state and rendered widget headings.
