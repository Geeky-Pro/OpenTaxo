# Unit 22 — Product Type Attribute Editor

> Status: Merged in PR #11. Migration `20261016000004_product_type_attribute_editor.sql` and the snapshot-assignment bridge are in `main`; CI and database/RPC checks passed. Browser-level add/edit/reorder/reload verification remains pending.
> Dependency: Unit 21's description migration is present in the repository and was recorded as applied in Supabase.

## Goal

Replace the existing tag-only Product Type attribute panel with a guided editor backed by the relational Product Type schema. A Product Type is the only taxonomy node allowed to own attribute assignments.

## Scope

- Keep the existing `/categories/[id]` Product Type detail route and global attribute library.
- For every assigned attribute show Arabic/English name, data type, filter behavior, required, filterable, variant-axis, order/group, and value/unit configuration.
- Support adding/removing global attributes without duplicate assignments.
- Support numeric min/max bounds only for numeric attributes and reject invalid/inverted bounds.
- Support selecting an active central measurement unit only when it matches the attribute's measurement dimension.
- Support selecting an active value set for enum attributes, and preserve optional explicit allowed values for compatibility while value sets are being populated.
- Save one Product Type's bindings atomically through a dedicated owner-authorized, SECURITY INVOKER RPC. Do not rewrite the full taxonomy snapshot when editing only bindings.
- Keep stable database UUIDs internally and existing legacy attribute IDs as a compatibility layer.
- Preserve RLS and owner checks. Never trust UI validation alone.
- Do not seed or reset taxonomy, attributes, value sets, dimensions, or units in this unit.

## Persistence contract

Use existing `product_type_attributes` columns for `is_required`, `is_filterable`, `display_order`, `group_key`, and `configuration`. Store per-assignment `unit_id`, `value_set_id`, numeric `min_value`/`max_value`, `role`, and `allowed_values` in configuration. Variant state remains represented by `variant_axes`.

The RPC must verify:
- target node is an active Product Type with an active schema;
- no duplicate attribute assignment IDs;
- every attribute is active;
- numeric bounds are numeric and min <= max, and bounds are only allowed for `number`;
- a selected unit is active, belongs to the attribute's measurement dimension, and is only allowed for `number`;
- a selected value set is active and either unscoped or assigned to the same attribute, and is only allowed for `enum`;
- variant axes and assignment rows remain synchronized.

## Out of scope

- Central definition CRUD pages for attributes, data types, value sets, units, dimensions, or conversion rules.
- Backfilling units/value sets or reclassifying the seven existing attributes.
- Product/offer inventory data, storefront behavior, or broad RBAC.

## Verification checklist

- [x] TypeScript, ESLint, domain smoke tests, and production build pass on commit `f42f4e6`.
- [ ] UI can add, configure, reorder, and remove attributes on a Product Type.
- [ ] Required/filterable/variant flags persist after reload.
- [ ] Numeric bounds accept a valid range and reject invalid/inverted bounds.
- [ ] Enum value-set selection is scoped to compatible active sets.
- [ ] Unit choices are dimension-compatible; when no dimensions/units exist, UI explains why no unit is available.
- [ ] Non-Product-Type nodes cannot save attribute assignments.
- [x] Database RPC uses SECURITY INVOKER, checks active schema/definitions, and relies on existing owner RLS policies.
- [x] No taxonomy/attribute/definition rows are deleted or seeded by this unit.
- [x] Progress tracker updated.
- [ ] Verify the merged implementation in a browser once a current preview/deployment is available; the preview was rate-limited at merge time.
