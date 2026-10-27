# Pomodoro Timer — testing

[Requirements](docs/requirements.md) · [App flow](docs/app-flow.md)

## Setup and evidence

Use VS Code Live Server, or follow [README](README.md). Use a disposable browser profile/origin for import, clear, corrupt-storage, and clock-boundary tests. Export real data before any destructive experiment. Keep the same host/port for persistence checks.

Use Opera for the primary desktop pass, plus a second supported browser when available. Test an open main tab, a background tab, and narrow touch layouts separately. Notification permission, OS banner settings, muted audio, and blocked popups are separate test conditions.

Source was reviewed on 2026-10-27. Existing automated suites were rerun successfully against a fresh copy of the current project source on that date. Checked items below record those verified results. The later manual acceptance checklist remains unchecked where a complete browser pass is still needed. All nine current regression suites are included under `tests/` and run with `npm test`; older historical results below predate that move.

## Verified results — 2026-10-27

All four existing Node.js suites exited with code 0; they were rerun after the tab guard was added. The new tab-coordination suite also passed. They execute the current JavaScript in a VM with mocked DOM, storage, clocks, audio, notifications, and windows. These results verify application logic; they do not establish real browser rendering, audible output, OS banners, or actual Picture-in-Picture support.

| Suite | Result | Coverage |
| --- | --- | --- |
| `tests/release.test.cjs` | Pass | Local reset/utilities, metadata/manifest/icon, optional deferred audio, exact deployable assets, clean rebuild and excluded source/test files |
| `tests/accessibility.test.cjs` | Pass | Timer/mute labels and state-only announcements, queue focus restoration, calendar keys and Escape, static focus/motion/touch rules and selected contrast pairs |
| `tests/data-safety.test.cjs` | Pass | Quota refusal, rollback and interrupted journal recovery, corrupt data, pending completion/reload/export, real backup and Undo handlers |
| `tests/timer-recovery.test.cjs` | Pass | Suspended callbacks, quiet stale completion, paused absence, wake events, reload deduplication, timely background completion, midnight attribution |
| `tests/tab-coordination.test.cjs` | Pass | Exclusive owner, blocked second startup, fresh data on handoff, closed waiters, missing/denied locks, partial-load failures, HTML gate |
| `tests/persistence.test.cjs` | Pass | Timer/recovery, settings, queue, history, layout, backups, presets, shortcuts, cue and notification logic |
| `tests/ambient.test.cjs` | Pass | Local audio selection/looping, volume, pause/resume, switching, failures, saved preferences |
| `tests/mini.test.cjs` | Pass | Shared timer, PiP/popup branches, controls, completion deduplication, cleanup, blocked windows |
| `tests/cue-preview.test.cjs` | Pass | Audio unlock, cue preview, mute, unchanged timer/profile, blocked audio recovery |

- [x] Timer start/pause/reset, running/paused restore, closed-tab completion, and exactly-once history accounting — automated portions of POM-T01–T04.
- [x] Custom durations, long-break interval, independent auto-start options, presets, and keyboard shortcut guards — automated portions of POM-T02, T06–T08.
- [x] One-minute cue boundaries, once-per-session persistence, mute, and preview without changing timer/profile state — automated portion of POM-T09.
- [x] Queue selection/attribution, rename, daily targets, completion/reopen, delete, persisted batch Undo, and active-session guards — automated portions of POM-T10–T12.
- [x] History-derived goal beads, calendar popup data/placement, weekly totals, and streak boundaries — automated portion of POM-T12.
- [x] Mini controls, shared deadline, safe task text, deduplication, close cleanup, and blocked-window recovery — mocked portions of POM-T13–T14.
- [x] Five recording assets exist; audio loop/switch/volume/resume behavior, rapid-toggle recovery, unload, and no sidebar/visibility pause handler — automated portion of POM-T15. Real decoding, background playback and sound quality still need a listening pass.
- [x] Floating-card persistence, stacking, docking/reset, viewport clamping, and mobile/desktop state transitions — automated portion of POM-T16. Touch and visual layout still need browser checks.
- [x] Backup validation, round trip, replacement, and storage-write failure rollback — automated portions of POM-T17–T18.
- [x] Notification opt-in/permission branches, content/deduplication, and suppression of stale alerts — mocked portion of POM-T19. OS delivery is separate.
- [x] JavaScript syntax checks for all four project scripts.

### Earlier browser observations — 2026-10-24–25

Task completion/reopening, Focus selection, switching tasks without resetting the countdown, Clear completed/Undo, profile tabs, and backup download/import/Undo were previously exercised in Chrome on an isolated local origin. Those are historical observations, not a fresh Opera pass. A mobile preview was inspected, but the full mobile/touch checklist was not completed.

