# Alarm Clock — requirements

Source reviewed 2026-10-27. [App flow](app-flow.md) · [Testing](../TESTING.md)

## Scope and implementation

A static HTML/CSS/JavaScript visual prototype. All state lives in the script's `state` object: `isRealtime`, `soundEnabled`, and an alarm array. There is no localStorage, backend, scheduler, service worker, or actual alarm delivery.

| ID | Implemented requirement |
| --- | --- |
| ALM-01 | Initial mode shows 3:00 with the hour hand at 90 degrees and minute hand at zero. Switching to Live Time uses the browser's local hour, minute, and seconds; the hand updater runs every second. Switching back restores 3:00. |
| ALM-02 | Render seed alarms 5:00 AM active, 7:00 PM inactive, and 8:42 PM active. Clicking an alarm row toggles its state, restyles it, and shows enabled/disabled feedback. |
| ALM-03 | Menu Add Alarm opens an hour/minute/AM-PM modal. Save appends an active alarm and closes it when the hour parses into 1–12. Cancel closes without creating an item. |
| ALM-04 | The status label reads All alarms disabled when none are active; otherwise it shows the first active alarm in insertion order. It does not compute a countdown. |
| ALM-05 | Tactile Audio can be toggled. Enabled row/save actions use Tone.js feedback; unavailable/restricted audio is caught so visual interaction continues. Toasts disappear after about 2.2 seconds. |
| ALM-06 | The menu can be toggled and dismisses when clicking outside. Reload reconstructs the default demo state; there is no persistence promise. |

## Runtime and dependencies

Serve with Live Server or a local HTTP server. No build/package step is needed. The page uses Tailwind CDN, Google Fonts Inter, and Tone.js 14.8.49. A browser user gesture may be needed to unlock audio. Live clock values follow the device clock/timezone.

## Known implementation gaps

- No ringing, notification, snooze, delete/edit alarm, or saved alarm persistence. These are future features, not existing requirements.
- Minute input has HTML min/max 0–59, but `saveNewAlarm()` does not enforce the upper bound; nonnumeric/negative values become 00. Hour/minute values use `parseInt`, so fractional text is not strictly rejected. Invalid hour returns silently.
- The first-active label is not chronological scheduling, even in Live Time.
- Alarm rows/switches are clickable `div` elements, not semantic keyboard-operable switches. The modal is a hidden overlay, without native dialog focus management. Accessibility and narrow-screen behavior need work before treating this as a production utility.
