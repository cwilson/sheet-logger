# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**IMPORTANT**: before you do anything else, run the `beans prime` command and heed its output.

## Collaboration

- Address the user as **Captain W**.
- This is a collaboration — ask Captain W questions freely. He has a lot of experience and is happy to help.
- **No shortcuts.** Respect the typechecker and linter. When there's an error, find the root cause and fix it properly. Only use workarounds with Captain W's explicit approval — asking is always fine.
- Commit changes corresponding to completed tasks, but **do not push branches**.
- When closing a bean (marking it completed or scrapped), **include the `.beans/` file in the same commit as the related code changes** — never in a separate follow-up commit.

## Commands

```bash
pnpm dev        # Start Vite dev server
pnpm build      # Type-check (tsc -b) then bundle
pnpm preview    # Preview production build
pnpm lint       # Run ESLint
pnpm test       # Run Vitest (watch mode)
pnpm autoformat # Prettier --write to fix formatting
pnpm typecheck  # Run Type-check only
pnpm dlx shadcn@latest add [component]  # add shadcn components
```

Use `pnpm` — the lockfile is committed and the project is pnpm-only.

To add shadcn components: `npx shadcn@latest add <component>`

## Architecture

Sheet Logger is a **client-side-only** React SPA for consultants to log billable time. No backend, no API calls — all data lives in the browser (localStorage). The app is a fresh scaffold; the core data models, routing, persistence, and views are not yet implemented.

**Planned data hierarchy:** Client → Project → Phase → Task → TimeEntry

**Planned views:**

- **Day View** — tasks worked today, progress toward 8-hour daily goal
- **Week View** — table of hours per task per day, progress toward 40-hour goal, copy-friendly for spreadsheet export
- **Timer** — start/stop timer on a task with optional time estimate and alert

## Key Design Decisions

- **Tenets:** local-only (no data leaves the browser), leverage browser APIs, keep it lightweight
- **Path alias:** `@/` maps to `src/` (configured in Vite and TypeScript)
- **Tailwind v4** with CSS custom properties; dark mode via `dark` custom variant in `src/index.css`
- **shadcn components** use the "radix-lyra" style with "mist" color palette and Phosphor icons — stay consistent when adding components
- **CVA** (`class-variance-authority`) is the pattern for component variants (see `src/components/ui/button.tsx`)
- **`cn()`** in `src/lib/utils.ts` merges Tailwind classes via clsx + tailwind-merge; use it everywhere class names are composed
- **File naming:** all source files use lowercase kebab-case (e.g. `day-view.tsx`, `layout.tsx`); component exports remain PascalCase

## Code Quality

A pre-commit hook (Husky + lint-staged) automatically runs:

- `eslint --fix` on staged `*.ts` / `*.tsx` files
- `prettier --write` on staged `*.{ts,tsx,css,md}` files

Prettier config: 4-space indents, double quotes, semicolons.

**MSW** is installed for mocking in tests. Vitest globals are enabled — no need to import `describe`, `it`, `expect`.
