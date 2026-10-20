# Platform Version and Dependency Compatibility Policy (Cross-cutting)

> Status: **Historical research checkpoint dated 2026-10-15.** Current manifest versions are recorded in `package.json`; this document is a compatibility policy, not a statement of installed versions.

## 1. Owner decision

Use the latest stable releases of Next.js and TypeScript that are compatible with the repository's framework, React, ESLint, build tooling, and deployment environment. Do not freeze the project on old major versions merely because the original documentation mentioned them.

## 2. Version checkpoint

Official release information checked on 2026-10-15:

- **Next.js:** 16.4 was announced by the official Next.js blog on 2026-10-06. The project should target the latest stable 16.4.x patch available at the time of the dependency-update unit, not blindly pin the first patch.
- **TypeScript:** the Microsoft TypeScript release page showed **7.0.2** as the latest stable release at this research checkpoint.
- **Supabase SSR:** the official Supabase guidance recommends `@supabase/ssr` for cookie-based sessions in Next.js and `@supabase/supabase-js` as the underlying client library.

Sources:
- Next.js blog: https://nextjs.org/blog
- Next.js support policy: https://nextjs.org/support-policy
- TypeScript releases: https://github.com/microsoft/TypeScript/releases
- Supabase SSR client guide: https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&queryGroups=framework
- Supabase server-package selection: https://supabase.com/docs/guides/auth/choosing-a-server-package

## 3. Repository baseline observed

At the audit checkpoint, `package.json` declared:
- `next: ^16.3.5`
- `react: ^19.3.0` and `react-dom: ^19.3.0`
- `typescript: ^6.0.3`
- `eslint-config-next: ^16.3.5`

No Supabase client package was declared.

These are repository observations, not a statement that every dependency has been validated against the latest releases.

## 4. Important compatibility gate

**Do not upgrade the package manifest just to satisfy a version number.** TypeScript 7 is a major compiler transition. Before changing package files, a dedicated implementation unit must:

1. Inspect peer-dependency requirements and release notes for Next.js 16.4.x, React, ESLint, Zod, Tailwind, and all build/test tools.
2. Confirm whether the stable TypeScript 7.0.2 compiler is supported by the selected Next.js release and all required tooling.
3. Update dependencies in a separate, reviewable change with the lockfile.
4. Run the production build, lint, TypeScript checking, unit tests, and a smoke test of routes/actions.
5. If compatibility is not established, document the blocker and select the newest supported stable TypeScript release temporarily; do not use a prerelease or force incompatible peer dependencies.
6. Record exact installed versions and test evidence in the progress tracker.

The target is the latest stable compatible release, not an unverified version claim.

## 5. Dependency policy

- Keep Next.js, `eslint-config-next`, and their framework integration on compatible release lines.
- Use the official Supabase SSR pattern: `@supabase/ssr` for cookie-aware clients and `@supabase/supabase-js` for database access.
- Install dependencies only in the approved dependency-update unit; this documentation PR must not alter `package.json` or the lockfile.
- Prefer exact verification of the lockfile and package-manager behavior; do not mix package managers.
- Never commit secret values. Public Supabase URL/publishable key are not substitutes for RLS; service-role/secret keys must remain server-only and are not needed for normal user-scoped requests.

## 6. Acceptance checklist for the future implementation unit

- [ ] Official stable versions rechecked on the implementation date.
- [ ] Peer dependencies and toolchain compatibility reviewed.
- [ ] Package manifest and lockfile updated in one scoped change.
- [ ] Production build passes.
- [ ] Lint passes with the current Next.js version (replace obsolete scripts if needed, in scope).
- [ ] Type-check and automated tests pass.
- [ ] Route, Server Action, and Supabase SSR smoke tests pass.
- [ ] Installed versions and any temporary compatibility exception are documented.

## 7. Scope boundary

This specification does not authorize package installation, package/lockfile edits, application code changes, or database changes. Those require the dedicated implementation unit and its verification checklist.
