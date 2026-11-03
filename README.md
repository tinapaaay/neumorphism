# Neumorphism

A growing collection of my neumorphic web designs, built with HTML, CSS, and JavaScript. These projects explore soft shadows, rounded surfaces, tactile buttons, and small interactions that make everyday tools feel playful.

## Projects

| Project | Description |
| --- | --- |
| [Pomodoro Timer](Pomodoro%20Timer/) | A focus timer with a customizable profile, session history, draggable cards, and weekly stats. |
| [To do list](To%20do%20list/) | A daily dashboard with tasks, a live clock, water tracking, and notes. |
| [Alarm Clock](Alarm%20Clock/) | A neumorphic clock interface with alarm controls and a live clock mode. |
| [Sign Up](Sign%20Up/) | A sign-up UI experiment with password visibility controls and form interactions. |

## Project documentation

Each project has its own README, technical requirements, user/state flow, and testing guide. Requirements describe the implemented scope and known limitations. Testing checkboxes are a checklist, not evidence that a case has passed.

| Project | Overview | Technical requirements | App flow | Testing |
| --- | --- | --- | --- | --- |
| Pomodoro Timer | [README](Pomodoro%20Timer/README.md) | [Requirements](Pomodoro%20Timer/docs/requirements.md) | [App flow](Pomodoro%20Timer/docs/app-flow.md) | [Testing](Pomodoro%20Timer/TESTING.md) |
| To do list | [README](To%20do%20list/README.md) | [Requirements](To%20do%20list/docs/requirements.md) | [App flow](To%20do%20list/docs/app-flow.md) | [Testing](To%20do%20list/TESTING.md) |
| Alarm Clock | [README](Alarm%20Clock/README.md) | [Requirements](Alarm%20Clock/docs/requirements.md) | [App flow](Alarm%20Clock/docs/app-flow.md) | [Testing](Alarm%20Clock/TESTING.md) |
| Sign Up | [README](Sign%20Up/README.md) | [Requirements](Sign%20Up/docs/requirements.md) | [App flow](Sign%20Up/docs/app-flow.md) | [Testing](Sign%20Up/TESTING.md) |

Update the affected documents when behavior changes. Record actual test runs in the project's testing guide with browser, environment, and result evidence.

## Run locally

No build step or package installation is needed.

1. Clone the repository:

   ```sh
   git clone https://github.com/tinapaaay/neumorphism.git
   cd neumorphism
   ```

2. Open a project's `index.html` using **Live Server** in VS Code.
3. Keep using the same local address and port to retain that browser's saved data.

Alternatively, if Python 3 is installed, run this from the repository root:

```sh
python3 -m http.server 5500
```

