---
# sheet-logger-ueic
title: Implement Zustand store with localStorage persistence
status: todo
type: task
priority: normal
created_at: 2026-05-10T21:41:47Z
updated_at: 2026-05-10T21:58:40Z
parent: sheet-logger-exnv
---

Set up a Zustand store for all app data (clients, projects, phases, tasks, timeEntries, timer state). Use the persist middleware to sync to localStorage. This also covers timer state — a running timer is just a slice of the same store, so no separate persistence mechanism is needed.
