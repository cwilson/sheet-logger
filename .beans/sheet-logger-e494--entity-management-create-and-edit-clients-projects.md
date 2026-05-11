---
# sheet-logger-e494
title: "Entity management: create and edit clients, projects, phases, and tasks"
status: completed
type: feature
priority: normal
created_at: 2026-05-10T21:41:55Z
updated_at: 2026-05-10T23:33:54Z
parent: sheet-logger-rfor
---

UI for creating and editing the data hierarchy: add a new client, add projects under a client, add phases under a project, add tasks under a phase. Inline or modal forms, minimal friction.

The tree is assembled from shadcn Collapsible components — there is no native tree component. Each level handles its own expand/collapse, indent, and [+ Add] / [···] actions.

## Summary of Changes

Replaced the collapsible tree with a flat grid table (Client | Code | Project | Phase | Task):

- Each row represents a task with its full context displayed across fixed-width columns
- Hover-reveal trash button deletes individual tasks
- Single always-present empty row at the bottom serves as the add mechanism:
    - Client and Phase: combobox with create-on-type ("Create 'X'" option appears when no match)
    - Project: combobox filtered by selected client + [+] button that opens a Name + Code popover
    - Task: plain input, commits on Enter, resets the row after saving
- Project.code added to the data model (optional field on Project type and addProject action)
- Fixed shadcn path resolution by adding compilerOptions.paths to root tsconfig.json
- Fixed Zustand infinite re-render loop by wrapping array selectors with useShallow