Notifications were observed in macOS Notification Center, including user-provided screenshots. Banner appearance was inconsistent and remains unverified. Earlier YouTube embed playback checks do not validate the replacement native-audio implementation. Mini timer styling and real Opera PiP/popup behavior still require browser verification.

## Manual acceptance checklist

Unchecked cases below mean the complete manual scenario has not been signed off. A case can have passing automated coverage above while still requiring a real browser check.

## Two-tab verification — 2026-10-27

Before the fix, a shared-storage VM reproduction added one task per tab and retained only the second task: the later tab overwrote the earlier queue. The app now prevents competing writers before initialization, rather than attempting to merge stale snapshots.

- [x] **POM-T21 / POM-15 — Opera browser pass:** On isolated `http://127.0.0.1:8767/`, start a focus with a task label, open a second tab, and verify it displays only the waiting notice. Closing the owner automatically opens the waiting tab with the same label and a running countdown that continues from elapsed time (observed 24:54 before closing, 24:48 after handoff).
- [x] **POM-T21 / POM-15 — Opera task handoff:** Add “Keep this queued task,” open a second tab, confirm the wait, and close the owner. The selected task label is restored without resetting the idle timer.
- [x] **POM-T21 / POM-15 — automated:** Waiting pages load zero application scripts, retain no competing writer, and read latest tasks/history/deadline when admitted. Partial startup failures retain ownership until close; unsupported/denied locking starts no app scripts. Closed waiters do not obstruct the next tab. HTML contains no direct application-script tags that bypass ownership.

This is one editable tab at a time, not simultaneous editing/merging across tabs. Completion deduplication remains covered by the existing timer suite; no live two-tab end-of-session notification/banner test was performed in this pass. OS process termination and real back/forward-cache behavior remain manual follow-ups.

Run the included regression test from the project directory:

```sh
node tests/tab-coordination.test.cjs
```

## Sleep/background recovery — 2026-10-27

- [x] **POM-T22 / POM-01, POM-03 — automated:** Skip callbacks for 90 seconds; display catches up to 23:30. Pause and advance eight hours; remaining time stays 23:30.
- [x] **POM-T22 / POM-03 — automated:** Advance eight hours beyond a running focus, then execute the delayed callback. Exactly one 25-minute session is credited at its deadline; no stale cue, notification, or auto-start occurs. Repeat callbacks, wake events, and reload; history remains one entry.
- [x] **POM-T22 / POM-01, POM-03 — automated:** Window focus, page resume, and visibility return immediately reconcile an expired visible timer. A timely background completion still sends its notification through the mocked API and honors auto-start. An expired break prepares idle focus without work credit. Midnight recovery uses the deadline's local date.

These use a mocked clock and DOM with the real timer source. They simulate suspended callbacks, not actual OS sleep/lock. Physical-device sleep, phone app switching, and real notification/audio delivery still need manual verification under POM-T04/POM-T19.

Run from the project directory:

```sh
node tests/timer-recovery.test.cjs
```

## Data safety — 2026-10-27

- [x] **POM-T23 / POM-14, POM-16 — automated:** Reject restore when there is insufficient room for its journal; compare every original saved byte. Simulate partial writes and persistent write failures during rollback. Verify either an exact rollback or a retained complete before-image; a fresh startup can finish recovery after writes work again.
- [x] **POM-T23 / POM-16 — automated:** Simulate termination after the journal and one replacement write. Recover all old values before startup. Preserve damaged journals, malformed JSON, and invalid root records; block normal app initialization and offer a raw recovery download. Accept legitimate string notification markers.
- [x] **POM-T23 / POM-03, POM-16 — automated:** Reject history writes at focus completion. Keep one exportable entry in memory and a pending timer marker, prevent Reset from discarding it, reload with persistent failure, then retry successfully. Replay a pre-transition timer against durable history and verify no duplicate credit.
- [x] **POM-T23 / POM-14, POM-16 — automated:** Exercise the real backup validator/apply/Undo handlers with representative data. Confirm restoration of history, a paused timer after Undo, and cleanup of journal/Undo keys only at the appropriate successful boundary.

Run from the project directory:

```sh
node tests/data-safety.test.cjs
```

Failures and interruption are injected through a mock localStorage implementation with the real application source. They do not fill the user's actual browser storage or kill a real OS process. Opera loaded the updated startup path on isolated `http://127.0.0.1:8767/`; the manual file-picker/download pass was not completed because native UI control became unreliable. Current browser import/export/download and real quota behavior remain follow-ups under POM-T17–T18. The raw recovery download is not a normal backup and requires manual repair before use.

## Accessibility pass — 2026-10-27

