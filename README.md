# Neumorphism

A growing collection of my neumorphic web designs, built with HTML, CSS, and JavaScript. These projects explore soft shadows, rounded surfaces, tactile buttons, and small interactions that make everyday tools feel playful.

## Projects

| Project | Description |
| --- | --- |
| [Pomodoro Timer](Pomodoro%20Timer/) | A focus timer with a customizable profile, session history, draggable cards, and weekly stats. |
| [To do list](To%20do%20list/) | A daily dashboard with tasks, a live clock, water tracking, and notes. |
| [Alarm Clock](Alarm%20Clock/) | A neumorphic clock interface with alarm controls and a live clock mode. |
| [Sign Up](Sign%20Up/) | A sign-up UI experiment with password visibility controls and form interactions. |

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

- **Custom durations:** Set focus, short break, and long break lengths in Edit Profile. Defaults are 25, 5, and 15 minutes.
- **Automatic break cycle:** Every fourth completed focus session switches to a long break. Breaks wait for you to press the timer; Skip break starts the next focus session immediately.
- **Daily goals:** Customize the number of focus beads. Completed sessions fill the next bead, with a circle animation and sound feedback.
- **Current task:** Optionally show “What are you focusing on?” beneath the timer. Task names are saved with completed focus sessions and appear in calendar history.
- **Local profile:** Edit your display name, description, photo, goal, and timer preferences.
- **Calendar history:** Browse completed sessions by date and hover, focus, or tap a day for a small history popup.
- **Weekly stats:** View Monday–Sunday focus time and completed sessions, plus a daily streak that continues across weeks. Yesterday's streak stays active while today is still in progress.
- **Draggable cards:** Move cards beside the timer, bring the most recently used card to the front, or use Reset layout to return them all to the sidebar.
- **Ambient sounds:** Play bundled rain, café, ocean, fireplace, and jazz recordings or generated white noise with volume control. Audio starts manually; selection and volume are saved. See the [audio credits](Pomodoro%20Timer/audio/credits.html).
- **Session recovery:** Running and paused timer state survives refresh. An elapsed focus session is recorded when the app is reopened, without counting it twice.

### Controls

Click the timer dial to start, pause, or resume. Open the menu in the upper-left corner for your profile and cards.

Drag a card by its heading to move it. With a floating card's heading focused, use arrow keys to move it, hold Shift for larger steps, or press Escape to return it to the sidebar. You can also use its return button.

## To do list

Add tasks, mark them complete, clear finished tasks, and undo a clear. The dashboard also includes a live clock, calendar, notes area, time remaining today, and interactive water intake tracking.

## Files

The Alarm Clock, Pomodoro Timer, and To do list each separate their markup, styles, and behavior into `index.html`, `style.css`, and `script.js`. The Pomodoro Timer also separates storage recovery, tab ownership, backups, history editing, Mini, and audio into scripts; its [README](Pomodoro%20Timer/README.md) maps them. Sign Up currently lives in a single HTML file.

## Data and scope

These are browser-based projects with no backend or account system. Features that save data use `localStorage` on the current browser and origin; data does not sync between devices or browsers, and clearing site data removes it. Profile photos also remain in browser storage.

The timer can request desktop notifications while its owner tab is running; closing the page stops live alerts. Alarm Clock does not schedule a ringing alarm and does not persist its alarm list. The Sign Up project is a UI demo and does not create real accounts.

## Next improvements

- Continue adding neumorphic designs and refining the existing interactions.

## Development guide

See [Development and maintenance](docs/DEVELOPMENT.md) for setup, source files, implementation limits, editing instructions, verification, and deployment.
