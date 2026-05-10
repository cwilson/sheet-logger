---
# sheet-logger-atyd
title: Set up app routing and page scaffolds
status: completed
type: task
priority: normal
created_at: 2026-05-10T21:41:47Z
updated_at: 2026-05-10T22:39:13Z
parent: sheet-logger-exnv
---

Configure React Router with routes for Day View, Week View, and Config. Add minimal page scaffolds and a nav/layout component. The Timer is a floating widget in the layout shell, not a route — route it only if the popout requires its own URL.

## Summary of Changes

Installed react-router-dom 7. Created page scaffolds (day-view.tsx, week-view.tsx, config.tsx) and a layout shell (layout.tsx) with a top nav bar using NavLink for active-state highlighting and Phosphor icons. Routes: / → DayView, /week → WeekView, /config → Config, \* → redirect to /. Timer widget will render in a fixed-position #timer-widget-root div in the layout. Renamed all new files to kebab-case per Captain W's convention; documented it in CLAUDE.md.
