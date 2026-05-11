---
# sheet-logger-01na
title: "Week View analytics: actual vs target hours"
status: completed
type: feature
priority: normal
created_at: 2026-05-10T21:42:04Z
updated_at: 2026-05-11T02:29:27Z
parent: sheet-logger-cgju
---

Show actual hours logged this week vs. the weekly target (hardcoded 40h). Break it down by day so under/over per day is visible alongside the week total. Holidays and partial weeks are out of scope for now.

## Summary of Changes

Implemented `WeekAnalytics` bar in `src/pages/week-view.tsx`: 1.5px progress bar tracking hours toward 40h weekly target, turns emerald when complete. Column totals in tfoot also turn emerald when ≥ 8h.
