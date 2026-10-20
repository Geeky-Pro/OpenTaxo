# Unit 24 — Central Attribute and Data Type Centers

> Status: Merged in PR #14. The central attribute and data-type workspaces, domain compatibility checks, migration, and CI are in `main`; browser-level CRUD/compatibility verification remains pending.
> Supabase already has the relational foundations for attributes, aliases, value sets, values, measurement dimensions, units, and conversion rules. Extend those tables and current UI; do not create duplicate catalog tables.

## 1. Database snapshot and safe-review note

The original Unit 24 review observed 7 active `attributes` rows. The later progress audit reported 8 active attributes, so these counts are time-stamped observations rather than a current guarantee. Query the live database before any data mutation. The canonical `key`, `data_type`, `filter_type`, `measurement_dimension_id`, `status`, and `sort_order` columns already exist.
- `attribute_aliases`: 0 rows; the alias table and owner-only RLS policies already exist.
- `attribute_value_sets` and `attribute_values`: 0 rows; both tables already exist with unique keys and archive status.
- `measurement_dimensions`, `measurement_units`, and `unit_conversion_rules`: 0 rows; the physical-unit schema already exists.
- The historical review observed valid examples such as `اللون` (`enum` + `color_swatch`) and possible legacy mismatches including `مقاوم للماء` (`string` + `toggle`) and `الوزن` (`string` + `range`). A later tracker snapshot described `الضغط`/`الوزن` as `number + range`; because these records differ across snapshots, re-query live records before drawing conclusions or editing them. Preserve free-text unit metadata until an owner-reviewed mapping to a central dimension/unit exists. Never silently rewrite existing definitions.

## 2. Attribute Center

The central attribute definition is reusable and separate from Product Type assignment settings.

Each definition exposes:
- stable database UUID and canonical `key`;
- Arabic and English names;
- alternative names in `attribute_aliases`, including language code;
- primitive data type and compatible filter behavior;
- optional physical dimension (only for numeric attributes);
- active/archived status and display order;
- usage information so referenced definitions are not hard-deleted.

Use the existing `attributes` and `attribute_aliases` tables. Keep legacy IDs and the existing snapshot RPC compatible until all callers are migrated. Archive referenced records instead of hard deletion; block archive when active Product Type bindings or attribute-specific value sets still depend on the definition.

## 3. Data Type Center

Primitive data types are system-governed, not arbitrary user-created strings. The center documents the four supported types and their input/filter contracts:

- `string`: textual input; compatible with `select`, `checkbox`, and `button_group`.
- `number`: numeric input; compatible with `range` and, where a finite predefined value set is explicitly selected, `select`.
- `boolean`: true/false input; compatible with `toggle` and `checkbox`.
- `enum`: predefined value key; compatible with `select`, `checkbox`, `button_group`, and `color_swatch`.

A measurement dimension is valid only for `number`. Unit selection is a Product Type assignment concern and must match the attribute's physical dimension.

## 4. Compatibility and legacy safety

- Apply the same compatibility matrix in UI/domain validation and PostgreSQL.
- PostgreSQL enforcement rejects incompatible new definitions and incompatible changes to `data_type`, `filter_type`, or dimension.
- Existing incompatible rows remain readable and are not bulk-rewritten. Updating an incompatible row requires the owner to choose a compatible type/filter pair explicitly.
- Do not force `enum` values or unit records into JSON fields when relational tables already exist.
- Keep owner-only RLS. RPCs must be security-invoker, use a fixed search path, verify the allowlisted owner, and restrict execute grants to `authenticated`.

## 5. Out of scope for this unit

- Full value-set/value management UI; deliver in Unit 25.
- Full dimension/unit/conversion management UI; deliver in Unit 26.
- Replacing or clearing seed data.
- Automatically converting legacy `string` attributes to `number` or `boolean`.
- Mixing physical measurement units with commercial selling units.

## 6. Acceptance criteria

- [x] Attribute Center edits canonical key, Arabic/English names, aliases, data type, compatible filter, optional dimension, status, and order.
- [x] New definitions use a stable UUID and explicit key; no generated `legacy_...` key for new user-created definitions.
- [x] Aliases are saved atomically with the definition and are searchable.
- [x] Attribute archive is safe and does not delete referenced records.
- [x] Data Type Center explains supported inputs, compatible filters, value-set requirements, and unit support.
- [x] UI and Zod/domain validation use the same compatibility matrix.
- [x] PostgreSQL rejects invalid new/changed definitions but allows unchanged legacy mismatches to remain untouched.
- [x] Existing Product Type editor, snapshot behavior, and owner-only RLS remain intact.
- [x] CI passes: type check, domain smoke checks, targeted lint, and production build.
- [x] No production data reset or direct schema change occurs outside a reviewed migration.

## 7. Verification checklist

1. Confirm the current attribute records and their keys/aliases before changes.
2. Test creating a new `power_rating` numeric attribute with the power dimension.
3. Test rejecting `string + range`, `boolean + color_swatch`, and a measurement dimension on non-numeric types.
4. Confirm the existing `الوزن` and `مقاوم للماء` rows remain unchanged until explicitly edited.
5. Test duplicate keys and duplicate aliases.
6. Test alias save rollback if any alias is invalid.
7. Test that an attribute referenced by a Product Type or value set cannot be hard-deleted.
8. Run Supabase security advisors after any database migration and verify RLS remains enabled.
