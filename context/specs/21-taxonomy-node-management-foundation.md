# Unit 21 — Taxonomy Node Management Foundation

> Status: Merged in PR #9. The dashboard/searchable taxonomy workspace was subsequently merged separately in PR #13 (Unit 23). The Product Type editor from Unit 22 is also merged; preserve it when modifying node details.
> Supersedes the previous immediate priority ordering for authoring UX; it does not supersede existing database/security invariants.

## 1. Goal

Make taxonomy nodes first-class manageable records through the existing Next.js + Supabase application. The first delivery focuses on taxonomy navigation and accurate node metadata, not the full attribute/unit editor.

## 2. Domain contract

A taxonomy node must expose:
- `id`: immutable stable UUID.
- `name_ar`: required Arabic display name.
- `name_en`: optional English display name.
- `parent_id`: nullable stable UUID reference to the parent.
- `level`: derived from the parent chain; users cannot edit it directly.
- `description`: optional explanatory text.
- `status`: active or archived.
- `sort_order`: integer ordering among siblings.
- `node_type`: department, category, subcategory, or product_type.
- `slug`: normalized readable route identifier, not a relationship key.

The existing `taxonomy_nodes` table already contains most of these fields except `description` and a persisted `level`. The current UI adapter keeps legacy IDs for existing routes and tree mutations; the details view should show the underlying database UUID as the stable node ID. Do not silently switch route IDs or parent-reference formats as part of this unit. Before deciding to persist level, evaluate whether it should be derived in the query/domain layer to avoid stale values after reparenting. The implementation must not create a second taxonomy table.

## 3. Scope

- Make `/` the dashboard/entry page with live counts and navigation cards.
- Preserve the current visual tree editor at `/tree`.
- Add `/taxonomy` as a searchable/filterable list of every active taxonomy node, including type, parent/path, derived level, order, description, and attribute count for Product Types.
- Provide a create-node entry from `/taxonomy` using the existing quick-edit flow.
- Provide a clear taxonomy-management experience using the existing tree and category-detail routes/components where feasible.
- When a node is selected, expose its Arabic/English names, type, parent, computed hierarchy level/path, status, sort order, slug, and description.
- Preserve existing create/edit/reparent/archive flows and hierarchy validation.
- Keep Product Type as the only attribute-schema boundary.
- Add `description` through a forward-only Supabase migration, data-access/type validation, and edit UI only after confirming every write path and snapshot RPC contract.
- Keep RLS and the owner authorization boundary intact.
- Use RTL-first, mobile-first conventions and existing UI primitives.

## 4. Out of scope

- Full Product Type attribute editor redesign.
- New central data-type, value-set, unit, or dimension management pages.
- Changing attribute compatibility constraints.
- Clearing/replacing existing seed data.
- Persisting a redundant `level` column without a documented integrity strategy.
- Deleting existing rows or migration history.

## 5. Acceptance criteria

- [ ] `/` provides live counts and navigation to taxonomy, tree, store browsing, and the attribute library.
- [ ] `/tree` preserves the existing tree editor and current ordering.
- [ ] `/taxonomy` supports search, node-type filtering, and node creation.
- [ ] Product Type detail routes retain the latest editor, including required/filterable flags, bounds, units, value sets, and ordering.
- [ ] Tree still displays all active nodes and preserves current ordering.
- [ ] Selected node metadata clearly identifies its type, parent, and full ancestor path.
- [ ] `level` is consistently derived from `parent_id` and does not become stale after a reparent.
- [ ] Create/edit forms support `description` if the schema migration is included in this unit.
- [ ] Invalid parent-child relationships and cycles remain rejected by both server/domain validation and PostgreSQL safeguards.
- [ ] Product Types remain leaves and only Product Types may own active schemas.
- [x] The applied migration is additive; it does not delete or reclassify taxonomy rows (20 total remain: 18 active, 2 archived).
- [x] Main CI passed on merge commit `b71e820`: TypeScript, taxonomy/domain checks, targeted ESLint, and production build.
- [x] Progress tracker and forward-only migration are committed.

## 6. Verification checklist

1. [x] Reviewed taxonomy read/write paths and the `replace_taxonomy_snapshot` RPC before changing the table shape.
2. [x] Verified the migration is forward-only; Supabase records it as applied, the description column/check exist, and the snapshot RPC stores description.
3. Test root, category, subcategory, and Product Type metadata/path rendering.
4. Test moving a node and confirm the derived level/path updates immediately.
5. Test empty description, Arabic/English names, archived status, and sort ordering.
6. Test existing hierarchy protections and owner-only RLS behavior.
7. [x] Repository CI passed and the production deployment for merge commit `b71e820` is READY. Browser-level checks in items 3–6 remain pending.
