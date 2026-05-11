---
# sheet-logger-r5bh
title: Copy-to-clipboard for spreadsheet export
status: completed
type: feature
priority: normal
created_at: 2026-05-10T21:42:04Z
updated_at: 2026-05-11T02:29:27Z
parent: sheet-logger-cgju
---

Add a 'Copy' action that puts the week grid on the clipboard in a tab-separated format suitable for pasting into Google Sheets or Excel.

## Summary of Changes

Implemented `handleCopy` + `toTsv` in `src/pages/week-view.tsx`. `toTsv` outputs tab-separated decimal hours (2dp) with task rows and a TOTAL row, suitable for pasting into Google Sheets / Excel. Copy button shows a 2-second "Copied!" + CheckIcon confirmation, disabled when no entries.
