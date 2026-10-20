# Unit 25 — Central Value Sets

> Status: Merged in PR #15. Database smoke tests and main-branch CI passed; browser create/edit/archive/restore and Product Type option-order verification remain pending.

## Purpose
Provide a central catalog for reusable, ordered option groups and their individual values. The center is the canonical source for enum options; Product Type assignment only references a value-set ID and must not duplicate labels or option lists.

## Scope
- Create and edit value sets with stable keys, Arabic/English names, optional association to one active enum attribute, sort order, and active/archived status.
- Create and edit values with stable keys, Arabic/English labels, optional raw value (for example a color hex), sort order, and active/archived status.
- Search and filter sets; inspect value counts and active Product Type usage.
- Archive/restore instead of hard deletion; retain historical rows.
- Make ordering visible in both the central editor and Product Type option lists.

## Integrity rules
- A set linked to an attribute may only link to an active `enum` attribute.
- At most one active attribute-specific set may be linked to an attribute; unbound sets remain reusable.
- Active value keys are case-insensitively unique within a set.
- Active values must belong to an active value set.
- A set referenced by an active Product Type cannot be archived or reassigned to another attribute until the binding is removed.
- Product Type assignment must reject a set attached to a different attribute and reject value sets for non-enum attributes.
- No bulk seed import or destructive reset is part of this unit.

## Acceptance
- [x] Arabic RTL center supports create/edit/archive/restore for sets and values.
- [x] Optional association only offers active enum attributes.
- [x] Stable keys, translations, raw values, and ordering persist.
- [x] PostgreSQL enforces type, uniqueness, active-parent, and archive guards.
- [x] Product Type options read active sets/values in configured order.
- [x] TypeScript, targeted lint, conversion/domain smoke checks, and production build pass in CI.
- [ ] Owner browser verification on the Vercel preview.
