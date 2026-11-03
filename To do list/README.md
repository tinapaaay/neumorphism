# Daily dashboard

Add and complete tasks, clear completed tasks with Undo, and track daily water intake. Tasks and water use localStorage (`todo-dashboard-tasks` and `todo-dashboard-water`). Notes are an editable page area without persistence. The page also shows a clock and calendar.

## Run locally

From this folder, run `python3 -m http.server 5500` and open [localhost:5500](http://localhost:5500). No build or package installation is required. Alternatively, serve the repository root and navigate to this folder.

## Edit

Edit markup in `index.html`, presentation in `style.css`, and tasks/water/clock behavior in `script.js`. Google Fonts and Tone.js load externally.

## Manual checks

Add/complete/clear tasks, undo a clear, and refresh. Change water intake and refresh. Check notes behavior separately and verify the clock updates.

These are suggested checks, not a record of completed browser QA. Use a separate origin/browser profile for destructive storage checks.

## Deploy

Serve this folder and its assets as static files, preserving relative paths. Check external resources and the controls on the actual deployed URL.
