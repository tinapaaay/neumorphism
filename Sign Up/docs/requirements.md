# Sign Up — requirements

Source reviewed 2026-10-27. [App flow](app-flow.md) · [Testing](../TESTING.md)

## Scope and architecture

An HTML-only UI prototype containing inline CSS and JavaScript. It demonstrates form presentation and feedback. There is no account service, API endpoint, OAuth redirect, database, localStorage, or credential persistence implemented by the app. Browser-managed autofill/password saving is separate from app storage.

| ID | Implemented requirement |
| --- | --- |
| SIGN-01 | Show full name, username, email, and password inputs. All are required; email uses the browser's native email type validation. Password starts masked. Autocomplete attributes are provided. |
| SIGN-02 | Clicking the eye button toggles the password input between password/text and updates its SVG. The password value is retained while toggling. |
| SIGN-03 | A valid native form submission is intercepted with `preventDefault`. A welcome toast uses the trimmed full name, or User if trimming produces an empty string. There is no account creation or navigation. |
| SIGN-04 | Google and Facebook buttons are non-submit controls and display Continue with provider toasts. They do not authenticate or contact a provider integration. |
| SIGN-05 | Toast messages use text content, become visible with a small transition, then hide after about two seconds. Repeated toasts replace the prior text and timeout. |

## Dependencies and presentation

The page loads Tailwind CDN and Google Fonts Inter. It uses a neutral `#EAEAEA` canvas, `#574C57` text palette, inset pill fields, raised buttons, a rounded card, and inline SVG provider/eye icons. Layout uses responsive Tailwind classes. No package installation or build is required; use Live Server or localhost for consistent review.

## Validation and accessibility boundaries

- There is no password minimum length, strength check, confirmation, username availability check, whitespace-only username guard, or server-side validation.
- A whitespace-only full name can satisfy native required validation and display the User fallback. Document the actual demo behavior rather than treating trimming as full validation.
- Input identification relies on placeholders; visible associated field labels are absent. The eye button has an aria-label but `tabindex="-1"` excludes it from normal tab navigation. Some focus outlines are suppressed and the toast has no live-region role.
- Do not describe provider buttons as connected sign-in. Adding real authentication requires a new security/data-flow design and tests; this document does not imply that work exists.
