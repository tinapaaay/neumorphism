# Alarm Clock demo

A neumorphic clock and alarm-list interaction demo. Settings switch the dial between fixed 3:00 and live local time, toggle click sounds, and open Add Alarm. Alarm entries live only in memory. No alarm scheduler or ringing behavior is implemented; the next-alarm label uses the first enabled list item, not chronological scheduling.

## Run locally

From this folder, run `python3 -m http.server 5500` and open [localhost:5500](http://localhost:5500). No build or package installation is required. Alternatively, serve the repository root and navigate to this folder.

## Edit

Edit `index.html`, `style.css`, and `script.js`. Tailwind, Google Fonts, and Tone.js load externally.

## Manual checks

Switch clock modes, mute/unmute, add an alarm, and toggle entries. Refresh and confirm demo state resets. Do not use this as a wake-up alarm.

These are suggested checks, not a record of completed browser QA. Use a separate origin/browser profile for destructive storage checks.

## Deploy

Serve this folder and its assets as static files, preserving relative paths. Check external resources and the controls on the actual deployed URL.
