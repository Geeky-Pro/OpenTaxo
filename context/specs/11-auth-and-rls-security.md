# Unit 11 — Supabase Auth, Next.js Access, and RLS

> Status: **Historical security design; the Next.js sign-in/session and owner-authorization foundation was subsequently merged.** Live confirmation of public sign-up disablement, leaked-password protection, and denied-user browser scenarios remains open. See `context/progress-tracker.md` for current verification state.

The initial owner allowlist and deny-by-default RLS policies are in the migrations. Public sign-up disablement has not been verified through the available project-settings interface; do not claim it is disabled until checked in the dashboard.

## 1. Decision

The project owner selected direct Supabase access from Next.js with Supabase Auth and Row Level Security. The app remains an Arabic-first taxonomy authoring tool. **Initial authorization is limited to one explicitly approved owner account**; the design must remain extensible so roles and permissions can be added later without redesigning identity or taxonomy records. Solo governance does not mean public unauthenticated database access.

## 2. Access pattern

- Use the supported Supabase SSR client pattern for Next.js App Router.
- Create a server-side client that reads/writes the current Auth session using the framework's request/cookie mechanism.
- Use the public/publishable key for user-scoped client initialization; the database must still enforce RLS.
- Keep privileged service-role/secret keys out of client bundles and never name them with a `NEXT_PUBLIC_*` prefix.
- Server Actions and Route Handlers must authenticate and validate every mutation; UI hiding is not authorization.
- Avoid a separate backend service unless a future requirement demonstrates that Next.js cannot safely own the relevant operation.

## 3. Authentication requirements

1. Require a valid signed-in user before reading or changing shared taxonomy data.
2. Use **email and password** as the selected sign-in method for the initial release.
3. **Allow exactly one owner identity initially**, using an explicit server-enforced authorization gate. A valid Supabase Auth session alone must not grant access.
4. Disable public sign-up for the initial release. Provision/invite the owner account through a controlled administrative process; do not hardcode or invent the owner's email or credentials in source files.
5. Provision the owner's account through a controlled Supabase administrative flow; the email address and password must be supplied by the owner through secure means and must never be committed to the repository or documentation.
6. Protect all authoring routes, Server Actions, and export endpoints consistently.
7. Treat missing/expired sessions as unauthenticated; return safe errors and redirect or prompt for sign-in as appropriate.
8. Do not trust a user ID sent in request data. Derive the actor from the validated Auth session and verify that the identity is the approved owner.
9. Keep identity separate from authorization. Use Supabase `auth.users` as the identity provider; add a minimal application authorization record/table only if needed to maintain the owner allowlist. Do not duplicate passwords or create a full RBAC model now.
10. Design the authorization boundary so future roles/permissions can be introduced through explicit application authorization data and policies, without treating every authenticated user as authorized.
11. Add rate limits or abuse controls only where supported and justified; do not build speculative features in the foundation unit.

## 4. RLS policy baseline

For every user-accessible table introduced later:

- Enable RLS before exposing the table to the app.
- Start with deny-by-default behavior.
- Permit `SELECT`, `INSERT`, `UPDATE`, and `DELETE` only for the intended authenticated principal(s).
- Do not create an unrestricted `USING (true)` or `WITH CHECK (true)` policy for `anon` or `authenticated` as a shortcut.
- Keep read and write policies explicit, and test each operation under both signed-in and signed-out sessions.
- Use `auth.uid()` for actor attribution and user ownership checks where appropriate.
- The global YCP taxonomy is shared data, so a simplistic `created_by = auth.uid()` rule must not accidentally make rows invisible to the only authorized operator after creation. Review the actual single-operator/shared-data access model before finalizing policies.
- Do not create a `profiles` or workspace-membership table unless a concrete authorization requirement calls for it.
- Review grants as well as RLS; RLS is not a substitute for careful privileges.

### Authorization decision — resolved for the initial release

The owner selected **one authorized owner account only for now**, with roles and permissions deferred to a later phase. Implement a server-enforced owner allowlist or equivalent minimal authorization record. Never rely only on hiding UI controls, checking that a session exists, or trusting a client-supplied user ID. Do not deploy broad access for all `authenticated` users. Keep the allowlist maintainable without embedding the owner identity in each taxonomy row. The sign-in method is now decided: email and password. The secure provisioning process must be selected during implementation planning. The owner email and credentials remain intentionally unspecified here.

## 5. Secrets and environment variables

Proposed local/deployment configuration (exact key names must match the chosen Supabase SDK version):

- `NEXT_PUBLIC_SUPABASE_URL`: project URL; public.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publishable/anon key as applicable to the project's key format; public but still subject to RLS.
- Any service-role/secret key: server-only, only for a separately reviewed administrative task, not routine user requests.

Never commit real secrets. Keep `.env.local` ignored and provide a sanitized `.env.example` only in a later approved implementation unit. Do not include database passwords or secret keys in logs, screenshots, or issue descriptions.

## 6. Security verification checklist for the later implementation

- [ ] Signed-out requests cannot read or mutate protected taxonomy data.
- [ ] A signed-in but unauthorized account cannot read or mutate data.
- [ ] Public sign-up is disabled and an arbitrary Auth user is not automatically authorized.
- [ ] Email/password sign-in works for the owner, including safe error handling and session refresh.
- [ ] Only the explicitly approved owner identity is authorized in the initial release.
- [ ] Authorization logic is isolated so future roles/permissions can be added without changing the identity provider.
- [ ] The intended owner account can perform all approved operations.
- [ ] RLS is enabled on every exposed table.
- [ ] SELECT/INSERT/UPDATE/DELETE policies are tested independently.
- [ ] Server Actions validate inputs with Zod and derive actor identity from the session.
- [ ] Export endpoint enforces the same access rules as normal reads.
- [ ] No service-role secret appears in client bundles or `NEXT_PUBLIC_*` variables.
- [ ] Migration credentials are not reused by the runtime application.
- [ ] Tests cover archived records and foreign-key restrictions.

## 7. Not part of this unit

No Auth provider settings, policies, grants, environment files, SDK installation, or application changes are performed in the audit/specification phase.
