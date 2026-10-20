# Project Overview — Taxonomy & Catalog Planner

## Vision

A **shared visual modeling tool** for designing, refining, and structuring YCP's global e-commerce taxonomy, attribute dictionary, Product Type schemas, measurement/selling-unit definitions, and schema-driven variant rules. It remains a planning and authoring tool, not a production storefront.

The current implementation is Next.js App Router + TypeScript with Supabase PostgreSQL, Supabase Auth, RLS, and Supabase Storage. Supabase is the live source of truth. Legacy JSON files and the filesystem I/O helper were removed from the working tree after cutover; Git history retains earlier versions for reference. All current taxonomy, Product Type assignment, value-set, measurement-unit, and conversion work must use the Supabase-backed data-access layer. Never add JSON/PostgreSQL dual writes.

## User Persona

**Primary User**: The platform architect / catalog manager who needs to:

- Design a hierarchical category tree for a multi-vendor e-commerce marketplace.
- Define a global attribute library (e.g., "اللون", "المقاس", "المادة") with typed filter behaviors.
- Bind global attributes to Product Types and mark which assignments drive product variants.
- Visualize, restructure, and validate the taxonomy before committing it to production systems.
- Work primarily in Arabic (RTL), with optional English names for developer reference.

**Governance**: One explicitly approved owner account may sign in and operate the tool initially. Public sign-up is disabled; a valid Supabase Auth session by itself does not authorize access. Supabase Auth establishes identity, while an application-level allowlist/gate and restrictive RLS protect shared global taxonomy data. Roles and granular permissions are a later phase; keep the authorization boundary extensible without implementing full RBAC now.

## User Flows

### Flow 1: Category Tree Construction

1. Open the app at `localhost:3000` → see the full category tree.
2. Add a root-level department (e.g., "إلكترونيات").
3. Add categories under departments, optional subcategories under categories, and Product Types under categories or subcategories.
4. Reorder categories via drag or reparenting modal.
5. Collapse/expand tree branches. Use "Focus Mode" to isolate a subtree on narrow screens.

### Flow 2: Quick Category Edit

1. Tap a category node in the tree view.
2. A Vaul bottom sheet drawer slides up with editable fields: `name_ar`, `name_en`, `slug`, `parent_id`. Relationships use stable `id`/`parent_id` keys; slugs are for readable URLs/search only.
3. Save changes → tree updates in place.

### Flow 3: Comprehensive Category Edit

1. Navigate to `/categories/[id]` for full node details and metadata.
2. Review parent, derived hierarchy level, full path, status, sort order, description, and image.
3. Upload a category image (PNG, JPEG, or WebP; stored persistently in Supabase Storage).
4. Bind attributes only when the node is a Product Type.
5. Configure required/filterable/variant behavior, order/group, numeric bounds, a compatible measurement unit, and an enum value set where applicable.
6. Save and verify persisted values after reload.

### Flow 4: Central Definitions

1. Open `/definitions` to access the central definition workspaces.
2. Manage reusable attribute definitions and aliases at `/attributes`.
3. Review the system-governed primitive data types and compatible filter behaviors at `/data-types`.
4. Manage reusable enum value sets and values at `/value-sets`.
5. Manage physical dimensions/units at `/measurements` and conversion rules/calculator at `/unit-conversions`.
6. Product Type assignments reference these shared definitions; they do not create duplicate global definitions. Referenced records are archived or migrated explicitly rather than silently purged.

### Flow 5: Search & Navigate

1. Trigger Quick Search (Cmd+K or Spotlight button).
2. Type to search across categories and attributes.
3. Select a result → navigate to that item's location in the tree or edit page.

### Flow 6: Export

1. Trigger export from the UI.
2. `GET /api/export` generates an Enriched Flat JSON file with materialized paths and resolved filter properties.
3. Download or copy the output for use in production import scripts.

## In-Scope Features

