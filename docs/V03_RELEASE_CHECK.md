# v0.3 release check — 11 November 2026

Status: **not ready for public release**. This check builds on development
commit `f49754726da2b5ccfebb4c21e88ca67a275cdd0e` on
`codex/bk-first-implementation`; existing v0.3 work is preserved.

## Targeted fix

A queued sync previously used the shared auth client. If identity changed while
an earlier read or local save was pending, the next request could use another
account's JWT and upload the old account's document into the new account's row.
RLS alone cannot distinguish this incorrectly attributed document.

Sync now receives the initiating session and uses an isolated, nonpersisting
client with a pinned access token for reads and writes. Expired/revoked tokens
fail instead of falling back to the current account. Local cache namespaces,
anonymous import and conflict backups are unchanged. The SDK-backed unit
regression delays a read, changes the simulated active identity, and checks
that both read and subsequent write use only the initiating identity's JWT.
No production token or network service is used by that test.

## Current evidence

| Check | Result |
| --- | --- |
| TypeScript (`npm run typecheck`) | PASS |
| Unit suite (`npm test`) | PASS — 20 tests |
| Android Metro export (`EXPO_OFFLINE=1 EXPO_NO_TELEMETRY=1 npx expo export --platform android`) | PASS — bundle only |
| Web Metro export (same command, `--platform web`) | PASS |
| Migration, A/B/anonymous cache isolation, import collision/idempotence, earned progress retention | PASS — unit tests |
| Delayed sync identity isolation | PASS — real SDK, synthetic HTTP responses |
| `browser-smoke.py`, `profile-smoke.py`, `auth-smoke.py` | FAIL/BLOCKED — Chromium aborts before app execution: `socket() failed: Operation not permitted (1)` |
| Hosted authentication, SMTP, RLS, RPC persistence/deletion | FAIL/BLOCKED — no connected project or credentials available |
| SQL ownership suite in this session | FAIL/BLOCKED — no PostgreSQL client/server available |
| Native device acceptance | FAIL/BLOCKED — not exercised |

Both `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are absent from the process environment;
there are no repository `.env*` files in this checkout. Values were not printed.
No Supabase connector is exposed in this session. Synthetic fixture settings
were used only for the attempted separate auth smoke process. They do not
establish a connected project. Metro startup also fails while enumerating
network interfaces (`uv_interface_addresses`, error 1), including localhost mode.

## Remaining release blockers

- Supply the public project configuration securely, apply/review the migration,
  then verify real email OTP, expiry/resend/abuse settings, refresh, logout,
  two-account read/write isolation, CAS conflicts and recent-sign-in deletion.
  Hosted settings and migration application were not inspected or changed.
- Re-run all three browser smoke suites in an environment permitting Chromium
  sockets and Metro startup. Earlier changelog evidence is historical, not a
  successful rerun here.
- Complete Android SecureStore/SQLite, session/account transitions and
  background/termination acceptance tests on an actual device or emulator.
- Existing release gates in `SUPABASE_SETUP.md` remain: SMTP/provider abuse
  configuration, CAPTCHA UI if required by provider policy, web CSP/token
  review, and privacy/consent/retention review.
- Onboarding is implemented and unit-tested, but official curriculum data is
  still unverified (`CURRICULUM_STATUS.md`). Pending notices/custom chapters
  remain; no syllabus data was invented or added.

The migration statically enables/forces owner-read RLS, denies direct client
DML, and scopes revision-checked writes to `auth.uid()`. This inspection and the
client tests do **not** prove isolation on any hosted database.
