# Unit 27 — Conversion Rules and Compatibility

> Status: Merged in PR #15. Conversion-formula/database smoke tests and main-branch CI passed; browser rule/calculator verification remains pending.

## Purpose

Complete conversion integrity so UI choices, server actions, Product Type assignments, and PostgreSQL agree on valid dimensions and conversion formulas.

## Scope

- Show explicit conversion rules between source and target units, with optional commercial selling-unit context.
- Calculate conversions through the database function `convert_measurement_value`, using canonical-base factors.
- Show a conversion calculator for active units and reject incompatible dimensions.
- For general physical conversion rules, store only coefficients consistent with the source/target unit factors.
- Permit custom coefficients only when a selling-unit definition is explicitly linked.
- Keep rule archive/restore behavior safe and prevent duplicate active source/target rules.

## Formula

```text
base = source_value * source_multiplier + source_offset
target_value = (base - target_offset) / target_multiplier
target_value = source_value * multiplier + offset
```

## Integrity rules

- Source and target units must be active and belong to the same physical dimension.
- Multiplier must be positive; offset must be finite.
- General physical rule coefficients must match the derived conversion within numeric tolerance.
- A linked selling-unit definition must be active and dimension-compatible when it declares a dimension.
- Product Type numeric bounds must have min <= max and are stored in the selected unit; the unit must match the attribute dimension.
- Enum value sets may only be assigned to enum attributes; a set bound to another attribute is rejected.
- RLS and the existing authorized-owner allowlist remain in force.

## Acceptance

- [x] Conversion rules center and calculator use the same PostgreSQL conversion function.
- [x] PostgreSQL rejects cross-dimension rules and inconsistent general coefficients.
- [x] Base-unit changes keep the pairwise physical conversion equation invariant.
- [x] A transactional database smoke test verified 250 cm = 2.5 m, base rebasing, and rejection of a cross-dimension conversion.
- [x] A database smoke test verified enum-only set association and case-insensitive value-key uniqueness.
- [x] CI verifies unit conversion math and lints the new center files.
- [ ] Owner browser verification on the Vercel preview.
