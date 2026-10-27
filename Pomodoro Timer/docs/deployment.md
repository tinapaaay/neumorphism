# Pomodoro Timer — build and deployment

Use Node.js 22+ for tooling. The app remains static HTML/CSS/JavaScript; no account, database, server API, dependency installation, or hosting secrets are required by the build.

## Verify and build

From `Pomodoro Timer/`:

```sh
npm run check
```

This parses JavaScript, runs all nine regression suites, and creates `dist/`. The build copies only the declared site assets, including the five recordings and their credits. Tests, docs, package files, editor settings, and tooling stay out of the public output. Generated folders are ignored by Git.

## Preview the output

```sh
python3 -m http.server 5500 --directory dist
```

Open [the local preview](http://localhost:5500/). Use a separate port/browser profile for destructive restore/quota experiments. Browser storage is scoped by scheme, host and port; local data does not automatically transfer to a public URL. Export a normal backup before changing origins, then import it on the intended destination.

## Host the static folder

Configure a static host to run `npm run check` in `Pomodoro Timer` and publish `Pomodoro Timer/dist`, or upload the contents of the already-built folder to an HTTPS static host. The included GitHub workflow tests/builds only; it does not publish or alter hosting settings.

Keep relative files together. The icon, manifest, mini-window styles, scripts, and recordings support a subdirectory as well as a domain root. Serve the entry page, scripts, and styles with revalidation because their filenames are not fingerprinted; avoid long-lived immutable caching of these files. Serve `.ogg`, `.mp3`, `.wav`, `.svg`, and the manifest with appropriate content types.

After choosing the final public URL, add the real canonical/share URL and verify metadata against that host. No placeholder domain or social preview image is generated. SVG icon rendering and social-card previews should be checked in the chosen target browsers/services.

## Release checks

- Confirm the GitHub checks pass after pushing; local success is not a cloud run.
- Finish the pending device, screen-reader, zoom/reflow, import/download and OS-notification checks in [TESTING.md](../TESTING.md).
- Verify loading, Mini, sound playback, credits, refresh recovery and backup/import on the final HTTPS origin.
- Review the browser-local data explanation; this build does not provide login, cloud sync, offline caching, or reliable alerts after the page closes.
- Ask existing users to refresh old tabs after an update so they use the current tab-ownership guard.

The GitHub workflow follows the official [checkout](https://github.com/actions/checkout) and [setup-node](https://github.com/actions/setup-node) action documentation, checked on 2026-10-28. It grants only `contents: read`, disables persisted checkout credentials, and does not enable dependency caching or deployment.
