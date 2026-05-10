---
# sheet-logger-acyq
title: Define TypeScript data models
status: todo
type: task
priority: normal
created_at: 2026-05-10T21:41:47Z
updated_at: 2026-05-10T22:17:06Z
parent: sheet-logger-exnv
---

Define TypeScript interfaces/types for the data hierarchy and export from a central types file.

**Required levels:** Client → Project
**Optional levels:** Phase → Task

A TimeEntry can be attached at any level — Client, Project, Phase, or Task. The entity reference on TimeEntry is therefore a discriminated union or a nullable chain (taskId | phaseId | projectId | clientId), resolved to the most specific level provided.

**Architectural note:** TimeEntry must store startTime and endTime as timestamps (not just a duration). This keeps the door open for visual timeline editing (resize, split) without a schema migration later.

TimeEntry also needs an optional notes: string field — free-text annotation on what was done during that block. Notes are entered/edited at the entry level, not the task level.
