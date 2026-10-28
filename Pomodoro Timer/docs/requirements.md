# Pomodoro Timer — requirements

Reviewed against source on 2026-10-28. Requirement IDs map to cases in [TESTING.md](../TESTING.md). [App flow](app-flow.md) describes the corresponding journeys.

## Purpose and boundaries

Help one browser user plan focus work, run focus/break cycles, and review completed work. The application is static HTML/CSS/JavaScript. There are no sign-in, server API, database, service worker, or cross-device synchronization components.

## Implemented behavior

| ID | Requirement and acceptance boundary |
| --- | --- |
| POM-01 | The dial starts, pauses, and resumes the same session. Reset stops the timer and restores the configured duration without awarding focus credit. Running time is derived from a deadline, rather than counting interval callbacks. |
| POM-02 | Focus, short break, and long break durations accept whole minutes from 1–180. Defaults are 25/5/15. Long breaks occur automatically every 1–12 completed focus sessions, default 4. Independent auto-start options default off; Skip break immediately starts focus. |
| POM-03 | A completed focus session is recorded once using a stable session ID. Breaks and manually completing a queue task do not add focus sessions. Closed-tab recovery uses the original completion timestamp and does not send stale notifications or auto-start another session. |
| POM-04 | The profile supports an optional display name (up to 50 characters, Guest when blank), optional role (up to 70), optional image, daily goal (1–99), and timer preferences. PNG/JPEG/WebP uploads are limited to 2 MiB. Profile editing uses draft values; Save persists and Cancel discards them. The separate avatar upload control saves directly. |
| POM-05 | Task names are limited to 120 characters and have stable IDs and daily targets of 1–99 sessions. Focus selection fills/reveals the current-task field and may change during running or paused focus without resetting the countdown. Editing the field detaches its label from the queue. Completed sessions retain the task identity/name recorded at completion. |
| POM-06 | Tasks support rename, delete, reopen, and Clear completed. Deletion Undo stores up to 20 operations; a bulk clear is one operation. A selected task cannot be edited, deleted, or marked complete while its focus session is running or partially elapsed. Completing the selected idle task selects the next pending task. |
| POM-07 | Daily goal beads are display-only and derive from actual completed focus history. Weekly stats use local Monday–Sunday boundaries. Multiple sessions on one day count as one streak day; yesterday's streak remains available until today is missed. Calendar popups show real per-day history. |
| POM-08 | Study 25/5 and Deep Work 50/10 presets include long-break duration and interval. Up to 12 named custom routines can be saved. Preset edits stay in the profile draft until Save; active/paused sessions keep their current duration. |
| POM-09 | Space starts/pauses and R resets when the page has focus. Shortcuts ignore typing/editable content, focused controls, open dialogs, modifiers, composition, and repeat events. Normal native control keyboard behavior remains available. |
| POM-10 | Desktop completion notifications require explicit opt-in, a supported secure/local context, and browser permission. The optional one-minute focus cue defaults off, respects timer mute, and is consumed once per session; missed/recovered cues are not replayed. A cue preview previews sound without changing timer state. |
| POM-11 | Mini shares the existing countdown/session and provides start/pause, reset, task text, and Skip break. It reuses the main stylesheet/fonts. Use Document Picture-in-Picture if available, otherwise a normal popup. Closing Mini leaves focus running; unloading the main page closes Mini. |
| POM-12 | Rain, fireplace, beach, jazz, and coffee-shop recordings loop as native local audio; white noise uses Web Audio. Play is user initiated. Audio can continue with the drawer closed or the tab in the background. Choice/volume persist, playback does not auto-start on reload. Original YouTube links are optional external alternatives; attribution remains available. |
| POM-13 | Desktop cards can detach, move, return, and raise above overlapping cards; positions/order persist and remain bounded to the viewport. Reset layout docks cards. At widths up to 640px, the timer remains primary and the drawer is initially hidden; desktop layout can return when the viewport widens. |
| POM-14 | JSON backup export includes saved profile/presets, tasks/deletion Undo, history, layout, and ambient preferences. Import validates known fields and previews replacement before confirmation. Restore resets active timer state and retains one Undo restore snapshot; failed storage writes roll back. Unsaved form edits are excluded. |

