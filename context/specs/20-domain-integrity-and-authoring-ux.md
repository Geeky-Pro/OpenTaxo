# Unit 20 — Domain Integrity, Store Routing, and Authoring UX

 > Last reviewed: 2026-10-16  
> Status: Initial hierarchy/slug safeguards remain deployed. Follow-up compatibility, centralized definitions, unit registries, and conversion rules were implemented in Units 24–27 and merged into `main`; browser-level verification remains open.

## 1. Scope and verified state

The live Supabase project is `jbzpjvnbektpsjinptto`. At review time:
- 20 taxonomy nodes exist.
- The initial review observed 7 active global attributes; a later progress snapshot reported 8. These are historical snapshots, not a live count. Re-query before any data mutation.
- 1 active Product Type schema exists, and it references a node whose type is `product_type`.
- All 15 tables in `public` have RLS enabled.
- The owner has successfully signed in and created the active category **المواصير** under **السباكة والأدوات الصحية**.
- The category has slug `plumbing-pipes`; its parent slug is now `plumbing-and-sanitary-tools`.
- There are no duplicate active slugs after canonical normalization.
- Six older taxonomy nodes still reference image files under `/categories/`. Keep those assets until migrated or the owner clears the legacy seed taxonomy.

## 2. Domain decisions now enforced

### 2.1 Taxonomy placement

The reviewed hierarchy is:

```text
Department
└── Category
    ├── Subcategory (optional)
    │   └── Product Type
    └── Product Type
```

Allowed relationships:
- Root: `department` only.
- `department` → `category`.
- `category` → `subcategory` or `product_type`.
- `subcategory` → `product_type`.
- `product_type` → no children.

Implemented in:
- `lib/utils/tree.ts`: `validateNodePlacement` and `validateReparent`.
- `lib/actions/categories.ts`: create/update/reparent checks.
- `lib/actions/category-details.ts`: full-detail save checks, including cycles and parent/type changes.
- `components/drawer/QuickEditDrawer.tsx`: valid default child type.
- `components/tree/TreeNodeItem.tsx`: no add-child action beneath Product Type.
- `components/modals/ReparentModal.tsx`: disables invalid destinations.
- Database migration `20261015204655_enforce_taxonomy_placement_rules.sql` plus follow-up `20261015204746_enforce_taxonomy_placement_and_product_type_schema.sql`: deferred PostgreSQL constraint triggers validate new rows, changed parent/type relationships, and reactivation without forcing a silent cleanup of legacy rows.

**Compatibility note:** eight existing seed nodes still have `category` as a child of another `category`. They were deliberately not renamed/reclassified because that would be a semantic data edit. Ordinary name/image/slug edits can continue; changing the invalid relationship or type requires a valid placement.

### 2.2 Product Type schema boundary

Only active `product_type` nodes may have an active `product_type_schemas` row. The deferred trigger in `20261015204746_enforce_taxonomy_placement_and_product_type_schema.sql` validates this in both directions. The current active schema passes the check.

Attributes must be assigned at the Product Type boundary, not to ordinary categories. Merchant products, offers, branch listings, inventory, pricing, and orders remain out of scope.

### 2.3 Canonical slugs and route lookup

The browse route resolves a category by its final slug segment. Therefore the current application requires global uniqueness among active taxonomy slugs, not merely sibling uniqueness.

Implemented:
- `normalizeSlug` transliterates Arabic text, lowercases, replaces whitespace with hyphens, strips non-ASCII URL characters, and collapses repeated hyphens.
- `CategorySchema` canonicalizes slugs on read/write validation.
- Create/update actions normalize manual slugs before uniqueness checks.
- Migration `20261015203952_normalize_taxonomy_slugs.sql` first normalized whitespace.
- Migration `20261015204844_global_active_taxonomy_slug_uniqueness.sql` canonicalized stored active/inactive slugs and replaced the active sibling-only index with `taxonomy_nodes_active_slug_global_uq`.

The preflight query found no collisions under the canonicalization rule before applying the migration. This matches the current route resolver. If the project later chooses sibling-scoped slugs, the route resolver must be changed to match the complete ancestor path before relaxing global uniqueness.

## 3. Attribute domain review

### Implemented in Units 24–27

