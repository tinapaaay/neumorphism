---
version: alpha
name: Pomodoro Timer
description: A browser-local focus timer built as one soft, pressable desk object — a neumorphic dial with handwritten labels, a task queue, and session history.

colors:
  primary: "#2D627F"
  secondary: "#445D6E"
  tertiary: "#76A8C3"
  neutral: "#C4D1DC"
  surface: "#DCE5EC"
  surface-raised: "#E4EDF3"
  surface-pressed: "#C7D2DC"
  on-surface: "#18222B"
  error: "#8E3B46"

typography:
  display-time:
    fontFamily: Inter
    fontSize: 23px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 1.5px
    fontFeature: "'tnum' 1"
  headline:
    fontFamily: Short Stack
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.4
  title:
    fontFamily: Short Stack
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.35
  body:
    fontFamily: Short Stack
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: Short Stack
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0.3px
  input:
    fontFamily: Short Stack
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.3

rounded:
  sm: 8px
  md: 12px
  lg: 20px
  xl: 28px
  plate: 54px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px

components:
  page:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
  timer-plate:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.headline}"
    rounded: "{rounded.plate}"
    size: 256px
  dial:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.display-time}"
    rounded: "{rounded.full}"
    size: 128px
  dial-pushed:
    backgroundColor: "{colors.surface-pressed}"
    textColor: "{colors.on-surface}"
    typography: "{typography.display-time}"
    rounded: "{rounded.full}"
    size: 128px
  pill-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: 4px 12px
  pill-button-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: 4px 12px
  text-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.label}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.input}"
    rounded: "{rounded.md}"
    padding: 8px 12px
  input-placeholder:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    typography: "{typography.input}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  card-title:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.title}"
  meta-text:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    typography: "{typography.label}"
  dialog:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
  goal-bead:
    backgroundColor: "{colors.neutral}"
    rounded: "{rounded.full}"
    size: 26px
  goal-bead-active:
    backgroundColor: "{colors.tertiary}"
    rounded: "{rounded.full}"
    size: 26px
  progress-fill:
    backgroundColor: "{colors.tertiary}"
    rounded: "{rounded.full}"
    height: 6px
  focus-ring:
    backgroundColor: "{colors.primary}"
    height: 3px
  divider:
    backgroundColor: "{colors.neutral}"
    height: 1px
  error-message:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.error}"
    typography: "{typography.body}"
---

# Pomodoro Timer

## Overview

The timer is meant to feel like **one physical object on a desk**: a pale slate plate holding a round button you press to start. It's used for hours at a stretch, mostly glanced at from the corner of the eye, so it has to be calm when idle and obvious when running. A pushed-in dial reads as "running" even when you can't read the digits.

The direction is **Soft Tactile neumorphism with handwritten labels**. Everything is made from one material, the cool slate surface, and depth comes only from light: a highlight on the top-left and a shadow on the bottom-right. Labels are set in Short Stack, which looks like marker on masking tape, so the object feels personal rather than corporate. Inter appears only in the countdown digits, where steady, evenly spaced numbers matter more than character.

What it gives up, on purpose: **color and contrast range**. With one surface color and no colored buttons, emphasis comes from depth (raised vs. pressed), from the font, and from the one slate-blue accent. The interface can never get loud. For a focus tool, that is the point.

Light mode only. A dark version would need its own shadow math, because neumorphic highlights don't work on dark grounds. Treat it as a separate project, not a color swap.

## Colors

Every color is a tint of the same cool slate, hue roughly 205–210°. Nothing is pure grey, and nothing comes from a stock palette.

