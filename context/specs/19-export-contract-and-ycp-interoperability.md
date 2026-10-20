# Unit 19 — Export Contract and YCP Interoperability

> Status: Planned; not implemented as a new versioned contract. Do not expand the current export until this contract is reviewed and accepted.

## Goal

Define a stable, explicit export payload that can be consumed by YCP integration/import tooling without coupling this planner to storefront or operational commerce entities.

## Contract requirements to settle before implementation

- Export stable database UUIDs and legacy IDs where needed for backward compatibility; never use names or slugs as foreign-key substitutes.
- Include node type, parent identity, canonical slug, status, sort order, and a deterministic materialized path/depth derived from the hierarchy.
- For Product Type nodes, include the schema and ordered attribute assignments with canonical attribute key/UUID, data type, filter behavior, role, required/filterable/variant flags, numeric bounds, compatible unit, value-set reference, and relevant assignment configuration.
- Include resolved attribute definitions, aliases only if the consuming contract requires them, and ordered active values for referenced value sets.
- Include variant-axis metadata derived from Product Type assignments.
- Define how archived nodes, archived attributes, archived units, and inactive values are represented or omitted.
- Define stable ordering, nullability, locale fields, and error behavior.
- Decide whether a payload-level format version is needed. Do not introduce a schema-version table/entity without a separate approved architecture decision.
- Document a representative JSON fixture and validate it against a schema before shipping the route.
- Preserve the existing /api/export behavior until a deliberate backward-compatible change or explicit version transition is approved.

## Out of scope

- Merchant products, operational variants, offers, branch listings, inventory, pricing, orders, or payments.
- Canonical Product as an onboarding prerequisite.
- JSON/PostgreSQL dual-write or reintroducing filesystem persistence.
- A database schema-version entity/table without approval.

## Acceptance checklist

- [ ] Owner-approved export schema and consumer expectations are documented.
- [ ] Compatibility impact on the existing /api/export payload is reviewed.
- [ ] Payload includes stable IDs, taxonomy paths, Product Type schema/assignments, variant-axis metadata, and archive treatment.
- [ ] A representative fixture and schema validation tests exist.
- [ ] Export data is read from Supabase-backed repositories only.
- [ ] CI and browser download/copy checks pass before the unit is marked complete.
