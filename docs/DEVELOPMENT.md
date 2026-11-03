# Development and maintenance

## Run locally

From the repository root, run `python3 -m http.server 5500`, then open `/Pomodoro%20Timer/`, `/To%20do%20list/`, `/Alarm%20Clock/`, or `/Sign%20Up/`. There is no root index.html.

## Implementation and boundaries

Collection of four independent browser projects. Pomodoro has its own Node check/build tools and extensive guides; the other projects are static source pages. The public Pomodoro release is maintained separately. Alarm Clock is an interaction demo: it toggles/adds in-memory alarms and shows live clock hands, but does not schedule ringing. Sign Up displays demo feedback without real authentication.

## Make changes

Use each project folder as its editing boundary. Keep Pomodoro README, requirements, flow, testing, and deployment guides synchronized with its source. Root README indexes the collection.

## Source map

- [`Alarm Clock/index.html`](../Alarm%20Clock/index.html)
- [`Alarm Clock/script.js`](../Alarm%20Clock/script.js)
- [`Alarm Clock/style.css`](../Alarm%20Clock/style.css)
- [`Pomodoro Timer/.gitignore`](../Pomodoro%20Timer/.gitignore)
- [`Pomodoro Timer/README.md`](../Pomodoro%20Timer/README.md)
- [`Pomodoro Timer/TESTING.md`](../Pomodoro%20Timer/TESTING.md)
- [`Pomodoro Timer/ambient.js`](../Pomodoro%20Timer/ambient.js)
- [`Pomodoro Timer/audio/beach.ogg`](../Pomodoro%20Timer/audio/beach.ogg)
- [`Pomodoro Timer/audio/coffee-shop.ogg`](../Pomodoro%20Timer/audio/coffee-shop.ogg)
- [`Pomodoro Timer/audio/credits.html`](../Pomodoro%20Timer/audio/credits.html)
- [`Pomodoro Timer/audio/fireplace.wav`](../Pomodoro%20Timer/audio/fireplace.wav)
- [`Pomodoro Timer/audio/jazz.ogg`](../Pomodoro%20Timer/audio/jazz.ogg)
- [`Pomodoro Timer/audio/rain.mp3`](../Pomodoro%20Timer/audio/rain.mp3)
- [`Pomodoro Timer/base.css`](../Pomodoro%20Timer/base.css)
- [`Pomodoro Timer/data-tools.js`](../Pomodoro%20Timer/data-tools.js)
- [`Pomodoro Timer/docs/app-flow.md`](../Pomodoro%20Timer/docs/app-flow.md)
- [`Pomodoro Timer/docs/deployment.md`](../Pomodoro%20Timer/docs/deployment.md)
- [`Pomodoro Timer/docs/requirements.md`](../Pomodoro%20Timer/docs/requirements.md)
- [`Pomodoro Timer/favicon.svg`](../Pomodoro%20Timer/favicon.svg)
- [`Pomodoro Timer/help.html`](../Pomodoro%20Timer/help.html)
- [`Pomodoro Timer/history-editor.js`](../Pomodoro%20Timer/history-editor.js)
- [`Pomodoro Timer/index.html`](../Pomodoro%20Timer/index.html)
- [`Pomodoro Timer/mini-timer.js`](../Pomodoro%20Timer/mini-timer.js)
- [`Pomodoro Timer/package-lock.json`](../Pomodoro%20Timer/package-lock.json)
- [`Pomodoro Timer/package.json`](../Pomodoro%20Timer/package.json)
- [`Pomodoro Timer/privacy.html`](../Pomodoro%20Timer/privacy.html)
- [`Pomodoro Timer/script.js`](../Pomodoro%20Timer/script.js)
- [`Pomodoro Timer/scripts/build.mjs`](../Pomodoro%20Timer/scripts/build.mjs)
- [`Pomodoro Timer/scripts/check.mjs`](../Pomodoro%20Timer/scripts/check.mjs)
- [`Pomodoro Timer/scripts/test.mjs`](../Pomodoro%20Timer/scripts/test.mjs)
- [`Pomodoro Timer/site-info.css`](../Pomodoro%20Timer/site-info.css)
- [`Pomodoro Timer/site.webmanifest`](../Pomodoro%20Timer/site.webmanifest)
- [`Pomodoro Timer/storage-safety.js`](../Pomodoro%20Timer/storage-safety.js)
- [`Pomodoro Timer/style.css`](../Pomodoro%20Timer/style.css)
- [`Pomodoro Timer/tab-coordination.js`](../Pomodoro%20Timer/tab-coordination.js)
- [`Pomodoro Timer/tests/accessibility.test.cjs`](../Pomodoro%20Timer/tests/accessibility.test.cjs)
- [`Pomodoro Timer/tests/ambient.test.cjs`](../Pomodoro%20Timer/tests/ambient.test.cjs)
- [`Pomodoro Timer/tests/cue-preview.test.cjs`](../Pomodoro%20Timer/tests/cue-preview.test.cjs)
- [`Pomodoro Timer/tests/data-safety.test.cjs`](../Pomodoro%20Timer/tests/data-safety.test.cjs)
- [`Pomodoro Timer/tests/history-editing.test.cjs`](../Pomodoro%20Timer/tests/history-editing.test.cjs)
- [`Pomodoro Timer/tests/mini.test.cjs`](../Pomodoro%20Timer/tests/mini.test.cjs)
- [`Pomodoro Timer/tests/persistence.test.cjs`](../Pomodoro%20Timer/tests/persistence.test.cjs)
- [`Pomodoro Timer/tests/release.test.cjs`](../Pomodoro%20Timer/tests/release.test.cjs)
- [`Pomodoro Timer/tests/tab-coordination.test.cjs`](../Pomodoro%20Timer/tests/tab-coordination.test.cjs)
- [`Pomodoro Timer/tests/timer-fixture.cjs`](../Pomodoro%20Timer/tests/timer-fixture.cjs)
- [`Pomodoro Timer/tests/timer-recovery.test.cjs`](../Pomodoro%20Timer/tests/timer-recovery.test.cjs)
- [`Pomodoro Timer/tests/website-readiness.test.cjs`](../Pomodoro%20Timer/tests/website-readiness.test.cjs)
- [`Sign Up/index.html`](../Sign%20Up/index.html)
- [`To do list/index.html`](../To%20do%20list/index.html)
- [`To do list/script.js`](../To%20do%20list/script.js)
- [`To do list/style.css`](../To%20do%20list/style.css)

## Verification

From `Pomodoro Timer/`, run `npm run check` with Node.js 22+; it checks syntax, runs regression suites, and packages `dist/`.

1. Run Pomodoro checks from `Pomodoro Timer/`, not the collection root.
2. Open all four project entry pages and check responsive layout, controls, and their documented persistence boundaries.
3. Inspect the browser console and Network panel for missing assets or script errors; check keyboard access, phone width, and 200% zoom.

## Deployment

For Pomodoro, follow its [deployment guide](../Pomodoro%20Timer/docs/deployment.md) and publish only its checked build output. Other demos can be served as static folders. Keep private development material out of the public release.

## Keep documentation current

Update the README and this guide when entry points, dependencies, behavior, or deployment steps change. Record commands actually run and distinguish them from pending manual checks.
