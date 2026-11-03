# Alarm Clock — app flow

[Requirements](requirements.md) · [Testing](../TESTING.md)

```mermaid
flowchart TD
  A[Open page] --> B[Reset in-memory seed alarms and 3:00 mode]
  B --> C[Render hands, alarm rows and first-active label]
  C --> D{Action}
  D -->|Click alarm row| E[Toggle active state, render and toast]
  E --> C
  D -->|Menu clock mode| F[Switch static or live hand rotation]
  F --> C
  D -->|Menu tactile audio| G[Toggle click sound preference]
  G --> C
  D -->|Menu Add Alarm| H[Show alarm modal]
  H -->|Cancel| C
  H -->|Save valid hour| I[Append active alarm and close modal]
  I --> C
  H -->|Invalid hour| H
```

The menu closes after choosing its clock, audio, or Add Alarm action; clicking outside also dismisses it. Live Time only updates the analog hands. It does not activate scheduled alarm behavior.

Saving an alarm changes list order and the first-active label. Disabling all rows shows All alarms disabled. Reloading loses additions/toggles/mode and restores seed state.

No later screen, ringing event, notification permission request, or server submission follows these interactions. See the requirements document for the current minute-validation and keyboard-access gaps.
