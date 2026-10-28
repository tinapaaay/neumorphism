# Pomodoro Timer

A browser-local focus timer with a neumorphic dial, task queue, session history, and a synchronized mini window.

## Documentation

- [Requirements](docs/requirements.md): implemented behavior, technical design, data, and scope.
- [App flow](docs/app-flow.md): user journeys, state transitions, and recovery paths.
- [Testing](TESTING.md): setup, manual regression cases, and current test coverage.
- [Deployment](docs/deployment.md): build, preview, hosting, and release checks.

## Run locally

No build step, package installation, or backend is required for local development. Production packaging and tests use Node.js 22 or newer, with no third-party build dependencies. Open this project's `index.html` using VS Code Live Server.

Alternatively, run `python3 -m http.server 5500` from the repository root, then open [this project](http://localhost:5500/Pomodoro%20Timer/). Reuse an existing server instead of starting another on the same port.

Keep the same browser, host, and port when testing saved data. `localhost` and `127.0.0.1` are different storage origins. Use a separate browser profile or disposable origin for destructive tests.

## Test and package

From this project folder with Node.js 22+ installed:

```sh
npm test
npm run check
```

`npm test` runs every repository regression suite. `npm run check` checks JavaScript syntax, runs the suites, and builds `dist/` with only the public site assets. No dependency install is needed. Preview with `python3 -m http.server 5500 --directory dist` and open [the built timer](http://localhost:5500/). Use a different port/profile from real saved data when testing restore/reset.

The repository's Pomodoro GitHub Actions workflow runs the same checks on Node.js 22 and 24 after matching pushes/pull requests. It does not deploy the site.

## Current features

- Start, pause, resume, reset, skip breaks, and recover saved sessions after refresh.
- Keep one active editing tab per origin; additional tabs wait and load fresh saved data when the active tab closes.
- Configure durations, automatic long-break cycles, optional auto-start, and saved focus presets.
- Select queued tasks, set daily session targets, complete/reopen tasks, and clear completed items with batch Undo.
- Record real completed focus sessions in daily goals, calendar history, weekly totals, and streaks.
- Customize profile/photo, desktop completion notifications, and an optional one-minute cue.
- Play bundled background audio; use Mini for a separate synchronized timer view.
- Move desktop cards, reset their layout, or open the hidden card drawer on mobile.
- Use keyboard calendar navigation, restored queue focus, descriptive timer controls, reduced motion, and larger touch targets.
- Export/import validated JSON backups and undo one restore.

## Source map

| File | Responsibility |
| --- | --- |
| `index.html` | Timer, cards, dialogs, metadata, and accessible form controls |
| `base.css` | Local reset/layout utilities replacing the Tailwind runtime CDN |
| `favicon.svg`, `site.webmanifest` | Site icon and relative-path app metadata |
| `scripts/` | Dependency-free checks, test runner, and production packaging |
| `tests/` | All regression harnesses, including release packaging checks |
| `style.css` | Shared neumorphic styling and responsive layout |
| `storage-safety.js` | Durable restore journal, startup integrity checks, recovery download |
| `tab-coordination.js` | Web Lock ownership gate before any app state initializes |
| `script.js` | Timer, profile, task queue, history, presets, layout, and notifications |
| `mini-timer.js` | Mini-window view and controls sharing the main timer state |
| `ambient.js` | Background recordings and generated white noise |
| `data-tools.js` | Backup validation, import preview, replacement, and Undo restore |
| `audio/` | Bundled recordings and [license credits](audio/credits.html) |

## Scope and limitations

A browser with Web Locks support on localhost or HTTPS is required. Only one app tab per origin runs; other tabs show a waiting message. Closing the owner lets the next waiting tab restore saved timer/tasks. A backgrounded owner retains ownership. Mini remains a view of its owner, not another app tab. Refresh all old app tabs after updating to enable this guard.

Data stays in this browser/origin; there is no account, cloud sync, or backend. Keep the main tab open for live playback, notifications, and Mini. Browser suspension or device sleep can delay callbacks. Waking recalculates the countdown from its saved deadline. A completion more than one minute late records only the original session and leaves the next phase idle, without stale alerts or automatic cycles. Mini is always on top only where Document Picture-in-Picture is supported; its fallback is an ordinary small window. Core layout uses local CSS. Google Fonts and the optional deferred Tone.js audio library still use external CDNs; the core timer has no runtime Tailwind dependency. **Preview cue** remains as a useful sound-setting preview. The manifest does not add an offline service worker or guarantee install/background execution.

If a completion cannot save, the dial stays at the finished session. Free browser storage and press the dial to retry, or export a backup containing the in-memory session. Restore/Undo pause when a completion is unsaved. Interrupted restores keep a durable recovery copy and recover before the next app startup. Damaged JSON/root records stop startup instead of silently resetting saved work; a raw recovery download is offered for manual repair (it is not a normal importable backup).

Source/release setup reviewed: 2026-10-28. These documents describe the current implementation, not a promise that every browser test has passed. Keep requirements, app flow, and testing cases updated alongside behavior changes.

### Edit session history

Open the calendar card → **Edit history**. Filter by date or choose **All sessions**, then correct a task label, link a queued task, or delete an accidental session. **Undo last change** restores up to 20 edits/deletions, including after refresh and backup restore. All progress totals update from the corrected history.

### Website information and release checks

Help and Privacy & saved data are available from Edit Profile → Backup and from the loading/error screen. Both pages work without JavaScript or external fonts. Ambient recordings load on Play. Stalled app-file loads and runtime startup errors offer Retry while retaining the single-tab storage guard.

`npm run check` runs 11 suites and packages 21 public assets. See [deployment instructions](docs/deployment.md) for the prepared manual GitHub Pages workflow and remaining live-origin/device checks.

## Live website

[Open the Pomodoro Timer](https://tinapaaay.github.io/pomodoro-site/). Public build files live in [pomodoro-site](https://github.com/tinapaaay/pomodoro-site); this development repository remains private. To move localhost data, export a backup locally and restore it on the public website. See [deployment instructions](docs/deployment.md) for future updates.
