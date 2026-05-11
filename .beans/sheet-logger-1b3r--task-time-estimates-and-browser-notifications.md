---
# sheet-logger-1b3r
title: Task time estimates and browser notifications
status: completed
type: feature
priority: normal
created_at: 2026-05-10T21:42:01Z
updated_at: 2026-05-11T02:46:55Z
parent: sheet-logger-40bc
---

Time estimate (in hours/minutes) is entered optionally when starting the timer. When the running timer hits the estimate, fire a browser Notification and play a sound via the Web Audio API (the Notification API itself has no custom sound support — OS default only). Optionally notify at a pre-threshold too (e.g. 80%). Same notification mechanism is reused for long-idle alerts.

## Summary of Changes

- `src/lib/notify.ts` — shared utilities: `requestNotificationPermission()`, `fireNotification(title, body)`, `playBeep(freq, dur)` via Web Audio API.
- `src/store.ts` — added `timerEstimateMs`, `timerNotifiedThreshold`, `timerNotifiedEstimate` to `TimerState`; `startTimer` now accepts optional `estimateMs`; added `markThresholdNotified()` and `markEstimateNotified()` actions.
- `src/components/timer-widget.tsx` — estimate h/m inputs in StartDialog; `useEffect` fires threshold (80%) and full-estimate notifications with beep; elapsed display turns amber and shows `/ Xh Ym` budget annotation.