- **Surface (#DCE5EC):** *The plate.* The page, the plate, the dial, the cards and the pills are all this one color. Neumorphism only works if raised objects share the ground's color, so never give a card a different fill to separate it. Use a shadow.
- **Surface raised (#E4EDF3):** One step lighter, only for things that float above the page: the profile card and dialogs.
- **Surface pressed (#C7D2DC):** The bottom of the pushed-in dial. It appears only while the timer is running.
- **On-surface (#18222B):** *Slate ink.* All main text and the countdown (12.6:1 on surface). It replaces the untinted `#171717` and `#050505`.
- **Secondary (#445D6E):** *Pencil.* The single muted text color for labels, pill text, placeholders, notes and meta lines (5.4:1 on surface). It replaces seven drifted greys: `#3b3a40`, `#435c6d`, `#425e70`, `#4b6575`, Tailwind's `#4b5563`, and the failing `#657d8e`, `#718594` and `#7b92a2`. There is deliberately no third, lighter grey. Every lighter option fails WCAG on this background, so show less important text by making it smaller, not paler.
- **Primary (#2D627F):** *Deep slate-blue.* The only color that means "you can act here": focus rings, text links and text buttons (5.2:1). It replaces `#5882a0`, `#557993`, `#527995` and `#82a8bf`, which all did the focus job at different strengths.
- **Tertiary (#76A8C3):** *The lit bead.* Fills only: completed goal beads, checked task boxes, progress bars. At 2:1 it is not a text color. If text sits on it, use on-surface (6.3:1).
- **Neutral (#C4D1DC):** Unlit beads, progress tracks and divider lines.
- **Error (#8E3B46):** A muted berry for failed saves and invalid imports (5.8:1). Nothing uses it yet: the profile status line mixes success and error messages, so it stays `secondary`. Use `error` only for a message that is always an error, and always pair it with written text.

Shadow colors aren't in the token list because the format has no shadow type. They're defined under Elevation & Depth and must not change.

## Typography

There are two families with two separate jobs.

- **Short Stack** does all the talking: titles, labels, buttons, notes and inputs. It only comes in one weight (400), so hierarchy comes from **size alone**. Never fake a bold.
- **Inter 500 with tabular figures** sets only the countdown. Tabular figures give every digit the same width, so `11:11` and `10:00` don't jitter as the seconds tick.

The scale is roughly **1.22×**: 11 → 13 → 16 → 20, with the 23px countdown above it. This replaces 27 sizes found in the CSS, from 6px to 23px.

- **headline (20px):** The "Pomodoro Timer" title, dialog headings and the tab-guard screen.
- **title (16px):** Card titles and the profile name.
- **body (13px):** Break messages, the quote, history entries and dialog text.
- **label (11px):** Pills, field labels and meta text. **11px is the floor.** The 6–10px sizes in the sidebar, the profile card and the calendar all move up to `label`.
- **input (16px):** Every text field. Below 16px, iOS Safari zooms the whole page when a field gets focus.

In the narrow sidebar, card headings use `body` (13px) instead of `title`, and body and detail text use `label`. The `--sidebar-*-size` variables point to those tokens rather than holding their own values.

## Layout

Centered and symmetric, because it's an object, not a document. The plate sits in the middle of the viewport, with the task field and pills stacked under it. Cards live in a sidebar drawer that can be shown or hidden, and on desktop they can be dragged anywhere.

Spacing is on a **4px base**: 4, 8, 12, 16, 24, 32. Existing 5, 6, 7, 9, 10 and 18px values round to the nearest step. Keep at least 24px between the plate and the controls under it. The soft shadows need room, or neighboring elements seem to melt together.

Touch targets are at least 44px on coarse pointers (phones and tablets). Small pills keep their visual size but get a larger invisible hit area.

## Elevation & Depth

Depth is the entire visual language, so it follows strict rules.

**Light source:** always the top-left. Every raised element has a slate shadow toward the bottom-right and a white highlight toward the top-left. Never flip it, and never add a shadow that falls straight down.

**Shadow color:** derived from the surface, roughly `rgba(165, 180, 194, …)` (slate #A5B4C2), never black. The highlight is white at 0.9–0.98 opacity.

There are five levels, all CSS custom properties. Any new element must use one of them.

| Level | Variable | Used for |
|---|---|---|
| Plate | `--outer-plate-shadow` | The timer plate only (`14px 16px 32px`) |
| Card | `--shadow-raised-sm` | Sidebar cards (`6px 8px 16px`) |
| Pill | `--shadow-pill` | Pills, small buttons, beads (`3px 3px 6px` / `-3px -3px 6px`) |
| Well | `--well-socket-shadow` | The socket around the dial, and inputs (inset) |
| Dial | `--dial-popped-shadow` → `--dial-pushed-shadow` | The dial's idle and running states |

Hover adds about 2px of shadow depth and lifts the element 1px. Pressed swaps to an inset shadow and scales to 0.96. Nothing ever moves more than 2px.

## Shapes

Radius depends on size: the bigger the object, the rounder its corners, the way a molded product looks.

- **plate (54px):** Only the timer plate. It's a squircle (a rounded square), not a circle.
- **xl (28px):** The sidebar panel, dialogs and the tab-guard screen. These are containers that hold other surfaces.
- **lg (20px):** Cards, the profile card, the history popup, the avatar and the sidebar toggle.
- **md (12px):** Inputs, selects and the calendar's selected-day highlight.
- **sm (8px):** Small inline buttons and avatar upload.
- **full:** Pills, beads, the dial, round icon buttons.

This replaces about 20 radius values: 4–8px became `sm`, 10–14px `md`, 16–22px `lg` and 26–36px `xl`.

There are no borders anywhere. Edges come from shadows only. The one exception is the 1px `neutral` divider between history rows. Focus is a solid 3px `primary` outline with a 3px offset, applied to every control by the global `:focus-visible` rule. Don't override it per component.

## Components

**Dial.** The heart of the app. When idle it's raised, with a radial gradient lit from the top-left (#F4F8FB → #DDE6EE → #C8D5E1). While running it's pressed into `surface-pressed` with an inset shadow, and a 6px `primary` dot under the digits pulses slowly (2s; it stays still with reduced motion). Depth alone is too subtle to read from across a desk, so the dot is the at-a-glance running signal. It uses `primary` rather than `tertiary` because a status mark needs 3:1 against the pressed surface (4.3:1). Its accessible label reads out the action, the phase and the time left. The pressed state uses a springy ease, `cubic-bezier(0.34, 1.56, 0.64, 1)` at 220ms. That is the only bouncy motion in the app.

**Pill buttons.** Mode ("Focus · 25m", "Short break · 5m"), Skip break, Reset, Mini and sound. Mode pills name the mode as well as the length, and use `aria-pressed` for the selected one. Raised small, `label` type, `secondary` text. The active pill (the current duration) switches to `on-surface` text and stays raised. Pressing one gives an inset shadow. Pills must have hover, pressed and disabled styles. A disabled pill keeps its shape but drops its shadow and uses `secondary` text at 60% opacity. Hover only applies to enabled pills.

**Text buttons** (`profile-text-button`): Change photo, Use default avatar, Audio credits. Text in `primary` with no fill and no shadow. Hover underlines it (this is the only underline in the system), pressing it turns it `on-surface`, and when disabled it is `secondary` at 60%. Undo restore is a pill, not a text button.

**Inputs.** Pressed into the surface like a well, with `md` radius, 16px `input` type and `secondary` placeholders. Error state: the message below in `error`, plus `aria-invalid`. Never use color alone.

**Cards.** Surface fill, `lg` radius (20px), the card shadow and 16px padding. Each card has a `title`, a drag grip (⠿) and content. The grip uses `secondary`.

**Goal beads.** 26px round beads, unlit in `neutral` and lit in `tertiary`. When a session finishes, a lit orb flies from the dial into the next bead. The color of the beads alone tells you how much of the day's goal is done.

**Dialogs.** `surface-raised`, `xl` radius, 24px padding, with tabs along the top. They use the native `<dialog>`, so Escape closes them and focus returns to the opening button.

**Start hint.** The handwritten note ("Push to start" / "Push to pause") points at the dial from the right with a drawn arrow. On screens 640px wide or less, it moves into the strip at the top of the plate, above the socket, and drops the arrow. It is never hidden on phones, because it's the only instruction a first-time visitor gets.

**Motion.** Use 150ms for hover, 220ms for presses and 300ms for layout moves, all `ease`, except the dial's spring. Reduced-motion settings remove the transforms, keep the color changes, and skip the bead orb animation.

## Do's and Don'ts

- **Do** make every raised thing the same color as the ground. A card that needs a different fill to stand out has the wrong shadow.
- **Don't** add a new color. If something needs emphasis, press it in, raise it, or make it larger. `primary` is the only "act here" signal, and a second accent would weaken it.
- **Do** keep the light source at the top-left on every new shadow, including in Mini, Help and Privacy.
- **Don't** set any text below 11px, and don't make text lighter than `secondary`. Both have been tried in this codebase and both failed contrast or readability.
- **Do** use `display-time` (Inter, tabular figures) for every live countdown, including in Mini. Short Stack digits change width as they tick.
- **Don't** set the countdown, or any running number, in Short Stack. Don't use Inter for labels or headings either.
- **Do** write every value as a CSS variable named after its token (`--color-secondary`, `--text-label`, `--radius-lg`, `--space-md`, `--font-hand`) instead of a literal. The only literal colors left in `style.css` are the dial and bead gradients, the photo-upload overlay, and the rgba values inside shadows. All are described above.
- **Don't** add borders around cards or controls. The only line in the system is the history divider.
- **Do** give every new control a hover, pressed, focus and disabled style before it ships.
- **Don't** use Tailwind's grey palette (`#4b5563`, `#6b7280`, `#e5e7eb`). Those greys are untinted and look like a mistake next to the slate surface.
