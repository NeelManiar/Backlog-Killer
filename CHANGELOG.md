# BK v0.2 — Motivating Study Experience

Incremental upgrade of the existing Expo Router application; original chapter management, daily plan, coverage estimate, theme and offline storage remain.

- Three original subject backlog sculptures, real chapter-based strength meters, and optional subject-completion messages.
- Availability-limited daily missions with priority selection, completion, skipping and budget-checked chapter replacement.
- Original Vellum companion with three permanent forms earned through distinct chapter completions.
- Chapter-selectable, configurable work/break timer with persisted deadlines, pause/resume/end, elapsed-time logging and idempotent completion.
- Comeback history from migration onward, text-labeled graphs, backlog changes and separate study-minute totals.
- Additive v2 storage migration, optional chapter priority and platform storage adapters. No new runtime dependency.
- README, provenance report and automated calculation/browser regression tests.

## Validation in this workspace

Passed: `npm run typecheck`; `npm test` (10 individual tests); Android Metro export; web production export. Browser functional checks at 360px with reduced motion passed mission budget/adjust/skip/completion/reload, legacy localStorage migration with retained chapters and sessions, focus pause/reload/resume/completion/exactly-once logging with chapter status unchanged, comeback rendering without page or console errors, subject-completion celebration, and permanent companion evolution after three actual chapter completions and reopening/reload.

The initial web export failed resolving SQLite WASM; platform-specific adapters corrected this and the web export passed afterward. A React Native empty-string text warning found during browser checks was corrected and checks rerun with console-error detection.

No lint command/configuration exists. Native Android SQLite, OS background/termination behavior, and screen-reader acceptance require a device/emulator; no APK or device-validation claim is made. Focus deadlines reconcile when returning to Timer; no background alarm is installed. History before migration is intentionally unknown. No publication legal clearance is claimed; see `docs/ASSET_PROVENANCE.md`.
