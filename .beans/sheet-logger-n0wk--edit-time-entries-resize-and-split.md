---
# sheet-logger-n0wk
title: "Edit time entries: resize and split"
status: completed
type: feature
priority: normal
created_at: 2026-05-10T21:58:45Z
updated_at: 2026-05-11T02:37:47Z
parent: sheet-logger-h8w1
---

Any time entry — whether logged manually or created when a timer stops — can be edited after the fact. Supported operations: adjust start or end time (resize), edit notes, change the associated task, delete, and split one entry into two (e.g. to re-attribute part of the time to a different task). Splitting is the key operation that distinguishes this from basic CRUD.

## Summary of Changes

Added `SplitDialog` component to `src/pages/day-view.tsx`. Scissors button appears on hover for any completed entry (hidden for running entries). Dialog pre-fills the split point to the entry midpoint and pre-selects the same task for the second segment. On confirm: shrinks the original entry's endTime to the split point and creates a new entry from split point to original end. Validation ensures split time is strictly between start and end, and a task is selected for the second segment.
