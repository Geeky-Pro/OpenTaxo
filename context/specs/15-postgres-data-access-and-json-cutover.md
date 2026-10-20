# Unit 15 — PostgreSQL Data Access and JSON Cutover

> Status: **Implemented and deployed.** The owner has confirmed successful sign-in and creation of a taxonomy node. CI passed for the theme/routing fix; the owner still needs to visually confirm the live store route.
> Scope: the Next.js app uses Supabase-backed repositories. Legacy JSON files were removed from the working tree after cutover and remain recoverable in Git history.

## 1. Data-access boundary

- lib/data/categories.ts reads active taxonomy nodes from public.taxonomy_nodes and writes via replace_taxonomy_snapshot.
- lib/data/attributes.ts reads active attributes from public.attributes and writes via replace_attribute_snapshot.
- lib/data/snapshot.ts uses replace_taxonomy_and_attribute_snapshots for an atomic combined write when deleting an attribute and removing its bindings.
- Application IDs remain the existing legacy string IDs for UI compatibility. Database primary/foreign keys remain UUIDs; parent IDs and attribute bindings are resolved to UUID relationships server-side.
- The old `data/categories.json` and `data/attributes.json` files were removed from the working tree after cutover because no runtime imports remained. Git history preserves the previous versions. There is no JSON/Postgres dual-write.

## 2. Database functions

Migration files:
- 20261015182130_snapshot_repository_rpc_functions.sql
- 20261015182453_preserve_seed_order.sql
- 20261015182602_atomic_catalog_snapshot_rpc.sql

Functions:
- replace_taxonomy_snapshot(jsonb): validates the snapshot, upserts nodes, resolves parent legacy IDs to UUIDs, archives removed nodes, ensures Product Type schema rows, and synchronizes Product Type attribute bindings and variant axes.
- replace_attribute_snapshot(jsonb): validates and upserts attributes, preserves stable legacy IDs/keys, records display order, and archives removed attributes.
- replace_taxonomy_and_attribute_snapshots(jsonb,jsonb): invokes both snapshot functions in one transaction for actions that need to update both datasets.

All functions use SECURITY INVOKER, an empty search_path, and explicit execute grants for authenticated users only. They rely on the existing RLS policies and active owner allowlist; they do not bypass RLS or use a service-role key.

## 3. Domain behavior preserved or enforced

- The current UI's string IDs are preserved through legacy_id; UUIDs remain the relational keys.
- Category parent references are translated from legacy IDs to UUIDs.
- Taxonomy and attribute display order is preserved with sort_order.
- Removed taxonomy nodes and attributes are archived instead of hard-deleted.
- Product Type is the only attribute/schema boundary. The category details UI now displays attribute-binding controls only when the node type is Product Type. Saving a node as another type removes its attribute bindings.
- Legacy parent-type mismatches remain in the existing seed rows. New nodes and changed relationships are now validated by both server actions and deferred PostgreSQL constraint triggers. Existing active slugs were normalized to lowercase URL-safe ASCII/hyphen form; active slugs are globally unique to match the current nested-route resolver.

## 4. Verification performed against Supabase

- Applied the three migration versions listed above.
- Executed both snapshot functions and the combined function inside an explicit transaction and rolled back the test writes.
- After rollback, read-only reconciliation remained: 19 active taxonomy nodes, 7 active attributes, 1 active Product Type schema.
- Confirmed the functions are SECURITY INVOKER, use an empty search_path, are not executable by anon, and are executable by authenticated.
- Generated lib/supabase/database.types.ts from the live schema, including RPC signatures and attributes.sort_order.

These checks validate SQL parsing and snapshot logic using the database connection, but do not substitute for an authenticated browser test using the owner's session.

## 5. Application verification required

- CI passed on this branch: npm ci, TypeScript, targeted ESLint, and production build.
- With the owner session configured, verify read/list/search, create/update/reparent/archive, attribute create/update/archive, Product Type binding changes, export, and upload.
- Verify an unauthenticated request is denied and a signed-in non-allowlisted account is denied.
- Verify a failed RPC leaves the transaction unchanged and returns a useful error.
- Confirm Vercel has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY configured before deployment.

## 6. Known follow-up / boundaries

- The full-repository ESLint run still reports pre-existing issues in unrelated UI files; CI targets the files changed by these units.
- Five high-severity npm audit findings remain in the ESLint development-tooling dependency tree. No critical advisory remained after upgrading Next.js to 16.4.1; investigate the remaining dev-only findings separately.
- New category image uploads use the persistent Supabase Storage bucket. Six pre-existing seed nodes still reference images under `/categories/`; retain those static files until their images are migrated or the owner explicitly clears the seed taxonomy.
- Existing sample taxonomy still contains eight parent-type mismatches; they were deliberately preserved rather than silently reclassified. Slugs have since been normalized. Attribute/filter compatibility and measurement-unit integration remain domain-review follow-ups.