| # | Feature | Notes |
| --- | --------- | ------- |
| 1 | Hierarchical taxonomy tree | Department → Category → optional Subcategory → Product Type; stable UUID relationships in PostgreSQL |
| 2 | Global attribute library | Typed filters: range, checkbox, select, toggle, color_swatch, button_group |
| 3 | Product Type–attribute binding | Assignments carry required/filterable/variant flags, ordering/group, numeric bounds, compatible unit and enum value-set references; variant axes derive from assignments |
| 4 | Persistent category image upload | PNG/JPEG/WebP in Supabase Storage; 5 MiB limit |
| 5 | Tree visualization | Collapsible, indented, with Focus/Isolate mode |
| 6 | Quick edit drawer | Vaul bottom sheet for inline edits |
| 7 | Full edit page | `/categories/[id]` with image + attribute management |
| 8 | Live search / Spotlight | Cmdk-based palette |
| 9 | Enriched JSON export | Materialized paths, resolved attributes |
| 10 | RTL-first UI | Arabic primary, English optional |
| 11 | Central definition workspaces | Attribute definitions, system data types, value sets, dimensions/units, and conversion rules |
| 12 | Taxonomy management workspace | Search/filter all nodes and open node/Product Type details |
| 11 | Mobile-first responsive | Bottom nav mobile, top bar desktop |
| 12 | Dark/Light theme | System preference with manual toggle |

## Explicit Out-of-Scope Boundaries

The following remain **NOT** part of this tool and must **never** be implemented:

- ❌ Merchant onboarding, merchant-specific taxonomy ownership, or multi-tenant logic without an approved YCP requirement
- ❌ Payment processing, checkout, pricing, stock, orders, or inventory management
- ❌ Merchant Product / operational Variant records, Merchant Offer, or Branch Listing
- ❌ Canonical Product as a prerequisite (optional/later only)
- ❌ Unreviewed schema-version entity/table
- ❌ Real-time collaboration or WebSocket sync
- ❌ GitHub API integration (git is manual via terminal)
- ❌ Internationalization framework (i18n) — Arabic is hardcoded as primary, not a switchable locale
- ❌ Analytics, telemetry, or tracking

## Success Criteria (Verifiable)

1. **Tree Integrity**: No circular references possible. Subtree Disqualification Rule enforced on every reparent operation.
2. **Data Consistency**: Tree hierarchy remains valid. Referenced taxonomy and attributes are archived or explicitly remapped; governed references are not silently purged.
3. **Data Integrity**: PostgreSQL constraints, transactions, domain validation, RLS, and migration reconciliation protect shared data.
4. **Responsive Layout**: Usable on 360px-wide Android screen (Termux) and desktop browser.
5. **RTL Correctness**: All layouts, text alignment, and navigation flow correctly in RTL mode.
6. **Export Accuracy**: Exported JSON contains correct materialized paths and fully resolved attribute objects.
7. **Shared Access**: Authorized sessions access one YCP-owned global taxonomy through Next.js and Supabase.

## Current Workspace Routes (verified 2026-10-16)

- `/` — dashboard and shortcuts to the main workspaces.
- `/taxonomy` — searchable/filterable all-node management list.
- `/tree` — visual hierarchy and reparenting workspace.
- `/browse/[[...slug]]` — browse the taxonomy hierarchy by canonical slug path.
- `/categories/[id]` — node details; Product Type nodes expose attribute assignments.
- `/attributes` and `/data-types` — central attribute definitions and system data-type guidance.
- `/definitions` — index for the central definition workspaces.
- `/value-sets`, `/measurements`, `/unit-conversions` — values, physical units/dimensions, and conversion rules.
- `/login` and `/unauthorized` — authentication and authorization boundaries.

## Architecture Transition (2026-10-15)

The owner approved moving from local JSON to Supabase directly through Next.js with Auth and RLS. The relational cutover, Product Type editor, taxonomy management workspace, central attribute/data-type center, value sets, measurement dimensions/units, and conversion-rule center are merged into `main`. CI passed on main commit `14f70f568544b3de6b12d54ef6da1a90c9c835f8` on 2026-10-16. Browser verification of the newly merged workspaces and confirmation of Supabase Auth security settings remain open; do not infer production readiness from CI alone. All 15 public tables were reported with RLS enabled in the latest documented database audit. Legacy sample rows remain unless the owner explicitly approves a data plan. See `context/progress-tracker.md` for the detailed state.
