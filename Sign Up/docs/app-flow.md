# Sign Up — app flow

[Requirements](requirements.md) · [Testing](../TESTING.md)

```mermaid
flowchart TD
  A[Open static sign-up screen] --> B[Fill name, username, email and password]
  B --> C{Browser required and email validation pass?}
  C -->|No| D[Browser validation feedback]
  D --> B
  C -->|Yes| E[Prevent navigation and show welcome toast]
  E --> F[Hide toast after about two seconds]
  B -->|Click eye| G[Toggle masked or visible password]
  G --> B
  A -->|Google or Facebook| H[Show provider demo toast]
  H --> F
```

Form submission keeps the entered fields on the same page. It does not clear them, create an account, log in, request OAuth consent, or send a registration request. Provider buttons work independently of native form validation because they are not submit buttons.

A later toast replaces the previous toast and restarts its hide timer. Reloading recreates the page; the app has no persistence logic. A browser may separately restore/autofill form values, which is not an app-level account feature.