Then open [the Pomodoro Timer](http://localhost:5500/Pomodoro%20Timer/) or another project folder in your browser.

Some pages load Tailwind CSS, Google Fonts, and Tone.js from CDNs, so an internet connection is needed for those resources.

## Pomodoro Timer

- **Mini timer:** Click Mini beneath the dial for synchronized start/pause, reset, task label, and skip-break controls. Uses an always-on-top Document Picture-in-Picture window when available, otherwise a separate small window. Keep the main tab open; closing the mini window leaves the timer running.
- **Focus presets:** In Edit Profile → Timer, choose Study (25/5), Deep Work (50/10), or save up to 12 custom routines with focus, short-break, long-break, and cycle settings. Save profile to apply; Cancel discards draft changes. Presets are included in backups. Running and paused sessions keep their duration.
- **Custom durations:** Set focus, short break, and long break lengths in Edit Profile. Defaults are 25, 5, and 15 minutes.
- **Automatic break cycle:** Choose a long break every 1–12 completed focus sessions (default: 4). Optional switches auto-start breaks and the next focus session independently; both are off by default. Skip break starts the next focus session immediately.
- **One-minute cue:** Enable the optional soft focus chime in Edit Profile → Timer. It plays once as a focus session enters its final minute, respects mute, and does not replay after pause/resume or recovery. Off by default; saved in profile backups.
- **Desktop notifications:** Enable focus and break completion alerts in Edit Profile, allow browser permission, and use the test button to check delivery. Notifications require a supported desktop browser on HTTPS or localhost and an open tab; browser throttling, sleep, and system notification settings can delay or suppress alerts. Reopening an expired timer records the completion without sending an old alert or auto-starting another session.
- **Daily goals:** Customize the number of focus beads. Completed sessions fill the next bead, with a circle animation and sound feedback.
- **Task queue:** Add, rename, delete and restore tasks with Undo. Set daily focus targets, select a task for focus, mark it complete or reopen it, and track completed sessions and focus time per task. Use Focus to send a queued task to the timer, including during a running or paused session without resetting it. Clear completed removes finished queue items with one batch Undo. Completing the selected task selects the next pending task.
- **Current task:** Optionally show “What are you focusing on?” beneath the timer. Task names are saved with completed focus sessions and appear in calendar history.
- **Backup & restore:** Export your saved profile, photo, tasks, history, layout and ambient preferences as JSON. Import validates the file, previews its contents, and asks before replacing saved data. Restore resets the timer and keeps one Undo restore copy.
- **Mobile layout:** On screens up to 640px wide, the timer stays centered and cards are hidden behind a tap-to-open menu. Opened cards stack in a scrollable panel with larger touch controls. Desktop card positions return on wider screens.
- **Local profile:** Edit your display name, description, photo, goal, and timer preferences in Profile, Timer, Notifications, and Backup & Restore tabs. Unsaved values stay in place across tabs, with Save and Cancel always visible.
- **Calendar history:** Browse completed sessions by date and hover, focus, or tap a day for a small history popup.
- **Weekly stats:** View Monday–Sunday focus time and completed sessions, plus a daily streak that continues across weeks. Yesterday's streak stays active while today is still in progress.
- **Draggable cards:** Move cards beside the timer, bring the most recently used card to the front, or use Reset layout to return them all to the sidebar.
- **Ambient sounds:** Play bundled rain, fireplace, beach, jazz, and coffee-shop recordings, or generated white noise, with volume control. Playback continues when the sidebar closes or the browser tab is in the background. Audio starts manually; sound choice and volume are saved. Browser or device sleep and closing the page stop playback. Source and license details are in [Audio credits](Pomodoro%20Timer/audio/credits.html); the original YouTube recordings remain optional external links.
- **Session recovery:** Running and paused timer state survives refresh. An elapsed focus session is recorded when the app is reopened, without counting it twice.

### Controls

Press Space to start/pause and R to reset when the page itself has focus. Shortcuts ignore typing, focused controls, open dialogs, modifier combinations, and held-key repeats.

Click the timer dial to start, pause, or resume. Open the menu in the upper-left corner for your profile and cards.

Drag a card by its heading to move it. With a floating card's heading focused, use arrow keys to move it, hold Shift for larger steps, or press Escape to return it to the sidebar. You can also use its return button.

## To do list

Add tasks, mark them complete, clear finished tasks, and undo a clear. The dashboard also includes a live clock, calendar, notes area, time remaining today, and interactive water intake tracking.

## Files

The Alarm Clock, Pomodoro Timer, and To do list each separate their markup, styles, and behavior into `index.html`, `style.css`, and `script.js`. The Pomodoro Timer also has `ambient.js` for its soundscapes and `data-tools.js` for backup and restore. Sign Up currently lives in a single HTML file.

## Data and scope

These are browser-based projects with no backend or account system. Features that save data use `localStorage` on the current browser and origin; data does not sync between devices or browsers, and clearing site data removes it. Profile photos also remain in browser storage.

Timer recovery does not provide notifications while the page is closed. The Sign Up project is a UI demo and does not create real accounts.

## Next improvements

- Refine the ambient sound selection and loop transitions.
- Continue adding neumorphic designs and refining the existing interactions.
