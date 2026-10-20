# Unit 12 — JSON-to-Supabase Migration Plan

> Status: **Historical plan — superseded by the completed Supabase cutover (2026-10-15).** Supabase is the live source of truth; the owner chose to create taxonomy content through the app rather than require a full legacy import. The unused JSON files were removed from the working tree after cutover; their prior contents remain recoverable through Git history. No JSON/PostgreSQL dual-write exists.

## 1. Goal

Historical goal at the time of planning: move local-first authoring data to Supabase while preserving identifiers and YCP domain invariants. This cutover has since been implemented; PostgreSQL is now authoritative.

## 2. Non-negotiable migration rules

- Do not dual-write to JSON and Supabase.
- Do not silently normalize, delete, or merge ambiguous legacy values.
- Keep a read-only copy of the source JSON and record a checksum before import.
- Preserve existing IDs when valid and collision-free; otherwise create an explicit old-ID-to-new-ID mapping.
- Maintain Arabic labels and optional English labels without using display text as a primary key.
- Preserve raw source values and source provenance when mapping them to canonical taxonomy/attribute values.
- Archive referenced taxonomy records instead of hard-deleting them.
- Validate the hierarchy and Product Type boundary before accepting rows.
- Do not migrate category images in the database-data migration; handle binary storage separately after an approved plan.
- Import/export must remain explicit workflows, with a report and a way to detect partial failure.

## 3. Observed source characteristics to account for

The current source files are:
- `data/categories.json`
- `data/attributes.json`

The repository's Zod types define category node types (`department`, `category`, `subcategory`, `product_type`) and attribute data types (`number`, `enum`, `string`, `boolean`). Current category records embed attribute bindings, allowed values, and variant flags.

The sample JSON has potential data-quality issues that require profiling rather than automatic correction:
- Some slugs include spaces or uppercase characters.
- Seed/example category labels and their parent classification may be semantically inconsistent.
- Some records contain optional/null fields in varied shapes.
- Attribute metadata and embedded category bindings need normalization into separate relational records.

This is a warning to validate the data, not permission to rewrite it.

## 4. Proposed phases

### Phase A — Read-only profiling

Build a report (no database writes) containing:
- total rows per file;
- duplicate IDs and duplicate slugs under the proposed uniqueness rule;
- missing/blank Arabic labels;
- invalid or missing node types;
- orphaned `parent_id` references and hierarchy type violations;
- cycles in the category tree;
- invalid/duplicate attribute IDs and keys;
- category bindings referencing missing attributes;
- malformed allowed values and conflicting variant settings;
- nonconforming slugs;
- image paths that do not resolve to files;
- values that require human classification or alias mapping.

Each finding should include file, row ID, field, reason, and proposed disposition (accept, map, archive, or needs-owner-decision). No silent edits.

### Phase B — Schema and mapping approval

- Approve the ERD in `10-domain-database-schema.md`.
- Approve Auth/RLS model in `11-auth-and-rls-security.md`.
- Finalize source-to-target mapping, including embedded category bindings to `product_type_attributes` and variant-axis records.
- Confirm slug uniqueness and value-set ownership rules.
- Decide which sample records are real taxonomy and which are test/example data.

### Phase C — Versioned migrations

- Add SQL migration files under `supabase/migrations/` only in a later approved implementation phase.
- Use ordered timestamped migration filenames and review SQL diffs before applying them.
- First migration should establish only the approved foundation tables, constraints, indexes, and RLS defaults.
- Seed/reference data must be deterministic and idempotent where practical.
- Never treat a dashboard-only manual schema change as the canonical schema source; committed migrations should describe the intended database state.
- Do not create tables during this planning phase.

### Phase D — Dry-run import

- Run source validation and transformation without committing writes.
- Produce counts and a detailed reject/warning report.
- Check foreign-key mappings, row counts, slug uniqueness, taxonomy tree integrity, attribute bindings, unit dimensions, and variant axes.
- Review all ambiguous mappings manually.

### Phase E — Controlled import and reconciliation

Only after explicit approval:
1. Freeze authoring writes to JSON for the cutover window.
2. Take a versioned backup and checksum of source files.
3. Apply reviewed migrations to a non-production/test environment first.
4. Import within a transaction or bounded idempotent batches with an import ledger.
5. Reconcile source counts, IDs, relationships, and critical domain invariants.
6. Switch reads and writes to Supabase in one approved cutover.
7. Retain the original JSON snapshot as a read-only rollback artifact; do not resume dual-write.
8. Roll back to the previous application/data snapshot if reconciliation fails.

## 5. Export contract

The current `GET /api/export` endpoint produces enriched flat JSON from local data. After migration, define an explicit export contract:
- stable identifiers and documented field names;
- deterministic ordering;
- materialized taxonomy path;
- resolved Product Type schema and attributes;
- explicit variant-axis metadata;
- clear treatment of archived records;
- a format identifier/version in the exported document if compatibility requires it.

A document-level export format marker is not the same as a standalone database schema-version entity/table. Preserve compatibility with downstream YCP consumers or deliberately announce a breaking change.

## 6. Rollback and reconciliation

Minimum reconciliation:
- source/target counts by entity;
- every source ID mapped to a target ID;
- no orphaned foreign keys;
- no cycles or illegal parent-child node combinations;
- all Product Type attribute bindings reference existing attributes;
- variant axes reference eligible Product Type attributes;
- unit conversions stay within compatible dimensions;
- archive status and provenance preserved;
- export output compared against approved fixtures.

Rollback triggers include unexplained count differences, missing references, authorization leaks, data loss, or non-deterministic exports. The rollback plan must be tested before production cutover.

## 7. Historical acceptance checklist

This checklist described the planning phase and is no longer the current execution status. The schema and Auth/RLS foundation were deployed, the application was cut over to Supabase, and the owner has confirmed successful sign-in and category creation. Remaining runtime verification and domain follow-ups are tracked in `context/progress-tracker.md` and `context/specs/20-domain-integrity-and-authoring-ux.md`.
