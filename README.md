# Backlog Killer

Android-first, offline academic backlog manager built with Expo SDK 58, React Native, TypeScript, Expo Router, and Expo SQLite.

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

## Try it

Open a subject, start a chapter, add it to today’s plan, and mark it complete. Progress updates immediately after saving. Add a chapter using Home’s plus button. Start/pause/reset a focus session; a fully elapsed work interval records 25 minutes. Skipping an interval does not record work. Subject changes are disabled while the timer runs. Countdown uses a deadline to account for background time while the process remains alive; app termination resets the timer.

## Structure

```text
app/                  Expo Router routes and five-tab navigation
  (tabs)/             Home, Plan, Timer, Progress, Settings
  subject/[id].tsx    Chapter status and planning
  add.tsx             Validated chapter form
  prediction.tsx      Local coverage estimate
src/components/ui.tsx Reusable native controls and theme
src/data/             Seed chapters and progress calculations
src/state/store.tsx   Serialized persistence and shared state
```

SQLite stores the full small dataset in one parameterized state row on Android/iOS. Browser preview uses localStorage, avoiding SQLite WASM hosting requirements. First launch seeds realistic Class 12 topics and two explicitly demonstrated sessions. Counts and streaks derive from stored data. Failed writes show an error and do not change visible data. No credentials, authentication, backend, payments, or AI services are included.

Accessibility includes labeled icon buttons, native text scaling, scrollable layouts, 44+ point targets, semantic headings, and progress values. Layouts use a centered maximum content width on large displays.

## Workspace validation

In restricted environments where Expo’s remote metadata endpoint is unavailable, `EXPO_OFFLINE=1 EXPO_NO_TELEMETRY=1 npx expo install --check` uses the SDK’s bundled dependency list. Normal local development does not require these flags.

Validation passed in this workspace: TypeScript, three metric tests, SDK bundled dependency version check, Android Metro export, and Expo web startup. Chromium checks at phone width covered adding chapters, plan persistence after reload, chapter completion persistence, timer start/pause/reset/break, completed-session persistence with an accelerated clock, and coverage-screen navigation. No browser runtime errors were reported. Android device installation and native SQLite runtime still require a physical device or emulator check. Preview captures are in `artifacts/`.
