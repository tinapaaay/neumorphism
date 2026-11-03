# To do list — testing

[Requirements](docs/requirements.md) · [App flow](docs/app-flow.md)

## Setup and status

Use [README](README.md) to serve the project. Test in Opera desktop and a narrow/touch viewport, with a disposable profile for migration, deletion, date-boundary, and storage-failure checks. Never clear real site data just to obtain an empty fixture. Test dates use the browser's local calendar.

## Automated regression suite — 2026-10-29

Run `npm install` once, then `npm test` from this directory. The dashboard does not require these dependencies to run. Tests automatically use `/Applications/Opera.app/Contents/MacOS/Opera` on macOS, or an executable supplied with `OPERA_EXECUTABLE`. Without Opera, install the Playwright Chromium binary with `npx playwright install chromium`.

Test environment: Opera 138.0 executable, headless, macOS 27.0.1, Playwright 1.62.1, Asia/Manila timezone. Test origins and profiles are disposable. External fonts are blocked during behavioral tests. Fixtures cover October 25/28/29, 2026, year boundaries and the America/New_York November 1 fall-back; rollover is advanced with the browser clock.

`npm test`: **13 passed, 0 failed**. `npm run check`: JavaScript syntax passed.

| Test | Executed coverage |
| --- | --- |
| Dashboard flows | Views, migration backup, pin cap, priority, menu order and persistence, celebration, clearing/progress retention, notes/settings persistence, daily/weekly/custom recurrence, deleting/stopping/Undo, deduplication, midnight, desktop/mobile bounds |
| Undo and focus | Delete → add/pin new work → Undo, three-pin cap, latest notes/settings retained, pin focus return, Alt+arrows, native drag/drop, cross-group refusal |
| Portable backups | Download and parse JSON, preview without changing data, confirmed restore, reload, persistent Undo restore, malformed JSON, wrong app/schema |
| Damaged data | Malformed saved IDs/progress/schedules, completion after repair, blocked storage and notes failure indicator |
| Schedule edits | Stop daily → edit to weekly → invalidate stale Undo; undated additions from Upcoming remain findable |
| Audio controls | Off and zero emit no oscillators; chime creates two; saved Off remains silent on completion |
| Weekly review | Cleared-task deduplication, completion-date attribution, current carryover, missing/future days, local week/year boundaries, target history at midnight, refresh, history backup/restore, older-backup compatibility, Escape/focus, mobile bounds |
| Manual QA regressions | Full weekday checkbox names, mobile tap flow/popover bounds, reduced-motion celebration, DST fall-back/no premature reset, next-midnight water history |
| Validation and dates | Whitespace names rejected, 80-character names retained, Escape cancels edits, future date/filter, leap-year February, year boundary, 390/580/581 px overflow checks |

Saved tests: `tests/dashboard.test.cjs`, `tests/recovery.test.cjs`, `tests/weekly-review.test.cjs`, and `tests/manual-regressions.test.cjs`. The checkbox cases below remain a manual acceptance checklist, not a claim of complete manual certification. Automated coverage does not verify perceived audio quality, screen-reader behavior, hardware touch, OS-specific zoom, or every daylight-saving timezone.

## Native manual QA — 2026-10-29

[Manual QA results](docs/manual-qa.md) records the actual native Opera pass: keyboard task creation, pinning, completion, Delete/Undo, notes refresh, invalid settings/Cancel, 80-character input, custom-weekday validation, 200% browser zoom, 390 × 844 responsive layout, and inspected accessibility names. Split weekday names were fixed. Physical phones, spoken screen readers, sound quality and different-engine backup exchange remain unverified.

The full checklist below remains separate: a case is checked only when all of its manual subconditions have been executed. Native results and instrumented results are labeled separately in the report.

## Task and schedule cases