- [x] **POM-T24 / POM-17 — automated:** Verify action/mode/countdown names, pressed/mute states, and live-message updates only on state/phase changes. The live region is outside the optional current-task area.
- [x] **POM-T24 / POM-06, POM-17 — automated:** Queue selection preserves focus on the rebuilt action. Saving an edit returns to Edit; deleting a focused row chooses a usable next target, and deleting the last task returns to the new-task input.
- [x] **POM-T24 / POM-07, POM-17 — automated:** One calendar Tab stop, day/week arrows across month boundaries, Home, and January date keys. Escape dismisses the tooltip before the drawer and restores toggle focus when the drawer closes.
- [x] **POM-T24 / POM-17 — static/numeric:** Verify markup hooks and CSS rules for shared focus outlines, touch targets, wrapping, and reduced motion. Selected text/placeholder/focus colors against three plain surface colors exceed 4.5:1. This does not verify every computed/gradient/composited color combination.
- [x] **POM-T24 / POM-17 — limited Opera observation:** The isolated test page exposes the named timer/mute toggle states and countdown in the accessibility tree. Tab + Return opened the drawer. Full calendar arrow/Escape focus behavior could not be reliably confirmed through native automation, so the browser keyboard case is not signed off.
- [ ] **POM-T24 / POM-13, POM-17 — manual follow-up:** Verify VoiceOver or another screen reader, 200% browser zoom/reflow, 320px/390px widths, real touch targets, every focus ring, reduced motion on a real device, Mini, and the full browser calendar/queue keyboard journey.

Run from the project directory:

```sh
node tests/accessibility.test.cjs
```

## Reproducible syntax checks

Run from this project directory with Node.js installed:

```sh
node --check storage-safety.js
node --check tab-coordination.js
node --check script.js
node --check ambient.js
node --check data-tools.js
node --check mini-timer.js
```

These parse JavaScript only; they do not verify DOM wiring, timing, sound quality, rendering, or permissions.

## Core timer and recovery

- [ ] **POM-T01 / POM-01:** Start, wait, pause, and resume. Paused time stays fixed; resume keeps remaining time. Reset stops and restores the configured current mode without adding history.
- [ ] **POM-T02 / POM-02:** Set short durations in a test profile. Complete focus → short break → focus; confirm every configured Nth completed focus prepares a long break. Test auto-start toggles independently and Skip break from idle/running breaks.
- [ ] **POM-T03 / POM-03:** Refresh while running and paused. Reopen after a focus deadline, including after local midnight. Exactly one focus entry appears on the completion date; reopening again must not duplicate it or play an old alert/start a new mode.
- [ ] **POM-T04 / POM-01, POM-03:** Background the page and return; remaining time catches up to the deadline. Device sleep may delay delivery, but must not create duplicate credit.

## Settings, presets, and shortcuts

- [ ] **POM-T05 / POM-04:** Save name/role/goal/photo, refresh, and verify. Cancel a second draft and verify it was discarded. Test unsupported or over-2-MiB photos and unavailable storage without losing the existing profile.
- [ ] **POM-T06 / POM-02, POM-04:** Reject empty/noninteger/out-of-range durations and goals. Confirm untouched idle settings apply immediately, while running and partially elapsed sessions keep their duration.
- [ ] **POM-T07 / POM-08:** Choose Study and Deep Work. Save/reload a custom routine, update it by name, delete it, and Cancel a draft. Check the 12-custom-routine limit and that built-ins remain available.
- [ ] **POM-T08 / POM-09:** With the page focused, Space starts/pauses and R resets. Held keys must not repeatedly toggle. Try the keys in task inputs, content-editable content, selectors, focused buttons, and open dialogs; normal editing/control behavior must win. Ctrl/Command/Alt/Shift combinations and composition must not trigger timer shortcuts.
- [ ] **POM-T09 / POM-10:** Enable the one-minute cue and run a 2-minute focus. It sounds once at 1:00, respects mute, and does not repeat after pause/resume/reload. Breaks, one-minute focuses, disabled settings, and stale recovered boundaries produce no cue. Test cue previews sound without advancing or crediting work.

## Queue, goals, and history

- [ ] **POM-T10 / POM-05:** Add two tasks, including duplicate names. Focus selects the intended ID and fills/reveals the current-task field. Switch during running/paused focus; the countdown stays intact and completion is attributed to the final selection. Free-form editing detaches selection without deleting the queued task.
- [ ] **POM-T11 / POM-06:** Rename, complete, reopen, delete, and Undo. Clear multiple completed tasks and undo the whole batch after refresh. Pending tasks, selection, and recorded history remain intact. Test selected-task edit/delete/complete protection while focus is active or partially elapsed.
- [ ] **POM-T12 / POM-03, POM-07:** Complete focus and inspect beads, per-task daily progress, calendar popup, weekly totals, and streak. Manually completing a queue task must not add focus credit. Check Monday boundaries, multiple sessions per day, yesterday's streak, and missed-day reset using a disposable fixture/profile.

