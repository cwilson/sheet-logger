---
# sheet-logger-x2rf
title: Unit tests for business logic
status: completed
type: task
priority: normal
created_at: 2026-05-11T04:05:46Z
updated_at: 2026-05-11T04:09:41Z
---

Cover the three testable modules with Vitest:

- src/lib/time.ts — all pure time/date utilities
- src/lib/entries.ts — buildEntryLabel edge cases
- src/store.ts — timer pause math, stopTimer effective duration, discardIdleAndContinue/Stop, cascade deletes

Use useStore.setState() to reset between store tests; clear localStorage in beforeEach to prevent persist middleware leakage.

## Summary of Changes

Added three test files (50 tests, all passing):

- `src/lib/time.test.ts` — covers all 10 pure time utilities including edge cases (midnight, month/year boundaries, negative elapsed clamp, weekStart Sunday→Monday)
- `src/lib/entries.test.ts` — covers buildEntryLabel for all target levels, missing lookups, and mixed missing/present segments
- `src/store.test.ts` — covers CRUD cascade deletes, full timer lifecycle (start/pause/resume/stop/cancel), effective duration excluding pause time, discardIdleAndStop/Continue, and notification flag actions

Key fix discovered: useStore.setState(state, true) (replace mode) wipes actions; must use merge mode (no second arg).
