---
# sheet-logger-v1hy
title: "Day View analytics: actual vs target hours"
status: completed
type: feature
priority: normal
created_at: 2026-05-10T21:41:56Z
updated_at: 2026-05-11T01:56:02Z
parent: sheet-logger-h8w1
---

Show actual hours logged today vs. the daily target (hardcoded 8h). Display total logged, remaining, and a progress bar. Updates reactively as entries are added or edited. Holidays and partial days are out of scope for now.

## Summary of Changes

- Added `DayAnalytics` component to `day-view.tsx`: slim progress bar between the header and entry list
- Totals only completed entries (endTime \!== null); running timer entries excluded
- Bar fills with primary color up to 8h, switches to emerald when done
- Text shows "Xh Ym / 8h · Xh Ym left" until target, then "Xh Ym logged" in green
