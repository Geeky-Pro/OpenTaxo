# Progress Tracker — Taxonomy & Catalog Planner

> Last updated: 2026-10-16 (main-branch documentation reconciliation)

## Current Phase

**Phase: Post-merge verification — Units 21–27 are merged into `main`; implementation CI is green on the reviewed baseline. Browser-level regression checks and Auth security-setting confirmation remain open.**

Code baseline reviewed before this documentation pass: `14f70f568544b3de6b12d54ef6da1a90c9c835f8`; GitHub Actions CI passed for that commit on 2026-10-16 (run `38950991964`). The documentation-only reconciliation also passed CI on commit `0ae20198c5fe41764c924eb38ef585e40fe0b527` (run `38957104387`). Check GitHub Actions for the status of any subsequent documentation-only commits. Automated checks do not prove every merged workspace has been exercised in a browser or that the latest main commit is live in production.

Merged implementation sequence:

- PR #9 — Unit 21 taxonomy node metadata foundation.
- PR #11 — Unit 22 Product Type attribute editor.
- PR #13 — Unit 23 dashboard and taxonomy management workspace. PR #12 was a duplicate attempt and was closed without merging.
- PR #14 — Unit 24 central attribute and data-type definitions.
- PR #15 — Units 25–27 value sets, measurement dimensions/units, and conversion rules.

Supabase remains the source of truth. The owner chose not to spend time importing legacy data. Existing sample rows may remain; do not clear, reseed, or reclassify data without an explicit, reviewed plan.

## Verified Infrastructure and Open Security Checks

Last documented database audit:

