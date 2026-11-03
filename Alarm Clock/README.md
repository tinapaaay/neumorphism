# Alarm Clock

A neumorphic analog-clock and alarm-list UI demo with fixed-reference and live clock modes.

## Documentation

- [Requirements](docs/requirements.md): implemented behavior, technical design, data, and scope.
- [App flow](docs/app-flow.md): user journeys, state transitions, and recovery paths.
- [Testing](TESTING.md): setup, manual regression cases, and current test coverage.

## Run locally

No build step, package installation, or backend is required. Open this project's `index.html` using VS Code Live Server.

Alternatively, run `python3 -m http.server 5500` from the repository root, then open [this project](http://localhost:5500/Alarm%20Clock/). Reuse an existing server instead of starting another on the same port.

Keep the same browser, host, and port when testing saved data. `localhost` and `127.0.0.1` are different storage origins. Use a separate browser profile or disposable origin for destructive tests.

## Current features

- Starts at the reference time 3:00; menu toggles the analog hands to live local time.
- Displays three seed alarm rows; clicking a row toggles its active state.
- Add an alarm through an hour/minute/AM-PM modal.
- Show enabled/disabled feedback, a first-active-alarm label, and optional tactile click audio.

## Source map

| File | Responsibility |
| --- | --- |
| `index.html` | Clock face, menu, alarm list, modal, CDN resources |
| `style.css` | Neumorphic clock/card, switch, and modal appearance |
| `script.js` | In-memory alarms, hand rotation, toggles, toasts, and click audio |

## Scope and limitations

This is an interface demo, not a working wake-up alarm service. It does not schedule ringing or notifications and does not save alarms across reload. “Next alarm” means the first active row in list order, not the next chronological event. It loads Tailwind, Google Fonts, and Tone.js from CDNs. See requirements for validation and accessibility gaps.

Source reviewed: 2026-10-27. These documents describe the current implementation, not a promise that every browser test has passed. Keep requirements, app flow, and testing cases updated alongside behavior changes.

## Edit

Edit `index.html`, `style.css`, and `script.js`. Tailwind, Google Fonts, and Tone.js load externally.

## Deploy

Serve this folder and its assets as static files, preserving relative paths. Check external resources and the controls on the actual deployed URL.
