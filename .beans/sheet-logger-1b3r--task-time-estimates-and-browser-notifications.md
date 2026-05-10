---
# sheet-logger-1b3r
title: Task time estimates and browser notifications
status: todo
type: feature
priority: normal
created_at: 2026-05-10T21:42:01Z
updated_at: 2026-05-10T22:02:51Z
parent: sheet-logger-40bc
---

Time estimate (in hours/minutes) is entered optionally when starting the timer. When the running timer hits the estimate, fire a browser Notification and play a sound via the Web Audio API (the Notification API itself has no custom sound support — OS default only). Optionally notify at a pre-threshold too (e.g. 80%). Same notification mechanism is reused for long-idle alerts.
