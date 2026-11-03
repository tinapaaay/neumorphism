# To do list

A browser-local daily dashboard for scheduled tasks, personal notes, water tracking, and a live clock.

## Documentation

- [Requirements](docs/requirements.md): implemented behavior, technical design, data, and scope.
- [App flow](docs/app-flow.md): user journeys, state transitions, and recovery paths.
- [Testing](TESTING.md): setup, manual regression cases, and current test coverage.
- [Manual QA results](docs/manual-qa.md): native Opera checks, fixes, evidence and remaining device checks.

## Run locally

No build step, package installation, or backend is required to run the dashboard. Open this project's `index.html` using VS Code Live Server.

Alternatively, run `python3 -m http.server 5500` from the repository root, then open [this project](http://localhost:5500/To%20do%20list/). Reuse an existing server instead of starting another on the same port.

Keep the same browser, host, and port when testing saved data. `localhost` and `127.0.0.1` are different storage origins. Use a separate browser profile or disposable origin for destructive tests.

## Current features

- Add/edit tasks with due dates, normal/high/low priority, and up to three pinned tasks.
- Repeat tasks daily, weekly, or on selected weekdays; stop a series or delete one occurrence.
- Use Today, Upcoming, Completed, All, and calendar-date filters.
- Reorder within pinned/unpinned groups using drag/drop, menu actions, or Alt + Up/Down on a task's options button.
- Complete/reopen tasks, clear visible finished items, and Undo the latest removal operation.
- Track daily task progress, remaining local day, water in 250 mL steps, and saved notes.
- Open **Review ↗** beside daily progress for a Monday–Sunday review: completed work, current carryover, daily checklist progress and water history. Cleared tasks remain in totals when saved progress exists. Missing days show a dash; historical water targets are never guessed.
- Customize name, greeting, water goal, completion sound, and volume.
- Download a JSON backup, preview and restore it in another browser, or undo the latest restore from Settings → Backup & restore.

## Source map

| File | Responsibility |
| --- | --- |
| `index.html` | Dashboard cards, task/settings dialogs, and seed task labels |
| `style.css` | Warm neumorphic styling, menus, motion, and mobile layout |
| `script.js` | Tasks/recurrence, persistence, filters/calendar, notes, water, settings, and sounds |

## Scope and limitations

There is no account, backend, automatic cloud sync, or scheduled reminder delivery. Use Settings → Backup & restore to move data between browsers; restore replaces the destination dashboard and keeps a recovery copy. Deletion Undo is held in memory and is lost on reload. Repeating occurrences are generated when the app loads, dates/months are visited, and the local day changes; there is no server scheduler. Google Fonts is the only external resource referenced by the page. Modern native dialog/popover support is required.

## Browser tests

The regression suite is saved in `tests/`. With Node.js available, run `npm install` once, then `npm test`. On macOS the tests use installed Opera when available. For another Opera installation, set `OPERA_EXECUTABLE` to its executable path. If Opera is absent, install a Playwright browser with `npx playwright install chromium` before testing. These are development dependencies; the dashboard itself still runs without them.

Thirteen automated tests passed in isolated Opera on 2026-10-29. See [Testing](TESTING.md) for coverage and remaining manual checks. Tests use disposable profiles and never clear the user's browser data.
