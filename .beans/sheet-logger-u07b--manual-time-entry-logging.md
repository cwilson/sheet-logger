---
# sheet-logger-u07b
title: Manual time entry logging
status: completed
type: feature
priority: normal
created_at: 2026-05-10T21:41:55Z
updated_at: 2026-05-11T01:25:10Z
parent: sheet-logger-h8w1
---

Allow the user to log a time entry against a task: pick a task via a searchable Combobox (displays full Client › Project › Phase › Task path), enter start/end time (or duration), add optional notes, and save. Entries appear in the day's log. Support editing and deleting entries.

## Summary of Changes

- Added `src/lib/time.ts`: shared utilities (todayStr, msToDateStr, msToTimeStr, dateTimeToMs, formatDuration, formatDateLong, addDays)
- Added `src/components/task-picker.tsx`: searchable combobox showing full Client › Project › Phase › Task path, reusable for Timer
- Rewrote `src/pages/day-view.tsx`: day navigation (prev/next/Today), entry list with edit/delete, EntryDialog with task picker + date/time/notes form, duration preview, inline validation
- Extended `src/store.ts`: updateTimeEntry now accepts target in patch
