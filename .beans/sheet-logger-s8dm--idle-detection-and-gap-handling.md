---
# sheet-logger-s8dm
title: Idle detection and gap handling
status: completed
type: feature
priority: low
created_at: 2026-05-10T21:42:01Z
updated_at: 2026-05-11T04:00:23Z
parent: sheet-logger-40bc
---

Use the browser Idle Detection API (or activity monitoring fallback) to detect when the machine is idle while the timer is running. When the user returns, prompt to discard or keep the idle gap from the time entry.

## Summary of Changes

- `src/store.ts`: added `timerIdleAt: number | null` to `TimerState`; new actions `setTimerIdle`, `clearTimerIdle`, `discardIdleAndStop`, `discardIdleAndContinue`; all timer-reset paths clear `timerIdleAt`.
- `src/components/timer-widget.tsx`: `IdleDetector` global type declaration; `IdlePromptDialog` with Keep all / Discard idle time / Discard & continue (option C); idle detection `useEffect` uses `IdleDetector` (Chrome, 120s threshold) with gap-based fallback (30s interval, >3min gap = machine was sleeping); named handler stored in `refs` object for proper cleanup. Lazy `useState` initializers restore prompt on page refresh if `timerIdleAt` was set.
