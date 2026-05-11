---
# sheet-logger-iwbg
title: "Week grid: hours per task per day"
status: completed
type: feature
priority: normal
created_at: 2026-05-10T21:42:04Z
updated_at: 2026-05-11T02:29:27Z
parent: sheet-logger-cgju
---

Render a table of tasks (rows) × weekdays (columns) with the total hours logged per cell. Show row and column totals. Tasks with no entries in the week are hidden by default.

## Summary of Changes

Implemented the full week grid in `src/pages/week-view.tsx`. The `computeGrid` function groups completed time entries by task/phase/project key and sums duration per day-index (0=Monday). The table renders with fixed-width day columns, truncated task labels with title tooltip, `formatDuration` per cell, and "—" for zero cells.
