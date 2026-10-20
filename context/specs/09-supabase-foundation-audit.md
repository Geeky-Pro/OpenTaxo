# Unit 09 — Supabase Foundation Audit

> Status: **Historical audit completed on 2026-10-15.** This audit captured the pre-cutover state; the Supabase schema, Auth foundation, and application data-access cutover were subsequently implemented in Units 13–15 and later refined in Units 20–27. Use `context/architecture.md` and `context/progress-tracker.md` for current state.
> Scope: baseline findings and architecture decisions at the time of audit.

## 1. Purpose

Prepare the existing Taxonomy & Catalog Planner to move from local JSON persistence to a shared Supabase PostgreSQL database accessed directly by the Next.js server layer, with Supabase Auth and Row Level Security (RLS). The owner has selected email/password sign-in for one explicitly authorized account, with public sign-up disabled; full roles/permissions are deferred. This is a planning artifact for YCP; it is not a production-storefront implementation.

## 2. Verified baseline

Repository: `Geeky-Pro/taxonomy-builder`, branch `main` at audit time.

- `package.json` declares Next.js `^16.3.5`, React `^19.3.0`, and TypeScript `^6.0.3`. Some context docs still describe Next.js 15 and TypeScript 5; reconcile documentation during a later, explicitly approved documentation-alignment unit.
- No Supabase client dependency is declared in `package.json`.
- `lib/data/io.ts` provides JSON read/atomic-write primitives using `node:fs/promises`.
- `lib/data/categories.ts` and `lib/data/attributes.ts` use `data/categories.json` and `data/attributes.json`.
- Category and attribute Server Actions currently read and rewrite whole JSON collections. The attribute-delete action also removes category bindings before deleting the attribute.
- `app/api/export/route.ts` generates an export through the current local-data utility.
- The domain types already distinguish `department`, `category`, `subcategory`, and `product_type`; attribute types include `number`, `enum`, `string`, and `boolean`, with UI filter types.
- Current project instructions explicitly prohibit database integration and authentication. The new direction therefore requires a deliberate superseding decision/spec, not an unannounced implementation.

References:
- [AGENTS.md](../../AGENTS.md)
- [Project overview](../project-overview.md)
- [Architecture](../architecture.md)
- [Category data access](../../lib/data/categories.ts)
- [Attribute data access](../../lib/data/attributes.ts)
- [Current category type](../../lib/types/category.ts)
- [Current attribute type](../../lib/types/attribute.ts)
- [Package manifest](../../package.json)

## 3. Supabase environment baseline

The user-provided project is `jbzpjvnbektpsjinptto` at `https://jbzpjvnbektpsjinptto.supabase.co`.

Read-only inspection on 2026-10-15 found:
- `public` contains zero tables.
- The migration listing is empty.
- No database objects were created or modified during this audit.

Dashboard: https://supabase.com/dashboard/project/jbzpjvnbektpsjinptto

## 4. Target architecture decision

**Selected by the project owner:** use Supabase directly from Next.js, with Auth and RLS.

Proposed request path:

```text
Browser (RTL Next.js UI)
  -> Next.js Server Action / Route Handler
  -> server-side Supabase client using the signed-in user's session
  -> PostgreSQL tables protected by RLS
```

The browser must not receive a service-role secret. Use the public/publishable key only where appropriate; server-side user-scoped access must preserve the user's Auth session so RLS evaluates the actual user. Elevated administrative access is reserved for controlled migration/maintenance workflows, not ordinary UI requests.

## 5. YCP domain boundaries that must remain invariant

1. Global Taxonomy is owned by YCP and is not duplicated per merchant.
2. Taxonomy path: **Department → Category → optional Subcategory → Product Type**.
3. Product Type is the boundary where the product attribute schema is defined.
4. Merchant Product and operational Variant records are not created by Taxonomy Builder.
5. Canonical Product remains optional/later; do not add it as a prerequisite to this database foundation.
6. Do not introduce Merchant Offer or Branch Listing entities in this scope.
7. Variant behavior is schema-driven from Product Type attributes/variant axes; do not model variants as free-form taxonomy nodes.
8. Measurement units and selling/packaging units are separate concepts.
9. Use soft archive for referenced taxonomy records; do not hard-delete records that have dependent references.
10. Preserve traceability of imported/raw source values when normalization or mapping occurs.
11. Do not introduce a standalone schema-version entity/table at the outset unless a reviewed requirement demonstrates the need.

## 6. Findings and risks to address before implementation

| Finding | Risk | Required response |
|---|---|---|
| Existing actions perform whole-file read/modify/write cycles | Concurrent updates can overwrite one another once multiple sessions share storage | Replace with row-level database operations and transactional constraints in a later implementation unit |
| Existing delete logic purges references | Hard deletion conflicts with long-term taxonomy governance and traceability | Design archive/deactivate behavior and explicit reference constraints |
| Existing JSON is the current source of truth | A premature dual-write path could diverge silently | Choose a controlled cutover; never dual-write JSON and PostgreSQL |
| Project docs forbid Auth/database integration | Old instructions could cause future agents to undo the approved direction | Supersede them through reviewed specs before code changes |
| Current seed data contains legacy shape variations and questionable taxonomy examples | Naive bulk import can preserve invalid slugs, ambiguous classifications, or type mismatches | Profile, validate, and report data before any import; do not auto-correct silently |
| Category bindings embed allowed values and a variant flag | This mixes taxonomy bindings, attribute definitions, values, and variant policy | Normalize into separate relationships while preserving export compatibility |
| Current category images are stored under `public/categories/` | Database migration alone does not move or govern binary assets | Keep image storage migration out of the initial database foundation; specify separately if needed |

## 7. Out of scope for this unit

- No Supabase table, policy, function, trigger, bucket, or migration creation.
- No app code, dependencies, environment files, or JSON changes.
- No data import, cleanup, or deletion.
- No Auth provider setup or production deployment.
- No canonical-product, merchant-product, offer, branch-listing, or inventory domain.
- No claim that RLS or the application is production-ready until later verification.

## 8. Acceptance checklist

- [x] Repository persistence paths and current stack inspected.
- [x] Supabase table/migration state checked read-only.
- [x] YCP boundaries captured as explicit invariants.
- [x] Risks and scope boundaries documented.
- [ ] Owner reviews the proposed ERD and migration sequence.
- [ ] Owner explicitly approves a later implementation unit before any database or app changes.
