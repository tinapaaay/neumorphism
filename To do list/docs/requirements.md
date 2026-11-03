# To do list — requirements

Source reviewed and regression-tested 2026-10-29. See [app flow](app-flow.md) and [testing](../TESTING.md).

## Architecture and scope

A single static dashboard using HTML/CSS and one browser script. State is browser-local. Tasks have stable IDs; repeating schedules produce dated task occurrences. Clock/calendar/water boundaries follow the browser's local date, not a remote timezone.

| ID | Implemented requirement |
| --- | --- |
| TODO-01 | Add/edit a task name up to 80 characters; reject whitespace-only names. Tasks may have no due date, a due date, normal/high/low priority, and a pinned flag. |
| TODO-02 | Allow at most three pinned tasks, including on restored data. Preserve identity when editing. Reorder within a pinned/unpinned group by drag/drop, menu Move up/down, or Alt + Up/Down on options. Cross-group dragging is refused. |
| TODO-03 | Today shows incomplete undated/today/overdue work and relevant completed work; Upcoming shows incomplete future-dated tasks; Completed shows all completed tasks; All shows everything. A selected calendar date filters by exact due date and overrides the normal view. |
| TODO-04 | Complete/reopen a task, track its completion date, and optionally play feedback. Clear finished removes only completed tasks in the visible filter. Delete and clear support one in-memory Undo snapshot, merging restored tasks without removing newly added tasks or changing notes/settings. |
| TODO-05 | Support daily, weekly, and custom-weekday repetition. A custom schedule requires a selected weekday. Occurrences are deduplicated by series/date. Deleting an occurrence marks its date skipped; stopping repetition keeps the current occurrence and removes future uncompleted occurrences. |
| TODO-06 | Calendar uses real month lengths, Monday-first alignment, local Today, month navigation, and indicators for dates with tasks. Visiting a month can generate scheduled occurrences for that month; startup also generates the next 30 days. |
| TODO-07 | Daily progress derives from relevant tasks and retains completed cleared work in the day's ledger. Completion of all current daily work shows a short celebration. Up to 31 daily progress dates are retained; this is not a full long-term analytics product. |
| TODO-08 | Notes save as text on input independently of tasks. A task Undo must not overwrite notes or personal settings. |
| TODO-09 | Water changes in 250 mL steps: additions clamp to the configured goal, subtraction clamps at zero, and meter percentages cap at 100%. Lowering the goal retains previously recorded intake. The displayed amount resets for a new local day. Goal defaults to 2000 mL and accepts 250–10000 mL in 250 mL steps through the settings form. |
| TODO-10 | Personal settings persist name (up to 30 characters), greeting (up to 80), water goal, pop/chime/off sound, and 0–100 volume. Settings have Save/Cancel and a sound preview. Clock and remaining-day summary refresh each second and reconcile when the page becomes visible. |
| TODO-13 | Weekly review opens from the progress footer, uses Monday–Sunday local dates, and offers previous/current-week navigation. It shows distinct finished tasks, current pending carryover, seven saved checklist snapshots and seven water readings. Missing/future days are distinguished; water goals use each day’s recorded target. Water history retains up to 31 recorded dates and travels with portable backups. Older backups without history remain valid. |
| TODO-12 | Export a JSON backup of tasks, series, progress, notes, water and settings. Validate imported backups before showing a restore preview; explicit Restore replaces the destination data and keeps a recovery copy. Undo last restore survives reload. Invalid JSON or unsupported backups must not alter current data. |
| TODO-11 | Storage reads recover to normalized defaults when malformed/unavailable; failed writes explain that changes may only last in the current tab. Task controls keep functioning if audio is unavailable. |

## Storage contract

| Key | Payload |
| --- | --- |
| `todo-dashboard-tasks` | Version 2: normalized tasks, repeating series, and daily progress ledger |
| `todo-dashboard-tasks-backup-v1` | One-time preservation of a legacy array before migration |
| `todo-dashboard-settings` | Name, greeting, water goal, sound choice, and volume |
| `todo-dashboard-notes` | Raw notes text |
| `todo-dashboard-before-restore` | Recovery copy of the dashboard before the latest restore |
| `todo-dashboard-water-history` | Up to 31 recorded dates, each with water amount and the day’s target (null when historical target is unknown) |
| `todo-dashboard-water` | Local day key and amount in mL |

A task includes ID, text, done, due/completed date, priority, pin, series ID, and occurrence date. A series contains its start, mode, weekdays, priority, skipped dates, and active flag. The Undo snapshot, selected filter/date, open dialogs, and current calendar month are not persisted.

## Runtime and design constraints

Use localhost/HTTPS in a modern browser supporting localStorage, `crypto.randomUUID`, `structuredClone`, native `<dialog>`, Popover API, and Web Audio. There is no runtime dependency installation, build step, backend API, or service worker. The optional npm development dependencies run the saved regression suite. Styling is local; Short Stack loads from Google Fonts. The mobile layout changes at 580px. Native desktop drag/drop is supplemented by menu/keyboard reorder actions for other input methods.

## Known boundaries

- This is not a reliable alarm/reminder scheduler and does not create notifications while closed.
- Changing an occurrence's text/date does not rewrite all generated siblings. A changed repetition pattern updates its future schedule; verify this distinction when changing series behavior.
- Clear finished respects the visible filter; it does not mean globally clear every completed task.
- Task Undo is session-only and covers one removal/stop-repeating snapshot, not an unlimited history of all edits. Changing a repeat pattern invalidates a stale task Undo. If new work has filled all three pin slots, restored tasks are unpinned instead of exceeding the limit. Backup restore has its own persistent recovery copy.
- No multi-tab conflict resolution, automatic cloud backup, or hydration advice is implemented. The water goal is a user-entered tracker setting.
- Popover, touch, focus, reduced-motion, and contrast behavior need browser testing; HTML/JS review alone does not establish accessibility compliance.

Weekly counts use retained daily records and known task completion dates, counting a task once per week. Cleared task names cannot be reconstructed from old count-only records, so their number is shown separately. Current carryover is the work still open now, not a reconstruction of past pending lists. Water history begins when this version is used; legacy saved intake can be retained with an unknown target.
