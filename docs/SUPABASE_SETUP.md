# Supabase setup and release gates

This is a local development foundation. No Supabase project is configured or deployed by this change. Never commit credentials. The latest release check could not access a configured project or credentials; see `V03_RELEASE_CHECK.md` for current evidence and blockers.

## Connect a project

1. Create a Supabase project in a reviewed hosting region. Apply `supabase/migrations/202611050001_accounts.sql` through the SQL editor or reviewed CLI migration workflow. Do not apply `supabase/tests/bootstrap-local.sql` to a real project: it is a disposable PostgreSQL fixture only.
2. Configure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in secure environment settings. These are the public project URL and publishable (or legacy anon) client key, never the service-role key. Expo bundles EXPO_PUBLIC values. Allow the exact project's hostname in the cloud network policy; no broad Supabase wildcard is needed. Restart Metro after changing configuration.
3. Use custom SMTP for production delivery, configured only in Supabase dashboard/secure server settings. Set email confirmation and email OTP sign-in templates to `supabase/templates/code.html` using `{{ .Token }}`; use a 10-minute expiry, 6-digit codes, and at least a 60-second resend interval. Enable email confirmations. No OTP generation or validation runs in BK.
4. Review/apply the rate limits from `supabase/config.toml` to the hosted project. The file is a local/deployment template, not proof hosted settings were applied. Tune per-IP sign-in/verification and SMTP delivery limits to expected load. Review provider CAPTCHA/bot protection before release; the auth port accepts a provider captcha token, but an accessible native/web CAPTCHA challenge is **not implemented**. Enabling mandatory CAPTCHA without adding that UI will prevent sign-in.
5. Add production site/redirect settings appropriate to the deployment. BK currently uses email-code entry and disables automatic URL session detection. Do not enable unreviewed redirects.
6. Test signup, confirmation, existing-user login, wrong/expired codes, resend throttling, SMTP delivery/bounces, session refresh and logout on actual Android and web. Request responses use generic wording and never surface account-existence errors; Supabase HTTP behavior/timing may still permit enumeration and needs provider review. UI cooldown is convenience, not a security boundary.
7. Run the ownership SQL tests in an isolated Supabase staging project and review privileges, cascade effects and recent-sign-in deletion. The current tests passed in vanilla PostgreSQL with synthetic `auth.users`/`auth.uid()` fixtures, not the full hosted GoTrue stack.

## Data and sessions

- The anonymous v0.2 SQLite row and web `bk-data` key are retained. New schema 3 adds academic profiles, history scopes and sync revision metadata. Existing chapters are marked legacy/unverified, with their fields/statuses intact. Existing earned Vellum stage is never reset.
- Native sessions use Expo SecureStore, chunked to accommodate large serialized sessions; there is no plaintext fallback. Device Keychain/Keystore, backup/restore and reinstall behavior need Android acceptance review.
- Web tokens use tab-scoped sessionStorage, allowing reload but requiring sign-in after closing the tab. JavaScript-accessible storage is vulnerable to XSS; it is not HttpOnly. Deploy a restrictive CSP, audit web dependencies and evaluate a BFF/HttpOnly architecture before a public web release.
- Study caches use per-user UUID namespaces, separate from anonymous storage. The store remounts on identity change and does not expose the previous identity while restoring. Local study caches rely on OS/browser app isolation and are not application-encrypted.
- Registration alone never uploads anonymous data. Account screen explicitly copies it, rejects same-ID conflicts, preserves the anonymous original and existing account records, and requires a separate Sync now action.
- `study_accounts` stores one versioned JSON document per Auth user. RLS permits only owning-user reads. Direct client inserts/updates/deletes are denied; `save_study` derives the owner from `auth.uid()` and accepts only the expected revision. Stale writes raise `40001`.
- Sync is explicit. Clean devices may pull a newer cloud version. Divergent revisions require a user choice and show record counts. The device document is backed up before either resolution under `<scope>-conflict-<timestamp>` (SQLite `app_scopes` / web `bk-data:<scope>-conflict-<timestamp>`). An additional cloud change requires another review. Backup restoration is currently a support/manual local-storage operation; no backup-browser UI is supplied.
- No realtime channels, public profiles, analytics or advertising IDs are added. The cloud SQL table is not a public syllabus catalog.

## Deletion and privacy

`delete_my_account()` requires the caller to have signed in within ten minutes and its signed JWT to carry a recent OTP AMR proof, deletes only that Auth identity, and cascades its study row. The account screen then erases that account's current-device cache and conflict backups and logs out. A deleted identity cannot recreate study rows with a remaining JWT. Other offline devices, OS/provider backups and preserved anonymous copies require separate cleanup; remote device wiping and backup-retention automation are not implemented.

Before public release, establish operator/contact details, guardian/age-appropriate consent requirements, jurisdiction-specific privacy review, hosting/SMTP agreements, retention and deletion schedules (including Supabase backups), data access/export handling and security/abuse incident processes. Do not claim legal compliance. Precise age, birth date, school identity and location are not collected.

## Reproduce tests

- `npm test`: safe OTP doubles, migration/account isolation, profile/curriculum filtering, secure-storage adapter and sync decision tests, plus v0.2 regressions.
- PostgreSQL: in a disposable empty PostgreSQL 17 database, apply `supabase/tests/bootstrap-local.sql`, the migration, then `supabase/tests/ownership.sql` with `psql -v ON_ERROR_STOP=1`. The ownership test rolls back all synthetic records.
- `tests/profile-smoke.py` and `tests/browser-smoke.py`: Python Playwright with Chromium, against the normal web process on 8081. These use isolated browser contexts.
- Test-only auth/sync UI: start a separate process with `EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_test_fixture_only EXPO_OFFLINE=1 npx expo start --web --port 8082`, then run `python tests/auth-smoke.py`. All provider requests are intercepted with synthetic responses. This does not verify real authentication or email delivery. Stop this test process afterward; never use these fixture settings for normal builds.
