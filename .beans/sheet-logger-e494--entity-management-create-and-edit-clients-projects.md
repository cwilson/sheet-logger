---
# sheet-logger-e494
title: "Entity management: create and edit clients, projects, phases, and tasks"
status: in-progress
type: feature
priority: normal
created_at: 2026-05-10T21:41:55Z
updated_at: 2026-05-10T22:46:06Z
parent: sheet-logger-rfor
---

UI for creating and editing the data hierarchy: add a new client, add projects under a client, add phases under a project, add tasks under a phase. Inline or modal forms, minimal friction.

The tree is assembled from shadcn Collapsible components — there is no native tree component. Each level handles its own expand/collapse, indent, and [+ Add] / [···] actions.
