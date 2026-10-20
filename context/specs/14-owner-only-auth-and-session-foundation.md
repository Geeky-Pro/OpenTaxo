# Unit 14 — Owner-Only Supabase Auth and Next.js Session Foundation

> Status: **Merged as part of the Supabase application foundation.** The owner confirmed sign-in and taxonomy creation; denied-user scenarios and current Supabase Auth dashboard settings remain pending. Unit 15 subsequently completed the JSON-to-PostgreSQL data-access cutover.
> Historical scope: email/password sign-in for one pre-approved owner, session refresh, and route/action protection.

## 1. Dependencies

Pinned direct dependencies:
- next@16.4.1 (upgraded from a vulnerable 16.3.x release)
- eslint-config-next@16.4.1
- @supabase/ssr@0.12.7
- @supabase/supabase-js@2.117.3

The npm lockfile was regenerated in CI and the dependency graph was verified by npm ci. Supabase's current Next.js guidance recommends separate browser/server clients and a root proxy.ts to refresh cookies. Server-side identity is checked with auth.getUser(); app authorization is decided by querying app_authorized_users.

References:
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs
- https://nextjs.org/docs/app/api-reference/file-conventions/proxy

## 2. Added files

- lib/supabase/client.ts: browser client.
- lib/supabase/server.ts: server client with Next.js cookie integration.
- lib/supabase/proxy.ts: session refresh and request access gate.
- proxy.ts: Next.js proxy convention entry point.
- lib/auth/require-owner.ts: server-side authorization guard for protected operations.
- lib/auth/actions.ts: email/password login and logout Server Actions.
- app/login/page.tsx: login-only UI; no signup flow.
- app/unauthorized/page.tsx: separate response for an authenticated but unapproved account.
- lib/supabase/database.types.ts: generated TypeScript definitions from the deployed Supabase schema.
- .env.example: required public project URL and publishable key variable names.
- .gitignore: excludes local .env files while allowing .env.example.

## 3. Protection applied

- Page requests require a verified Supabase user and an active row in app_authorized_users.
- API requests are answered with 401 when unauthenticated and 403 when authenticated but not authorized.
- Category create/update/reparent/delete Server Actions call requireOwner().
- Attribute create/update/delete Server Actions call requireOwner().
- Search-data Server Action calls requireOwner().
- JSON export and image upload endpoints call requireOwner().
- Sign-out clears the Supabase Auth session and returns to /login.
- No service-role/secret key is used in the browser or committed.

## 4. Required environment

Set these in local .env.local and the deployment environment; never commit the actual values:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

The example file contains placeholders only. If environment variables are absent, the proxy fails closed with HTTP 503 instead of exposing the application.

## 5. Required Supabase Dashboard actions

Before exposing the app:
1. Confirm Email provider is enabled.
2. Disable public sign-ups; the app intentionally has no signup action or signup UI.
3. Enable leaked-password protection.
4. Confirm the owner account's Auth UUID matches the active app_authorized_users.user_id row.
5. Use a second non-allowlisted test account to verify the app denies access.

These project settings are not modified by this code change and must be checked in the Dashboard.

## 6. Verification status

Source inspection confirms the guard is called from all current exported category and attribute mutation actions, the search action, and the two current API routes. Route-level checks are also centralized in proxy.ts.

CI verification on the implementation branch passed after dependency refresh:
- npm ci
- npx tsc --noEmit
- ESLint for the changed auth/integration files
- npm run build using Next.js 16.4.1
- successful login and logout with the real owner account
- direct unauthenticated requests to pages, Server Actions, export, and upload
- denial of a signed-in but unapproved account
- cookie refresh across an expired session

Do not mark the unit complete or merge it until these checks pass.

## 7. Remaining architecture boundary

The application still reads and writes data/categories.json and data/attributes.json. This is intentional in Unit 14. The next unit should implement PostgreSQL-backed repositories and data conversion with tests, then replace JSON reads/writes without dual-writing. Keep the source JSON files as migration/reference inputs until cutover is verified.

## 8. Known follow-up

- The full-repository ESLint run still reports 11 pre-existing errors in unrelated UI files; this unit's CI lints the changed auth/integration files. Track cleanup separately.
- npm audit no longer reports a critical vulnerability after the Next.js upgrade, but five high-severity advisories remain in the ESLint development-tooling dependency tree and need a separate dependency/security review.
- Add automated auth/access tests, including direct Server Action calls.
- After auth validation, implement the data access layer against the 15-table schema and generate database TypeScript types.