- [ ] **TODO-T01 / TODO-01:** Add, edit, and Cancel tasks with no date, Today, past, and future dates. Blank/whitespace-only names are rejected; 80-character names remain intact and longer input is constrained.
- [ ] **TODO-T02 / TODO-02:** Pin three tasks, reject a fourth, unpin and retry. Refresh and verify pin/order persistence. Reorder within each group by menu, Alt + arrows, and desktop drag/drop; cross-group drop must not silently change pin state.
- [ ] **TODO-T03 / TODO-03:** Prepare pending undated, overdue, today, future, and completed tasks. Verify Today/Upcoming/Completed/All and exact calendar-date filters; Show all and calendar Today clear the date filter as specified.
- [ ] **TODO-T04 / TODO-04, TODO-07:** Complete and reopen tasks; inspect dates, progress, sound, and completion celebration. Clear finished in a restricted view: only visible done tasks are removed. Completed cleared work remains counted for that day.
- [ ] **TODO-T05 / TODO-04:** Delete several tasks, add another, then Undo. Removed work returns in the intended order without losing the new task, notes, or settings. Refresh demonstrates that the in-memory Undo is no longer available.
- [ ] **TODO-T06 / TODO-05:** Add daily, weekly, and custom-weekday tasks. Reject an empty custom selection. Revisit months and reload; no duplicate series/date occurrences appear. A start date outside selected weekdays moves to the first matching date.
- [ ] **TODO-T07 / TODO-05:** Edit one recurring occurrence's name/date; compare siblings. Change its recurrence pattern, stop repeating, delete an occurrence, and Undo. A skipped date must not be regenerated, and stopping retains current/completed work while removing future uncompleted work.
- [ ] **TODO-T08 / TODO-06:** Browse a short February, leap-year February, and year boundaries. Check Monday-first alignment, indicators, selected date labels, and the local Today highlight.

## Dashboard, persistence, and interaction cases

- [ ] **TODO-T09 / TODO-08:** Type notes, refresh, and verify. Task deletion/Undo must not alter the latest notes. Simulate blocked writes in a disposable context and verify a saved/not-saved status.
- [ ] **TODO-T10 / TODO-09:** Add/subtract water in 250 mL steps, including zero/goal limits, and refresh. Change the goal, cross local midnight, and return from a background tab; displayed progress and reset must match the current local day.
- [ ] **TODO-T11 / TODO-10:** Save name/greeting/goal/sound/volume and reload. Cancel another draft and confirm no settings changes. Reject blank personal text and form values outside water-goal constraints. Preview pop/chime/off at zero and nonzero volume.
- [ ] **TODO-T12 / TODO-10:** Compare clock/day/date to local system time. Remaining-day text and fill should decrease toward local midnight, including a daylight-saving boundary where applicable.
- [ ] **TODO-T13 / TODO-11:** In a disposable profile, load an old task-array fixture and verify normalized version-2 state plus the one-time backup key. Corrupt a storage value or block writes; the dashboard should use safe defaults or explain limited persistence without crashing.
- [ ] **TODO-T14 / TODO-02, TODO-11:** At 390px and around the 580px breakpoint, verify readable cards, scrollable lists/dialogs, visible options buttons, and usable reorder menu actions. Check keyboard focus return, Escape/popover dismissal, reduced motion, long labels, and 200% zoom. Record compatibility gaps.

## Result record

Record case ID, date, browser/version, OS, viewport/origin, fixture, expected/actual behavior, and Pass/Fail/Not run. For recurrence fixes, rerun both task CRUD and schedule generation; for persistence fixes, include migration/reload and day-boundary cases.

## Backup acceptance cases

- [ ] **TODO-T15 / TODO-12:** Export from one browser and restore in a second browser. Compare tasks, repeated schedules, notes, settings and same-day water intake. Check the preview before Restore, cancel it, and test Undo last restore after refreshing.
- [ ] **TODO-T16 / TODO-12:** Reject malformed JSON, unsupported versions, duplicate task IDs, invalid schedules/settings, and files larger than 2 MB without replacing current data.

## Weekly review acceptance case

- [ ] **TODO-T17 / TODO-13:** With real saved data, compare current and previous week totals, cleared-task counts, current carryover, and water history. Distinguish no record from logged zero and unknown historical targets. Inspect at desktop/mobile sizes with Short Stack loaded. Automated fixture coverage is recorded above.
