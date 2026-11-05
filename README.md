# Backlog Killer · v0.3

Android-first, offline academic backlog manager built with Expo SDK 58, React Native, TypeScript, Expo Router, and Expo SQLite.

## v0.3: accounts and personalized curriculum foundation

This incremental upgrade preserves BK v0.2 and its existing offline data. It adds email-code account screens, secure native session storage, editable six-step academic onboarding, separated School/entrance/Saved sections, account-scoped offline caches, explicit anonymous import, and revision-checked Supabase sync with visible conflict choices.

**Current release gates:** Supabase connection was deferred by the user. Real email delivery, hosted authentication/sync/deletion, and Android device behavior have not been verified. Official curriculum sites are denied by the current proxy; no school or entrance syllabus is claimed verified. Class 12 CBSE PCM 2026–27 currently shows pending-verification notices rather than guessed units. Offline custom chapters and all v0.2 features remain usable.

- [Supabase setup, security and privacy review](docs/SUPABASE_SETUP.md)
- [Curriculum evidence and outstanding verification](docs/CURRICULUM_STATUS.md)
- SQL schema/RLS/CAS migration: `supabase/migrations/202611050001_accounts.sql`
- [Change summary and test evidence](CHANGELOG.md)

No real credentials are included. Configure only the public project URL and publishable key as documented; never bundle a service-role key. New account data starts empty and remains separate from anonymous data until explicit import. Changing academic settings preserves all existing chapters in Saved chapters.

## Run

Use Node.js 22.18+ (Node 24 is also supported) and npm.

```sh
npm ci
npm start
```

Scan the QR code in a compatible Expo Go app on Android. Alternatively, start an Android emulator and run `npm run android`. For a browser preview, run `npm run web`.

```sh
npm run typecheck
npm test
npm run export:android
```

The Android export checks Metro bundling; it does not produce an APK. No Android emulator or device is included in this workspace.

## Screens and references

All four reference images were inspected from `https://raw.githubusercontent.com/NeelManiar/portfolio/main/public/images/BK1.png` (and BK2–BK4). They are not used as UI backgrounds.

- BK1 → Home: greeting, focus chapter, informational Pro panel, subject cards, add button.
- BK2 → Timer: work/break selector, countdown, reset/play/pause/skip, subject selection, recent sessions.
- BK3 → Progress: completion metrics, subject bars, activity heatmap; opens coverage estimate.
- BK4 → Will I Pass?: coverage summary, risk badges, chapter suggestions, dismiss button.
- Plan, Settings, chapter details, and add form extend the same visual language; no source screenshots exist for these screens.

Near-black surfaces, indigo cards, purple actions, and subject colors mirror the references. Data is limited to Mathematics, Physics, and Chemistry. Unsupported AI and payment controls are replaced with informational copy. Coverage is a transparent local calculation, not a prediction of exam results.

## BK v0.2: Motivating Study Experience

- **Subject backlogs:** Torque Cairn (Physics), Mottle Stack (Chemistry), and Lattice Fold (Mathematics) reflect the actual count of unfinished chapters. Finishing a subject offers a quiet, dismissible celebration.
- **Daily missions:** Enter today's available minutes on Home and request up to three whole-chapter suggestions. Selection prefers high priority, planned, and active chapters, without exceeding availability. Change priority on the subject screen. Complete, skip, or replace individual missions; replacements must fit the budget. Zero availability produces no missions. A new day starts without penalties; request a new plan when ready. Replacing today's suggestions explicitly replaces that day's mission list.
- **Vellum:** A folded-paper study companion grows from Fold to Fan after three distinct chapter completions and to Canopy after ten. Only completions observed since v0.2 count. Reopening a chapter never removes evolution or grants repeat credit.
- **Focus:** Choose a chapter and a 1–180 minute work or break session. Pause, resume, or end early. Running deadlines and paused remaining time survive restarts. Returning to the Timer reconciles an expired deadline and saves one session. End records actual elapsed work; breaks do not add study minutes. Timer completion never changes chapter status. No background alarm/notification is promised.
- **Your comeback story:** Progress shows recorded backlog snapshots, current chapter totals, unique completions and separately recorded focus minutes. Added/reopened chapters can increase backlog. Old completion dates are unknown; history begins at migration. Known `demo-` sessions remain stored but are excluded from the new study-minute total.
- **Accessibility:** Existing dark surfaces and purple actions are retained. Character drawings have descriptive labels; charts include numeric text. Celebrations are static and optional in Settings, respect reduced motion, and require no timed interaction.

## Architecture and storage

Expo Router, shared store, existing plan/add/prediction screens, and serialized save queue remain. Native uses the same `bk.db` / `app_state` row; web uses the same `bk-data` localStorage key. Platform-specific adapters keep SQLite's WASM worker out of web bundles.

An additive `motivation.version = 2` object contains availability, dated missions, persisted focus state, earned chapter IDs, permanent evolution stage, snapshots and celebration preference. Chapter priority is optional (normal when absent). Migration preserves all previous chapters, sessions and unknown top-level fields, records a truthful baseline, and persists it before showing the app. Invalid/unsupported data is not replaced with seed data. Failed writes retain the last saved state and show an error. New installs retain the existing demonstration chapter dataset but no longer seed fictitious focus sessions. Existing demo sessions are preserved.

Pure calculations live in `src/data/motivation.ts`; reusable characters, missions, companion, story and celebrations live in `src/components/motivation.tsx`. Timer orchestration stays in its existing route. v0.3 adds only Supabase JS and Expo SecureStore; the v0.2 gamification itself needs no additional runtime packages.

## Validation

```sh
npm ci
npm run typecheck
npm test
EXPO_OFFLINE=1 EXPO_NO_TELEMETRY=1 npm run export:android
EXPO_OFFLINE=1 EXPO_NO_TELEMETRY=1 npx expo export --platform web
EXPO_OFFLINE=1 EXPO_NO_TELEMETRY=1 npm run web -- --port 8081
```

Nineteen unit tests cover accounts, provider OTP doubles, profile validation, curriculum filtering, storage isolation and conflicts, plus existing metrics, mission budgets/priorities, migration, permanent progression, boss strength, focus timestamp recovery and history calculations. Use Node 22.18+ or 24. There is no lint script or lint configuration in this repository.

Optional functional test: with the web server running, Python Playwright and Chromium installed, run `python tests/browser-smoke.py` (override `BK_TEST_URL` if needed). It uses isolated browser contexts and synthetic data, covering budget/adjust/skip/complete/reload, focus pause/reload/resume/expiry/exactly-once logging, reduced-motion rendering at 360px, and v1 migration retention. `tests/profile-smoke.py` additionally covers PCMB onboarding, optional subjects, multiple goals, custom chapters and preservation. `tests/auth-smoke.py` uses safe provider doubles for account switching and cloud conflicts; see setup instructions. The regression test also verifies subject completion and permanent companion evolution after reopening/reload, and saves `artifacts/v03-progress.png` and `artifacts/v03-home.png`.

Current checks and remaining platform limitations are recorded in [CHANGELOG.md](CHANGELOG.md). Android Metro export is bundling validation, not an APK or a device test. Native SQLite and OS background/termination behavior still require Android device/emulator acceptance testing.

See [asset provenance and originality](docs/ASSET_PROVENANCE.md) for new characters and publication review requirements.