- `attributes.key` is required and globally unique; attribute references use stable database UUIDs while legacy string IDs remain a compatibility layer.
- The central Attribute Center manages canonical key, Arabic/English names, aliases, primitive data type, compatible filter behavior, optional physical dimension, status, order, and usage. Referenced definitions are not hard-deleted.
- The four primitive data types are system-governed: `string`, `number`, `boolean`, and `enum`. Filter behavior is separate from primitive data type.
- UI/domain validation and PostgreSQL enforce the compatibility matrix for new or changed definitions. Existing incompatible legacy records are preserved until the owner explicitly edits them.
- Product Type assignments are unique per schema/attribute pair and support required/filterable/variant flags, order/group, numeric bounds, compatible unit selection, and enum value-set references.
- Value sets are reusable and ordered. Attribute-specific sets can only reference active enum attributes; a set bound to another attribute cannot be assigned. Active Product Type references guard archive/reassignment.
- The reviewed compatibility contract is: `string` → `select`, `checkbox`, `button_group`; `number` → `range` and `select` only when a finite predefined set is explicitly used; `boolean` → `toggle`, `checkbox`; `enum` → `select`, `checkbox`, `button_group`, `color_swatch`.

### Legacy data caution

Historical attribute counts and values differ across review snapshots. The Unit 24 review recorded seven active definitions and `الوزن` as `string + range`; a later progress snapshot reported eight active definitions and described `الضغط`/`الوزن` as `number + range`. Treat neither snapshot as a live query. `مقاوم للماء` was recorded as `string + toggle` in the reviewed snapshots. Query current records before any edit, and do not bulk-reclassify attributes or invent a dimension mapping.

The `attribute_value_sets.attribute_id` field remains nullable to support both reusable unbound sets and attribute-specific sets. Unit 25 now enforces the active association policy rather than leaving it as an unresolved design question.

## 4. Measurement and selling-unit integrity

- Physical `measurement_dimensions`/`measurement_units` are separate from commercial selling-unit definitions.
- Unit 26 manages a canonical base unit per configured dimension using `base = value * multiplier + offset`. Base changes rebase unit factors transactionally; archive guards preserve active references and archived-unit factors.
- Unit 27 uses the PostgreSQL `convert_measurement_value` function, rejects cross-dimension conversions, checks general physical rule coefficients against unit factors, and permits custom coefficients only when a compatible active selling-unit definition is linked.
- Product Type numeric bounds must be finite, ordered, and associated with a unit compatible with the attribute's physical dimension.
- DB smoke tests reported correct conversion math (250 cm = 2.5 m), base rebasing, and rejection of cross-dimension conversion. Browser-level checks remain pending; do not describe these tests as browser verification.

## 5. UI changes in this unit

- Attribute library now supports Arabic/English search and data-type filtering.
- Attribute results show filtered/total counts and a useful no-results state.
- Attribute deletion displays server errors rather than closing the confirmation modal as if it succeeded; successful deletion refreshes the page.
- Usage labels now say Product Types rather than generic categories.
- Taxonomy quick-create chooses a default child type based on the selected parent.
- Invalid parent-child choices are rejected by both application actions and PostgreSQL.

## 6. Repository cleanup

Removed from the working tree:
- `lib/data/io.ts`: obsolete filesystem JSON I/O helper, with no runtime importers after Supabase cutover.
- `data/categories.json` and `data/attributes.json`: legacy files with no runtime importers; their historical versions remain in Git history.
- `tsconfig.tsbuildinfo`: generated TypeScript build artifact; `*.tsbuildinfo` is now ignored.
- `public/categories/.gitkeep`: redundant because the directory contains retained legacy image assets.
- `next-themes`: unused dependency after replacing its injected script with the local theme context in PR #6.

Retained intentionally:
- `public/categories/*`: six existing database rows still reference these static images. Do not delete them until images are migrated to Supabase Storage or the owner clears those rows.
- SQL seed/import migrations: they are part of the applied migration history and should not be deleted.
- Historical specs and Git history: they document the original JSON implementation and preserve recovery context.

## 7. Current verification and next steps

- [x] Hierarchy placement, Product Type schema boundary, canonical active slugs, and safe taxonomy deletion/archive behavior are implemented.
- [x] Central attribute/data-type compatibility and reference-safe value-set rules are implemented in Units 24–25.
- [x] Dimension/unit invariants and conversion compatibility are implemented in Units 26–27.
- [x] CI passed on the reviewed code baseline and the merged Units 21–27; the documentation-only reconciliation has its own CI run pending at the time of the latest update.
- [ ] Browser-regression check the current `main` workspaces: taxonomy list/tree/browser, Product Type assignments, central definitions, value sets, measurements, and conversion calculator.
- [ ] Verify current Auth settings, denied-user scenarios, and that the latest `main` commit is the one deployed.
- [ ] Query live legacy attributes before deciding whether any should be explicitly corrected; preserve existing rows until the owner approves the changes.