| POM-15 | Before any application script initializes, acquire an exclusive origin-scoped Web Lock. Other tabs remain hidden/inert behind a waiting notice, with no timer, queue, profile or history writers. Closing the owner lets the next waiting page initialize from current storage. Missing/denied locking fails visibly without starting the app. Mini shares the owner and does not acquire another lock. |

| POM-16 | Restore and Undo use a durable before-image journal before changing saved keys. An interrupted transaction rolls back before app startup; a failed rollback retains the journal and blocks app writes. Corrupt JSON/invalid root records block startup with a raw recovery download. A focus completion that fails to save stays pending/exportable and retryable instead of advancing; pending completion survives timer-state reload and protects attribution/reset/restore. |

| POM-17 | Timer and Mini controls expose action, mode, remaining time and pressed state; mute has a descriptive label/state. The main live region announces phase/state changes without per-second chatter, independently of the optional task field. Queue rerenders preserve usable keyboard focus and editor close returns to its action. Calendar uses one Tab stop, day/week arrow keys, Home/End, and tooltip-first Escape. Shared CSS supplies focus rings, darker metadata, reduced motion, wrapped controls, and larger coarse-pointer/mobile targets. |

| POM-18 | Core layout loads local reset/utilities before component CSS; the page has description/share metadata, an SVG icon and a relative-path manifest. Node.js 22+ tooling with no external packages runs repository tests and builds an allowlisted static `dist/` folder. GitHub Actions checks Node 22/24 on matching changes without deployment privileges. |

## Suspension recovery

Use the absolute deadline to catch up after delayed callbacks, rather than decrementing by callback count. Visibility return, window focus, and supported page-resume events immediately reconcile a visible timer without replaying alerts. A callback more than 60 seconds after its deadline completes quietly: record at most the original focus session on its deadline date, prepare the next mode idle, and skip stale notifications, sounds, animations, and auto-start. Timely background completions (up to 60 seconds late) retain normal notification/auto-start settings. Paused sessions do not advance during absence. Device sleep cannot guarantee real-time delivery; no closed/suspended page is claimed to run a reliable alarm.

## State and persistence

`tab-coordination.js` holds `neumorphism-pomodoro-app-v1` until its document is destroyed, including after a partial script-load failure. It loads `storage-safety.js`, recovers an interrupted transaction and checks saved records, then loads the five application scripts sequentially after ownership. Web Locks avoid storage-lease expiry when a tab is suspended. Cached pages reload on restoration.

`script.js` owns timer/session state. `mini-timer.js` renders that state instead of creating an independent timer. History is the source of truth for focus credit.

| localStorage key | Contents |
| --- | --- |
| `pomodoro-local-profile` | Profile, photo, preferences, custom presets, and derived goal checks |
| `pomodoro-timer-state-v1` | Mode, duration, remaining time, running deadline, session/task identity, mute, cue-consumed flag, pending-completion marker |
| `pomodoro-focus-history-v1` | Completed focus entries and legacy baseline focus seconds |
| `pomodoro-task-queue-v1` | Tasks, selected task ID, and deletion Undo operations |
| `pomodoro-widget-layout-v1` | Floating card positions and front order |
| `pomodoro-ambient-settings-v1` | Sound choice and volume |
| `pomodoro-before-restore-v1` | One pre-restore storage snapshot |
| `pomodoro-last-notification-v1` | Notification deduplication marker |
| `pomodoro-storage-transaction-v1` | Durable before-image of restore/Undo targets, retained until commit or complete rollback |

Dates and week boundaries use the browser's local timezone. Clearing site data removes saved work. Browser storage limits can reject photos/backups; errors should leave usable in-memory controls and an appropriate notice. History supports legacy data normalization; backup import applies stricter validation, including a 50,000-entry history limit.

## Runtime and dependencies

Serve over localhost or HTTPS. Use a browser with Web Locks, localStorage, native dialogs, Web Audio, and standard modern DOM APIs. Notifications, Picture-in-Picture, file import/export, and media controls are feature/permission dependent. External resources are Google Fonts (Inter/Short Stack) and optional deferred Tone.js. Core reset and utilities are local in `base.css`; there is no runtime Tailwind CDN. Bundled recordings and their licenses are listed in [Audio credits](../audio/credits.html).

