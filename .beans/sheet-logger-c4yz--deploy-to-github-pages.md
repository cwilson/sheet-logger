---
# sheet-logger-c4yz
title: Deploy to GitHub Pages
status: completed
type: task
priority: normal
created_at: 2026-05-11T05:29:36Z
updated_at: 2026-05-11T05:34:54Z
---

Switch to HashRouter, set Vite base path for GitHub Pages, add GitHub Actions deploy workflow.

## Summary of Changes

- Switched from to in for GitHub Pages compatibility
- Added conditional path in ( when is set)
- Created — pnpm install → build → upload-pages-artifact → deploy-pages
- Fixed TypeScript config: excluded test files from ; added to
- Fixed INITIAL type annotation to avoid Zustand v5 setState type mismatch
