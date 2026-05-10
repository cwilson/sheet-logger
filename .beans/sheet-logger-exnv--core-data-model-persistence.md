---
# sheet-logger-exnv
title: Core Data Model & Persistence
status: completed
type: epic
priority: normal
created_at: 2026-05-10T21:41:34Z
updated_at: 2026-05-10T22:45:38Z
---

Foundational data types (Client → Project → Phase → Task → TimeEntry), localStorage persistence layer, and app routing. All feature epics are blocked by this.

## Summary of Changes

Core data model and persistence were implemented in earlier commits:

- TypeScript interfaces for Client, Project, Phase, Task, TimeEntry, and TimeEntryTarget (discriminated union) in `src/types.ts`
- Zustand store with localStorage persistence in `src/store.ts`, including full CRUD for all entity types, timer controls (startTimer/stopTimer/cancelTimer), and derived selectors
- App routing with React Router, layout shell, and page scaffolds (Day, Week, Config) in `src/app.tsx` and `src/components/layout.tsx`
