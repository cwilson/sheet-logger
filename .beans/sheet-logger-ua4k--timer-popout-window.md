---
# sheet-logger-ua4k
title: Timer popout window
status: completed
type: feature
priority: normal
created_at: 2026-05-10T21:52:54Z
updated_at: 2026-05-11T02:58:27Z
parent: sheet-logger-40bc
---

Let the user detach the timer widget into a separate browser window (and re-dock it). The Document Picture-in-Picture API is worth evaluating for a compact always-on-top popout; fallback to a plain window.open() popup.

## Summary of Changes

Added to `src/components/timer-widget.tsx`:

- `declare global` type for `window.documentPictureInPicture`
- `cloneStylesTo(target)` copies `<style>` and `<link rel=stylesheet>` elements plus the root class (dark mode) into the pip/popup window's document
- `PopoutTimer` component — self-contained timer display with its own tick interval, renders into the pip window via `createPortal`; shows label, large elapsed clock, estimate annotation, pause/resume/stop/cancel, and a dock button
- `TimerWidget` gains `openPopout()`: tries Document PiP API first (always-on-top, compact), falls back to `window.open()` popup. When popped out, the nav shows a compact elapsed + dock button instead of the full controls. Pip close (user closes window) is detected via the `pagehide` event.
