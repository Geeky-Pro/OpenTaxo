# Unit 13 — Supabase Schema Foundation and Initial JSON Seed Import

> Status: **Initial schema deployed; application cutover and persistent image storage subsequently completed.** This file preserves the original schema-unit record; see `context/progress-tracker.md` for current operational status.

## 1. Scope completed

- Created the initial relational schema in Supabase project `taxonomy-builder` (`jbzpjvnbektpsjinptto`).
- Enabled RLS on all 15 public tables.
- Added an explicit application authorization allowlist and seeded the one owner account already provisioned in Supabase Auth. The account identifier is stored only in the database; do not copy credentials or secret keys into this repository.
- Added SELECT/INSERT/UPDATE/DELETE policies for the taxonomy domain tables, scoped to an active allowlisted authenticated user. The allowlist table grants only SELECT to authenticated users and exposes only the user's own active row.
- Revoked `anon` table privileges on domain tables.
- Added a trigger that prevents a taxonomy node from becoming its own ancestor.
- Imported the current JSON seed data while preserving each legacy record in `source_metadata` and preserving original IDs in `legacy_id`.
- Created one Product Type schema for the one legacy `product_type` node.
- Added foreign-key indexes reported by the initial performance advisor.
- Committed the matching migration files to this branch.

## 2. Migration files

1. `supabase/migrations/20261015175117_taxonomy_core_tables.sql`
2. `supabase/migrations/20261015175142_taxonomy_supporting_tables_and_rls.sql`
3. `supabase/migrations/20261015175201_import_legacy_json_seed_data.sql`
4. `supabase/migrations/20261015175318_index_foreign_keys.sql`

The Supabase migration history reported all four versions applied successfully. The initial SQL schema and data import were applied to the project; no application files, package manifests, lockfiles, or source JSON files were changed as part of this unit.

## 3. Current schema inventory

The 15 public tables are:

- `app_authorized_users`
- `taxonomy_nodes`, `taxonomy_aliases`
- `attributes`, `attribute_aliases`, `attribute_value_sets`, `attribute_values`
- `product_type_schemas`, `product_type_attributes`, `variant_axes`, `variant_constraints`
- `measurement_dimensions`, `measurement_units`, `selling_unit_definitions`, `unit_conversion_rules`

The design deliberately excludes Merchant Product, operational variants/inventory, offers, branches, orders, payments, and a standalone schema-version table.

## 4. Initial import reconciliation

Read-only reconciliation after import returned:

| Check | Result |
|---|---:|
| Taxonomy nodes imported | 19 |
| Attribute definitions imported | 7 |
| Product Type schemas created | 1 |
| Taxonomy nodes with parent links | 14 |
| Orphaned parent foreign keys | 0 |
| Legacy parent references not resolved | 0 |
| Taxonomy rows with nonconforming slugs at initial import | 10 |
| Attribute rows retaining a legacy `unit` property in source metadata | 1 |

The import preserves source values; it does not silently repair legacy taxonomy classifications or slugs.

## 5. Data-quality findings requiring a later domain-cleanup unit

- Eight `category` records currently have a parent whose `node_type` is also `category`. The current schema keeps these relationships because the legacy hierarchy uses them; do not reclassify them automatically. Review whether they should become `subcategory` nodes or whether the domain rules need adjustment.
- Initial import retained ten noncanonical slugs. On 2026-10-15, a follow-up migration normalized whitespace to hyphens in stored slugs; the application schema also trims and normalizes whitespace on category validation. Canonical case/Unicode policy and collision rules remain part of domain review.
- Attribute records do not have a source `key` field. The import assigned deterministic keys derived from the legacy IDs using the `legacy_` prefix, and retained each original record in `source_metadata`. These keys are migration-safe identifiers, not a final semantic naming decision.
- The source attributes label all seven data types as `string`, including attributes such as weight and waterproof. The source values were preserved; do not infer numeric/boolean types without review.
- Some category labels in the sample seed data appear semantically inconsistent with their English names or parent. Keep them unchanged until the owner classifies them as production taxonomy versus test/example data.
- Initial import preserved legacy image paths as metadata. Persistent category-image uploads now use the public `categories` Supabase Storage bucket; existing legacy files remain in the repository as reference/rollback assets until their references are reviewed.

## 6. Security state and limitations

- RLS is enabled on every public table in the initial schema.
- Domain-table policies require an authenticated user whose ID is active in `app_authorized_users`.
- The allowlist currently contains the one owner identity provisioned for this project. The database does not grant access to every authenticated account.
- The initial security advisor reported **Leaked Password Protection Disabled**. Enable Supabase Auth's leaked-password protection in the Dashboard and re-run the advisor.
- Public sign-up disablement and email/password provider settings were not verifiable through the available project-management actions. Verify them in Supabase Dashboard before treating authentication setup as complete.
- Application sign-in UI, SSR cookie/session refresh, route protection, Server Action checks, and export protection were implemented in later units. Browser-level owner CRUD and unauthorized-user denial checks remain pending.

## 7. Verification

- Supabase table listing: 15 public tables, all with RLS enabled.
- Migration history: four successful migrations.
- Reconciliation SQL: 19 taxonomy nodes, 7 attributes, 1 Product Type schema, no orphaned parent links.
- Security advisor: no schema-specific RLS finding returned; one Auth warning remains for leaked-password protection.
- Performance advisor: foreign-key indexes were added after the first report; re-run advisors after the next implementation unit.
- No frontend build or test suite was run because application code was not changed.

## 8. Next unit

Implement the Next.js Supabase foundation and owner-only email/password authentication:
- pin compatible `@supabase/supabase-js` and `@supabase/ssr` versions and update the lockfile;
- add browser/server clients and session-refresh proxy following current official Supabase guidance;
- implement a login-only flow (no sign-up UI);
- enforce the owner allowlist in protected routes, Server Actions, and export;
- replace JSON reads/writes only within the approved data-access unit, with tests for signed-out, unauthorized, and authorized requests;
- do not expose service-role/secret keys to the browser;
- verify public sign-up is disabled before the app is exposed.
