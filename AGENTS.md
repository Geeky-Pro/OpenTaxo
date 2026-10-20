# Taxonomy & Catalog Planner — Agent Instructions

## Mandatory Context Loading

**Before making ANY architectural, code, or design decision**, you MUST read every file in the `context/` directory in the following order:

1. `context/project-overview.md` — Vision, personas, user flows, scope boundaries.
2. `context/architecture.md` — Stack, system boundaries, data model, invariants.
3. `context/code-standards.md` — TypeScript conventions, Server Actions vs Route Handlers, RTL-first CSS, component patterns.
4. `context/ui-context.md` — Design tokens, theme system, typography, spacing, component conventions.
5. `context/ai-workflow-rules.md` — Development boundaries, unit discipline, verification protocol.
6. `context/progress-tracker.md` — Current phase, completed work, open questions.

Then, read the relevant spec from `context/specs/` for the unit you are implementing.

## Development Methodology

This project follows **Spec-Driven Development** with a **Six-File Context System**:

- **One unit per prompt.** Never implement features from a future unit.
- **Every unit has a spec.** The spec in `context/specs/` is the single source of truth for that unit's scope.
- **Verify before marking done.** Every spec includes a Verification Checklist that must pass before the unit is considered complete.
- **Update the tracker.** After completing a unit, update `context/progress-tracker.md` to reflect current state.

## Key Architectural Constraints (Quick Reference)

> Current architecture (2026-10-15): Supabase PostgreSQL, Supabase Auth, RLS, and persistent Supabase Storage are deployed. This section supersedes local-only assumptions in historical specs; use the current route map and architecture contract in `context/architecture.md`. See `context/progress-tracker.md` and `context/specs/20-domain-integrity-and-authoring-ux.md`.

- **Shared persistence**: Supabase PostgreSQL is the live source of truth. Legacy JSON files have been removed from the working tree; never add filesystem-backed persistence or JSON/PostgreSQL dual writes.
- **RTL-default**: `dir="rtl"`, `lang="ar"`. Use logical CSS properties (`ms-*`, `me-*`, `start-*`, `end-*`).
- **Mobile-first**: Bottom nav on mobile, top bar on desktop.
- **Tree integrity**: enforce Department → Category → optional Subcategory → Product Type. Product Type is a leaf and the only attribute/schema boundary. Application validation and deferred PostgreSQL triggers enforce new/changed placements; preserve existing legacy mismatches until deliberately reviewed. Prevent cycles and archive governed records.
- **Data access**: Next.js Server Actions/Route Handlers call a server-side repository layer using the signed-in user's Supabase session; PostgreSQL RLS is mandatory. Do not dual-write JSON and Supabase.

## File Structure Convention

The Context directory contains six root context documents and the build plan plus scoped unit specs. The canonical list of specs is the actual directory contents under `context/specs/`; keep links in the build plan aligned with those filenames.

```text
context/
├── project-overview.md
├── architecture.md
├── code-standards.md
├── ui-context.md
├── ai-workflow-rules.md
├── progress-tracker.md
└── specs/
    ├── 00-build-plan.md
    ├── 01–08 historical local-JSON implementation specs
    ├── 09–15 Supabase foundation and cutover specs
    ├── 16–19 storage, operations, domain, and export specs
    └── 20–27 domain review, taxonomy authoring, and central-definition specs
```

## Version Baseline

- Current manifest baseline (2026-10-16): Next.js `16.4.1`, React `19.x`, TypeScript `^6.0.3`, Tailwind CSS `4.x`, and Zod `4.x` (see `package.json` for exact versions).
- Treat `package.json` and `package-lock.json` as authoritative for installed dependency versions. Check compatibility and CI before upgrades; do not describe a research target as an installed version.
- Supabase SSR access uses the official `@supabase/ssr` cookie-based pattern plus `@supabase/supabase-js`, unless the official guidance changes before implementation.

## Non-Negotiable Rules

1. **Never skip context loading.** Every session starts by reading the context files.
2. **Never implement beyond the current unit's spec.** Scope creep is a defect.
3. **Never guess at architecture.** If something isn't covered in context, ask before proceeding.
4. **Always preserve existing documentation.** Comments, docstrings, and context files are first-class artifacts.
