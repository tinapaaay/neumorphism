# Alarm Clock — testing

[Requirements](docs/requirements.md) · [App flow](docs/app-flow.md)

Use the [local setup](README.md). This project is a visual demo; do not rely on it for a wake-up/reminder test. Source reviewed 2026-10-27. Cases below are **not executed passes**. No automated regression suite is committed. `node --check script.js` checks JavaScript parsing only.

## Verified results — 2026-10-27

- [x] Node.js syntax check passed for `script.js`.
- [x] Documentation links and requirement-to-test references validated.

These checks verify parsing and documentation consistency only. No runtime or complete manual browser pass is recorded here; the acceptance cases below remain unchecked. Pomodoro's automated suites do not cover this project.

## Current behavior

- [ ] **ALM-T01 / ALM-01:** On a fresh load, verify the 3:00 hand positions and three seed rows. Toggle Live Time, compare local hour/minute angles, wait for updates, then restore static 3:00.
- [ ] **ALM-T02 / ALM-02, ALM-04:** Toggle rows on/off, checking track/thumb appearance and toast text. Disable every row; expect All alarms disabled. Enable two out of chronological order; expect the first active list item, not a calculated nearest alarm.
- [ ] **ALM-T03 / ALM-03:** Add 6:05 AM and 12:59 PM. Verify padded minutes, active rows, and no item added after Cancel. Reload and confirm additions disappear, as state is not persisted.
- [ ] **ALM-T04 / ALM-03:** Test hour 0/13/blank, minute -1/blank/60, and fractional values. Record the documented silent hour rejection and minute upper-bound gap; do not report strict minute validation as implemented.
- [ ] **ALM-T05 / ALM-05:** Toggle audio off/on, trigger row/save feedback, and simulate missing Tone.js. Visual controls should work without audio and toast timers should not stack indefinitely.
- [ ] **ALM-T06 / ALM-06:** Open/close the menu, click outside, and choose each menu action. Verify it dismisses as specified. Reload restores fixed clock mode and seed toggles.

## Design and known-gap checks

- [ ] **ALM-T07 / ALM-01, ALM-02:** Compare clock, shadows, switch states, labels, and modal at desktop and 390px/200% zoom. Record clipping rather than assuming mobile support.
- [ ] **ALM-T08 / ALM-02, ALM-03:** Try Tab/Space/Enter/Escape and a screen reader. Record that alarm rows and overlay modal lack complete semantic/focus behavior; these are known gaps, not passing accessibility criteria.
- [ ] **ALM-T09 / scope:** Let a displayed alarm time pass in a disposable test. The current build has no scheduled ringing or desktop notification. Record that limitation explicitly in demos/releases.

Record date, browser/version, OS, viewport, case, expected/actual result, and Pass/Fail/Not run. Future scheduling work needs a separate timing/permissions/persistence test plan before this can be called a functional alarm service.
