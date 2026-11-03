# Sign Up — testing

[Requirements](docs/requirements.md) · [App flow](docs/app-flow.md)

## Setup and status

Serve using [README](README.md). Use sample values, for example Demo User, demo-user, demo@example.com, and a disposable sample password. Source reviewed 2026-10-27. The cases below are **not executed passes**. No automated regression suite or separate JavaScript file is committed; the app's JavaScript is inline in `index.html`.

Inspect the browser console and Network panel during the manual pass. CDN/font traffic is expected; submitting this demo must not create a registration/OAuth request.

## Verified results — 2026-10-27

- [x] Node.js syntax check passed for the inline JavaScript extracted from `index.html`.
- [x] Documentation links and requirement-to-test references validated.

These checks verify parsing and documentation consistency only. No runtime or complete manual browser pass is recorded here; the acceptance cases below remain unchecked. Pomodoro's automated suites do not cover this project.

## Acceptance and boundary checks

- [ ] **SIGN-T01 / SIGN-01:** Submit empty fields and an invalid email. Native browser validation blocks submit feedback; correct the fields and verify successful local submission.
- [ ] **SIGN-T02 / SIGN-02:** Type a sample password and click the eye twice. The input value stays unchanged while type/icon toggle in both directions.
- [ ] **SIGN-T03 / SIGN-03:** Submit a valid sample form. Expect Welcome, Demo User!, no navigation, no account creation, and no registration request. Existing input values remain.
- [ ] **SIGN-T04 / SIGN-03:** Enter a whitespace-only full name with otherwise valid fields. The current demo displays the User fallback; it does not implement a trimmed-name error. Record this boundary.
- [ ] **SIGN-T05 / SIGN-04:** Click Google and Facebook with empty form fields. Each shows its provider toast without native form validation, redirect, provider login, or OAuth activity.
- [ ] **SIGN-T06 / SIGN-05:** Trigger several toasts quickly; the last text replaces the prior message and hides about two seconds after the latest action. User-provided angle brackets in the name display as text rather than HTML.
- [ ] **SIGN-T07 / SIGN-01:** Test desktop, 390px width, long input values, and 200% zoom. Verify readable fields and no horizontally clipped form controls. Check the effect of blocked font/Tailwind resources.
- [ ] **SIGN-T08 / accessibility boundaries:** Walk through Tab/Shift+Tab, Enter submission, eye control, visible focus, and screen-reader output. Record placeholder-only labels, skipped eye tab stop, and non-announced toast as known gaps rather than claiming complete accessibility.
- [ ] **SIGN-T09 / scope:** Inspect app code/storage/network after submission. There is no application persistence or auth API. Browser autofill may retain values independently; do not mistake that for an account system.

Record date, browser/version, OS, viewport, case ID, expected/actual result, and Pass/Fail/Not run. Real authentication is outside this prototype's test scope.
