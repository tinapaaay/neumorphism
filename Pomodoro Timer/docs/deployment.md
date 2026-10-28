# Pomodoro Timer — build and deployment

Use Node.js 22+ for tooling. The app remains static HTML/CSS/JavaScript; no account, database, server API, dependency installation, or hosting secrets are required by the build.

## Verify and build

From `Pomodoro Timer/`:

```sh
npm run check
```

This parses JavaScript, runs all eleven regression suites, and creates `dist/`. The build copies only the declared site assets, including the five recordings and their credits. Tests, docs, package files, editor settings, and tooling stay out of the public output. Generated folders are ignored by Git.

## Preview the output

```sh
python3 -m http.server 5500 --directory dist
```

Open [the local preview](http://localhost:5500/). Use a separate port/browser profile for destructive restore/quota experiments. Browser storage is scoped by scheme, host and port; local data does not automatically transfer to a public URL. Export a normal backup before changing origins, then import it on the intended destination.

## Host the static folder

Configure a static host to run `npm run check` in `Pomodoro Timer` and publish `Pomodoro Timer/dist`, or upload the contents of the already-built folder to an HTTPS static host. The existing Pomodoro checks workflow tests/builds only. A separate, manually triggered **Publish Pomodoro** workflow can publish this folder to GitHub Pages after Pages is configured.

Keep relative files together. The icon, manifest, mini-window styles, scripts, and recordings support a subdirectory as well as a domain root. Serve the entry page, scripts, and styles with revalidation because their filenames are not fingerprinted; avoid long-lived immutable caching of these files. Serve `.ogg`, `.mp3`, `.wav`, `.svg`, and the manifest with appropriate content types.

After choosing the final public URL, add the real canonical/share URL and verify metadata against that host. No placeholder domain or social preview image is generated. SVG icon rendering and social-card previews should be checked in the chosen target browsers/services.

## Release checks

- Confirm the GitHub checks pass after pushing; local success is not a cloud run.
- Finish the pending device, screen-reader, zoom/reflow, import/download and OS-notification checks in [TESTING.md](../TESTING.md).
- Verify loading, Mini, sound playback, credits, refresh recovery and backup/import on the final HTTPS origin.
- Review the browser-local data explanation; this build does not provide login, cloud sync, offline caching, or reliable alerts after the page closes.
- Ask existing users to refresh old tabs after an update so they use the current tab-ownership guard.

The GitHub workflow follows the official [checkout](https://github.com/actions/checkout) and [setup-node](https://github.com/actions/setup-node) action documentation, checked on 2026-10-28. It grants only `contents: read`, disables persisted checkout credentials, and does not enable dependency caching or deployment.

## GitHub Pages option

The prepared `.github/workflows/pomodoro-pages.yml` runs only when explicitly dispatched from `main`. It checks the site first, uploads only `Pomodoro Timer/dist`, then deploys with the standard `github-pages` environment and deploy-only `pages: write` / `id-token: write` permissions. It publishes the timer at the repository Pages root; it does not package the other sample projects. Do not use it to replace an existing repository site unless that destination is intended.

1. Commit/push the Pomodoro changes and workflow to the intended repository.
2. In repository Settings → Pages, select GitHub Actions as the source.
3. Run **Publish Pomodoro** from Actions on `main`.
4. Open the URL returned by the deployment job. Confirm HTTPS and complete the live-origin checks below.

No repository hosting settings were changed and no public deployment was performed during local preparation. A successful local build is not evidence of a successful GitHub workflow run.

### Live-origin smoke check

- Load the root, Help, Privacy and Audio credits; verify their links and MIME types.
- Start/pause/resume, refresh, and return from a background tab. One session must be credited once.
- Export a local backup before changing origin, then restore on the public address.
- Open/close mobile cards, enter a task, open Edit Profile/history and verify narrow/landscape layouts.
- Play ambient audio, hide cards, and switch tabs; confirm no recording is downloaded before Play.
- Check notifications and Mini in each supported browser; do not promise identical OS behavior.
- Check keyboard focus, 200% zoom and a screen reader, and check a real phone.

Workflow setup follows the official [GitHub Pages custom-workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), reviewed October 28, 2026. GitHub Pages was selected. Enabling it on the existing private repository returned HTTP 422: “Your current plan does not support GitHub Pages for this repository.” The repository remains private and unpublished. A separate public build-only repository or a plan/host change is needed before this workflow can publish. The actual live URL remains unconfirmed.