- [x] Supabase relational schema is present; 15 public tables were reported with RLS enabled.
- [x] `app_authorized_users` contains an active entry linked to an existing Supabase Auth user.
- [x] The `categories` Storage bucket exists with public-read access, owner-authorized writes, PNG/JPEG/WebP restrictions, and a 5 MiB limit.
- [x] Vercel environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` were configured for Production, Preview, and Development at the last documented check.
- [x] Owner sign-in and creation of `المواصير` under `السباكة والأدوات الصحية` were confirmed by the owner.
- [ ] Verify signed-out and authenticated-but-not-allowlisted access denial in the deployed application.
- [ ] Confirm public sign-up is disabled in Supabase Auth settings.
- [ ] Enable leaked-password protection; the last documented Supabase security advisor result reported it disabled.
- [ ] Verify that the current `main` deployment—not an older READY deployment—serves the merged Units 21–27.

## Completed Historical/Foundation Units

| Unit | Description | State |
| --- | --- | --- |
| 01–08 | Original taxonomy/attribute UI and local-JSON foundation | Completed historically; filesystem persistence is no longer part of the current runtime |
| 09 | Supabase foundation audit | Completed |
| 10 | Domain ERD and relational schema | Deployed; current invariants are summarized in `context/architecture.md` |
| 11 | Auth, session, and RLS | Foundation merged; live denial and dashboard-setting checks remain open |
| 12 | Legacy JSON cutover decision | Full import is not required; no dual-write; preserve rows unless explicitly approved |
| 13 | Supabase relational foundation | Deployed |
| 14 | Next.js Auth and owner authorization | Merged; runtime authorization checks remain open |
| 15 | Supabase repository/data-access cutover | Merged; Supabase is the sole runtime source of truth |
| 16 | Persistent category image storage | Migration and bucket/policy were verified; recheck live configuration before changes |
| 17 | Operational readiness and migration-history reconciliation | Sign-in/category create verified; Auth security settings remain open |
| 18 | Domain integrity and authoring UX implementation | Merged in PR #7; hierarchy/slug rules and UX safeguards implemented |
| 19 | Export contract and YCP interoperability | Later; review and version the export contract before expanding it |
| 20 | Domain integrity and authoring UX review record | Review decisions recorded; legacy exceptions and compatibility follow-ups documented |

## Current Roadmap — Main-Branch Status

| Priority | Unit / task | Main-branch state | Remaining verification |
| --- | --- | --- | --- |
| P0 | 21 — Taxonomy node management foundation | Merged in PR #9; migration `20261016100000_taxonomy_node_description.sql` is recorded as applied. Description and snapshot RPC were verified; the reported 20 nodes (18 active, 2 archived) were preserved. | Browser checks for metadata/path/description edits and persistence |
| P0 | 22 — Product Type attribute editor | Merged in PR #11; migration `20261016000004_product_type_attribute_editor.sql` and snapshot bridge are present. Assignment RPC and database safeguards were reviewed. | Browser add/edit/reorder/reload checks; preview was rate-limited at merge time |
| P0 | 23 — Dashboard and taxonomy management workspace | Merged in PR #13; CI passed. Dashboard, `/taxonomy` list, search/type filtering, and navigation are in `main`; Unit 23 spec has now been added. | Run a main-branch regression check |
| P0 | 24 — Central attribute and data-type centers | Merged in PR #14; migration `20261016120000_central_attribute_definition_integrity.sql` is present. Four primitive types are system-governed. | Browser CRUD/compatibility checks; preserve untouched legacy mismatches |
| P1 | 25 — Central value sets | Merged in PR #15; additive database migrations and DB smoke tests passed. | Browser create/edit/archive/restore and Product Type option-order checks |
| P1 | 26 — Measurement dimensions and units | Merged in PR #15; base-unit invariants, transactional rebasing, and archive guards are implemented and smoke-tested. | Browser CRUD/rebase/archive checks |
| P1 | 27 — Conversion rules and compatibility | Merged in PR #15; PostgreSQL conversion calculator, same-dimension rules, coefficient checks, and formula smoke tests passed. | Browser calculator/rule checks |
| P1 | Data compatibility review | New/changed definitions are validated across UI/domain/PostgreSQL. Legacy mismatches are intentionally not bulk-rewritten. | Plan explicit owner-reviewed mappings for legacy attributes and units |
| P2 | Data initialization | Existing taxonomy/attributes remain; the owner does not require a legacy import. | No reset or deletion without an explicit backup/data plan |
| P2 | Security and release verification | Auth/RLS foundation is present; latest main CI passed. | Confirm Auth settings, denied-user flows, and current deployment/browser behavior |

## Current Main-Branch and CI Evidence

- Branch being documented: `main`.
- Main HEAD at the latest check: `14f70f568544b3de6b12d54ef6da1a90c9c835f8`.
- Latest CI for that commit: run `38950991964`, conclusion `success`.
- PR #15 merged at `120e1f0e3493246ff115a39edb97368ea149b924`. Its reported CI passed on code commit `4bf456f866f9cb9e332f6b6f268011dad42abfce`; main subsequently passed CI again.
- The last documented preview attempt for PR #15 was blocked by Vercel HTTP 402 `api-deployments-free-per-day`. That was the state at the time of the PR; recheck before assuming the same limit still applies.
- Last database smoke tests reported zero rows in `attribute_value_sets`, `attribute_values`, `measurement_dimensions`, `measurement_units`, and `unit_conversion_rules`. These are last-observed counts, not a guarantee that the live database has not changed since.
- No destructive reset or bulk seed operation was part of Units 21–27.

## Known Issues / Cautions

- Supabase Auth leaked-password protection was reported disabled by the last security-advisor check. See the official remediation guide: <https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection>
- The Supabase Dashboard setting for public sign-up cannot be verified through the database query tools used in the previous audit.
- The owner confirmed sign-in and category creation, but not every edit/reparent/archive, denied-user, or post-merge browser scenario.
- Supabase migration history previously showed the Storage migration name twice. A no-op migration file represents the already-applied second version; inspect remote/local migration status before the next schema change.
- Eight legacy parent/type mismatches were intentionally preserved. New nodes and changed placements are validated by application logic and database triggers; do not silently reclassify legacy rows.
- Attribute snapshots disagree and must not be treated as live truth: the Unit 24 review recorded seven active attributes and `الوزن` as `string + range`; a later tracker snapshot reported eight active attributes and described `الضغط`/`الوزن` as `number + range`. `مقاوم للماء` remains a known legacy `string + toggle` mismatch in the reviewed snapshots. Query the live rows before any edit; do not bulk-convert. Any pressure/weight dimension mapping requires owner review.
- Six legacy category image paths still reference static files under `public/categories/`. Preserve those assets until references are migrated or the owner explicitly approves clearing the legacy rows.
- Full-repository lint previously reported 11 pre-existing errors in unrelated UI components. Do not widen a scoped task solely to clean those up.
- Five high-severity advisories were previously reported in the ESLint tooling dependency tree; recheck before dependency upgrades.

## Architecture Decisions Log

| Date | Decision | Rationale |
| --- | --- | --- |
| 2026-10-15 | Supabase PostgreSQL is the source of truth | Shared global YCP taxonomy; no separate backend without a demonstrated need |
| 2026-10-15 | No JSON/PostgreSQL dual-write | Prevent divergent data sources after cutover |
| 2026-10-15 | One authorized owner account initially; public sign-up should be disabled | Supabase Auth establishes identity; allowlist and RLS enforce authorization |
| 2026-10-15 | Email/password is the initial sign-in method | Credentials are provisioned through a controlled flow and never stored in Git |
| 2026-10-15 | Stable UUIDs for relationships; slugs for readable URLs/search | Foreign keys must use stable IDs |
| 2026-10-15 | No legacy data import required for completion | The owner will author taxonomy and definitions through the app |
| 2026-10-15 | Category images use persistent Supabase Storage | Avoid ephemeral filesystem uploads |
| 2026-10-15 | Active taxonomy slugs are globally unique | Matches the current browse resolver |
| 2026-10-15 | Validate new/changed hierarchy while preserving legacy rows | Avoid silent semantic edits to legacy mismatches |
| 2026-10-16 | Product Type is the only attribute-schema boundary | Keeps schema assignments separate from ordinary taxonomy nodes |
| 2026-10-16 | Central definitions are reusable and reference-safe | Avoid duplicate attribute/value/unit definitions and preserve referenced records |
| 2026-10-16 | Physical measurement units and commercial selling units are distinct | Prevent dimensionally invalid conversions |

## Historical Units

Units 01–08 describe the completed local-JSON implementation only. They must not be treated as instructions to restore filesystem persistence. Current work follows the Supabase-backed architecture and the active unit spec.
