# Unit 26 — Measurement Dimensions and Units

> Status: Merged in PR #15. Database smoke tests and main-branch CI passed; browser CRUD/rebase/archive verification remains pending.

## Purpose

Create one canonical registry of physical dimensions and their measurement units. Numeric attributes reference a dimension; Product Type assignments select only active units from that dimension.

## Scope

- Manage dimensions with stable keys, Arabic/English names, and active/archived status.
- Manage units with stable keys, names, symbols, base multiplier and offset.
- Use the equation `base = value * multiplier + offset`.
- Require exactly one active base unit per configured dimension when units exist.
- Permit changing the base unit only through a transactional rebase that recalculates active unit factors.
- Keep commercial selling-unit definitions distinct from physical measurement units.

## Integrity rules

- An active unit must belong to an active dimension.
- A base unit has multiplier 1 and offset 0.
- At most one active base unit exists per dimension.
- A dimension cannot be archived while active units, numeric attributes, or active selling-unit definitions still reference it.
- A unit cannot be archived while an active Product Type binding or active conversion rule references it.
- A base unit cannot be archived while other active units remain; choose another base first.
- Units cannot be moved to a different dimension after creation; create a new unit and retire the old one.
- Product Type assignment verifies unit dimension matches the numeric attribute's dimension.

## Acceptance

- [x] Arabic RTL dimensions/units management and archive/restore flows.
- [x] Base-unit factors are enforced in PostgreSQL, including a deferred invariant requiring exactly one active base whenever a dimension has active units.
- [x] Base-unit changes recalculate active and archived unit factors transactionally; archived units retain correct conversions when restored.
- [x] Archive guards preserve referenced definitions and prevent restoring active non-base units without an active base.
- [x] Product Type editor filters units by the attribute dimension.
- [x] TypeScript, targeted lint, domain smoke checks, and production build pass in CI.
- [ ] Owner browser verification on the Vercel preview.