## Known limitations and release work

- No background execution guarantee after device sleep or browser suspension; a closed page cannot deliver new alerts or play audio.
- Cross-tab storage updates do not provide transactional multi-tab timer ownership. Avoid running the same logical focus session in multiple tabs.
- A task switch during focus attributes completion to the task selected when that session finishes; time is not split between tasks.
- One-minute sessions have no pre-finish cue at their start. A cue missed by more than the scheduling grace is suppressed.
- Temporary Test cue UI remains present. Review whether to keep or remove it before a release.
- Keyboard/screen-reader usability, contrast, mobile rendering, and browser compatibility still require the manual checks in TESTING.md; source review is not certification.

## Data safety boundaries

The restore journal requires additional localStorage capacity; insufficient space refuses the restore before any target key changes. If rollback itself cannot write, the complete old values remain in the journal and runtime writers are blocked until recovery succeeds. Startup recovers this journal before parsing application state. A corrupt journal is preserved rather than discarded. Clearing all site data or a browser losing its stored bytes cannot be undone by a journal in that same storage.

When focus-history persistence fails, keep its completed entry in memory for export and keep the original session ID/deadline with `completionPending` in timer state where storage permits. The next mode cannot start until history is saved; pressing the dial retries quietly. Retrying/reloading does not duplicate entries. Reset, task reassignment, and backup replacement cannot discard a pending completion. If the browser rejects every write, unsaved in-memory data still requires export before closing the page.

The startup integrity check detects malformed JSON, invalid root types, malformed history containers, malformed queue containers, and missing profile names. It is not a full semantic repair engine. The raw recovery file preserves stored strings/journal for manual recovery and is intentionally distinct from a validated normal backup.

## Accessibility verification boundaries

Selected foreground/background pairs are checked numerically for contrast, and keyboard/label/state behavior is covered by DOM mocks. This does not establish full accessibility compliance. Native screen-reader output, visual focus visibility at every surface, all gradient/composited contrast combinations, real touch behavior, and 200% zoom/reflow still require browser/device checks. Calendar dates use a 24px minimum width and 36px minimum height to fit seven columns; primary coarse-pointer controls use 44px minimum targets.

## Release tooling

`npm run check` uses Node built-ins for syntax checks, separate-process regression suites, and an asset-only build. The generated `dist/` contains 17 allowlisted site assets plus `.nojekyll`; it excludes tests, tooling, editor settings, and documentation. Builds use a temporary output directory and replace only the generated destination. All test paths resolve relative to the repository. The GitHub workflow uses read-only repository permissions and runs the same command on Node 22/24; configuring it is not a recorded cloud run. The manifest has no service worker or offline/background execution guarantee. No deployment URL is assumed for canonical/share URLs.

## POM-19 — History editing

The calendar opens a date-filtered history editor with an all-sessions view and 50-row pagination. Edit changes only a completed session’s task label/link, preserving its duration and timestamp. Delete removes focus credit from derived totals. Undo retains the last 20 changes across reload and backup, and preserves intervening completions. Deleted IDs prevent stale timer recovery from recreating entries. A failed durable save leaves history unchanged; pending unsaved completions block mutations. Existing timers keep their countdown.

## POM-20 — Public website readiness

Help and Privacy pages are usable without JavaScript and explain local storage, backups, external requests, notifications and browser limitations. The entry point links them from both the guard/error screen and profile Backup tab. Ambient recordings are requested on Play, not initial load. Local startup HTML/CSS/JS stays under 250 KiB (excluding optional remote fonts/Tone and user-requested recordings). Script load stalls time out after 15 seconds; startup exceptions show Retry while the owner retains its lock. Responsive controls preserve the active timer and saved desktop layout. The manual Pages workflow builds/checks only the Pomodoro artifact before deployment; it is separate from read-only CI and is not evidence of a live deployment.

The public build starts as Guest without personal sample names or a default role. Profile settings can save without identifying details. The Privacy page includes a cookie/local-storage explanation; no blanket consent checkbox or tracking banner is introduced.
