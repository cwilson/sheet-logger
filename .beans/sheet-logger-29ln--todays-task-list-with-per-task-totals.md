---
# sheet-logger-29ln
title: "Day View entry list: grouped by task"
status: completed
type: feature
priority: normal
created_at: 2026-05-10T21:41:56Z
updated_at: 2026-05-11T02:01:35Z
parent: sheet-logger-h8w1
---

Entries grouped by task, showing per-task total. Expand a task to see individual time blocks. Each task group has a shortcut to add another entry for that task. No chronological/timeline view for now.

## Summary of Changes

- Replaced flat entry list with collapsible `TaskGroupRow` components, one per unique task
- Each group header shows task path, total duration, and a hover-reveal + button to add another entry for that task
- Individual entry rows show time range, duration, optional notes (italic), and hover-reveal edit/delete
- Groups are expanded by default; clicking the caret collapses them
- Pre-populates the EntryDialog when adding from a group (task, client, project, phase pre-filled)
- Grouping logic handles all target levels (task/phase/project/client)
