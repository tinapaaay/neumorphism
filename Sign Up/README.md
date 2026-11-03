# Sign Up

A static neumorphic sign-up form prototype with password visibility and toast feedback.

## Documentation

- [Requirements](docs/requirements.md): implemented behavior, technical design, data, and scope.
- [App flow](docs/app-flow.md): user journeys, state transitions, and recovery paths.
- [Testing](TESTING.md): setup, manual regression cases, and current test coverage.

## Run locally

No build step, package installation, or backend is required. Open this project's `index.html` using VS Code Live Server.

Alternatively, run `python3 -m http.server 5500` from the repository root, then open [this project](http://localhost:5500/Sign%20Up/). Reuse an existing server instead of starting another on the same port.

Keep the same browser, host, and port when testing saved data. `localhost` and `127.0.0.1` are different storage origins. Use a separate browser profile or disposable origin for destructive tests.

## Current features

- Required name, username, email, and password fields with browser-native email/required validation.
- Password visibility toggle with an eye icon.
- Local welcome toast after a valid form submission.
- Google and Facebook buttons showing provider-specific demo toasts.

## Source map

All markup, CSS, SVG icons, and JavaScript are in `index.html`. Inline functions are `toggleEye`, `handleSubmit`, `triggerSocial`, and `showToast`.

## Scope and limitations

No account is created. There is no backend, OAuth integration, credential validation, password policy, or application storage. Use sample values, not real credentials. Tailwind and Google Fonts Inter load from CDNs. The password-eye button is removed from normal tab order; visible labels/focus behavior need accessibility improvement.

Source reviewed: 2026-10-27. These documents describe the current implementation, not a promise that every browser test has passed. Keep requirements, app flow, and testing cases updated alongside behavior changes.

## Edit

Markup, styles, and scripts are in `index.html`. Tailwind and Inter load from external services.

## Deploy

Serve this folder and its assets as static files, preserving relative paths. Check external resources and the controls on the actual deployed URL.