## Mini, background audio, and layout

- [ ] **POM-T13 / POM-11:** Open Mini and use both views to pause/resume/reset and skip breaks. Time/task/mode remain synchronized. Closing Mini leaves a running timer running; closing the main tab closes Mini. Compare square plate, dial, typography, and pushed state with the main view.
- [ ] **POM-T14 / POM-11:** Check Picture-in-Picture where supported and the ordinary-popup fallback elsewhere. Block window creation; the app must remain usable and explain failure. Do not label an ordinary popup as always on top.
- [ ] **POM-T15 / POM-12:** Play each local sound and white noise, change volume including zero, pause/resume, and switch sounds rapidly. Close the sidebar and switch tabs; audio continues. Refresh pauses playback but retains choice/volume. Verify audio credits and optional external YouTube links.
- [ ] **POM-T16 / POM-13:** Drag overlapping cards, click/keyboard-focus one to raise it, refresh, and resize. Reset layout docks them. At 390px and 640px widths, cards stay hidden until opened, scroll correctly, and do not obstruct the primary timer. Widening restores the desktop layout.

## Backup, notifications, and resilience

- [ ] **POM-T17 / POM-14:** Export and import a backup containing tasks, deleted-task Undo, photo, custom presets, history, layout, and audio preferences. Check preview/Cancel/Confirm and Undo restore. Imported data replaces rather than merges and resets timer state.
- [ ] **POM-T18 / POM-14:** Reject malformed JSON, wrong format/version, invalid presets, impossible durations, and unsafe/oversized image data. On a simulated storage write failure, old data must remain usable and no partial replacement should be reported as successful.
- [ ] **POM-T19 / POM-10:** On localhost/HTTPS, explicitly opt in and test granted, denied, unavailable, and revoked notification permissions. Separate Notification Center delivery from banner/sound delivery. Verify focus/break completion messages and deduplication; recoveries do not send old alerts.
- [ ] **POM-T20 / POM-04, POM-13:** Exercise keyboard focus, screen-reader labels, 200% zoom, reduced motion, missing CDN/audio resources, and storage failures. Record accessibility or browser gaps instead of assuming support.

## Recording results

For each run, record date, browser/version, OS, viewport, origin, case ID, steps, expected/actual result, and a screenshot or console error when useful. Record manual cases as Pass, Fail, or Not run. Before release, remove or explicitly retain the temporary Test cue button and repeat affected cases after a fix.

## Accessibility follow-up — 2026-10-28

- [x] **POM-T24 / POM-17 — automated regression:** Model native blur/focusout when a focused queue row or date is removed during rebuilding. Confirm the drawer waits for restored focus, stays open for queue/calendar navigation, closes when focus genuinely leaves, and reopens to return from the task editor. The new case fails against the previous source and passes with deferred focus-exit handling.
- [x] **POM-T24 / POM-17 — limited Opera observation:** Fresh uncached origin `http://127.0.0.1:8769/` loads the current timer and exposes its countdown, phase status and named mute toggle. The timer, task input and control row remain visible in the observed desktop screenshot.
- [ ] **POM-T24 / POM-17 — unresolved browser verification:** Opera native automation did not provide reliable exact zoom-level or calendar key/focus confirmation. No 200% zoom/reflow pass is recorded. Screen-reader output and real-phone touch checks remain pending. The isolated test tab was closed after checking.

## Release setup — 2026-10-28

- [x] **POM-T25 / POM-18 — automated:** `npm run check` parses source/tooling/tests, runs all nine repository suites, and builds `dist/`. No dependency installation, global packages, or personal workspace paths are required.
- [x] **POM-T25 / POM-18 — packaging:** Assert byte-for-byte copies of the 17 public assets, local HTML/manifest references, missing tests/docs/editor/tooling files in the output, and removal of stale generated files on rebuild. Reject using the project source folder as the build destination.
- [x] **POM-T25 / POM-18 — static:** Runtime Tailwind removed; local reset/layout utilities load before component styles. Metadata, SVG icon and relative-path manifest are present; Tone.js is deferred and Google Fonts remain optional external resources.
- [ ] **POM-T25 / POM-18 — pending:** GitHub-hosted workflow execution after the changes are pushed. Configuring a workflow file is not evidence of a successful cloud run or deployment.

The cue preview remains intentionally available as **Preview cue**; earlier references to the temporary Test cue control describe the previous label. Public hosting/domain, complete manual accessibility/device verification, and actual OS notifications remain separate release checks.

- [ ] **POM-T25 / POM-18 — built-site visual smoke check:** The installed repository command passed all nine suites, 19 JavaScript syntax checks, and the 17-asset build. Opera returned `noWindowsAvailable` when opening the build preview, so visual equivalence after replacing the runtime CSS CDN is not signed off. Generated `dist/` is ignored by Git.
