# BK v0.3 — Accounts and personalized curriculum foundation

Incremental upgrade preserving v0.2 features and stored student data.

- Supabase email OTP registration/login/verification/resend/logout and recent-sign-in account deletion screens. OTP verification is provider-only; errors do not reveal account existence in the UI.
- Expo SecureStore native session adapter, tab-scoped web sessions, identity-keyed store remounts and per-account cache namespaces.
- Editable grade/board/stream/actual-subject/optional-goal/year onboarding, with current academic-year defaults.
- Strict school versus entrance catalog filters, canonical shared progress keys, explicit custom chapter labels, and preserved legacy chapters under Saved chapters. Scoped history and progress views follow selected content.
- Owner-only RLS reads, RPC-only revision-checked cloud writes, cascading own-account deletion with a recent-sign-in check, explicit anonymous import and conflict backup/resolution.
- Supabase setup/config/email template, curriculum status report and privacy/release gates.

Validation: TypeScript and 19 unit tests passed. Browser onboarding/custom-topic/v0.2 regression checks passed. Safe-provider-double browser checks passed registration/login, account switching, explicit import, session reload, cloud push and conflict resolution. Real PostgreSQL 17 tests passed owner isolation, blocked anonymous/direct writes, stale CAS revisions, recent-sign-in deletion and own-data cascade. These SQL tests use a synthetic Auth schema, not hosted Supabase. Final clean Android and web Metro exports passed. No lint script is configured.

Remaining release blockers: connect and validate hosted Supabase and SMTP; review/apply provider expiry/rate/abuse settings; add accessible CAPTCHA challenge UI if required by policy; review web token/CSP security; verify native SecureStore/SQLite/background/device behavior; complete privacy/consent/retention review; fetch and independently verify official curricula. **No official syllabus is currently verified.** The required CBSE Class 12 PCM 2026–27 catalog is pending because official-source access is denied, not replaced with generic topics. See `docs/CURRICULUM_STATUS.md` and `docs/SUPABASE_SETUP.md`.

---

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
