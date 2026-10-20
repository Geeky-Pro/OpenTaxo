# Build Plan — Taxonomy & Catalog Planner

> The original Units 01–08 describe the completed local-JSON implementation. Architecture transition approved 2026-10-15: future units below supersede local-only assumptions. Do not retroactively reinterpret completed units as Supabase-backed.

> This document decomposes the entire project into sequential, scoped, verifiable units.
> Each unit has a dedicated spec file in `context/specs/`.
> Units are implemented **one at a time, in order**.

---

## Unit 01: Project Setup, Schemas, and Atomic Filesystem Data Layer

**Spec**: `context/specs/01-project-setup-and-data-layer.md`

**Scope**:

- Initialize the original Next.js project with TypeScript, Tailwind CSS, and App Router (historical implementation; version target is governed by `13-platform-version-policy.md`).
- Install core dependencies (Zod, nanoid, Shadcn UI setup).
- Define Zod schemas and TypeScript types for `Category`, `Attribute`, `CategoryAttribute`, `ActionResult`.
- Create `data/` directory with seed JSON files (`categories.json`, `attributes.json`).
- Implement atomic JSON read/write utilities (`lib/data/io.ts`).
- Implement domain-specific data access functions (`lib/data/categories.ts`, `lib/data/attributes.ts`).
- Implement slug generation utility with collision handling.
- Implement ID generation utility.
- Set up root layout with RTL, Arabic font, and basic theme structure.

**Verification**: TypeScript compiles, seed files exist, atomic read/write round-trips successfully, slug collision handling works.

---

## Unit 02: Global Attribute Library CRUD & UI (`/attributes`)

**Spec**: `context/specs/02-global-attribute-library.md`

**Scope**:

- Server Actions: `createAttribute`, `updateAttribute`, `deleteAttribute`.
- Attribute deletion cascades to purge references from all categories.
- UI: `/attributes` page with searchable list, add/edit form, delete confirmation.
- Responsive layout: card list on mobile, table on desktop.

**Verification**: Full CRUD works end-to-end. Deleting an attribute removes it from all category bindings. Form validation rejects invalid `filter_type` values.

---

## Unit 03: Core Tree Utilities

**Spec**: `context/specs/03-core-tree-utilities.md`

**Scope**:

- `flatToTree()`: Converts flat `Category[]` to nested `TreeNode[]` structure.
- `getDescendants(categoryId)`: Returns all descendant IDs recursively.
- `getDisqualifiedParents(categoryId)`: Returns the set of IDs that cannot be parents (Subtree Disqualification Rule).
- `getBreadcrumbs(categoryId)`: Returns ordered array of ancestor categories from root to target.
- `getSubtree(categoryId)`: Returns the isolated subtree for Focus Mode.
- Pure functions with comprehensive unit tests (optional but recommended).

**Verification**: Correct output for trees with 0, 1, and 3+ depth levels. Disqualification correctly includes self, all descendants, and current parent. Breadcrumbs return correct ancestor chain.

---

## Unit 04: Mobile-First Collapsible Tree View with Focus Mode (`/`)

**Spec**: `context/specs/04-mobile-first-tree-view.md`

**Scope**:

- Server-side data loading on the root page (`/`).
- `<TreeView>` component: renders the full category tree with collapsible nodes.
- `<TreeNode>` component: individual node with expand/collapse, icon, label, actions menu.
- Focus / Isolate Mode: click "Focus" on a node to show only its subtree.
- `<TreeFocusBreadcrumbs>`: breadcrumb navigation while in Focus Mode.
- Proper RTL indentation using logical properties.
- Mobile-optimized: touch targets ≥ 44px, bottom nav placeholder.

**Verification**: Tree renders correctly with sample data. Collapse/expand works. Focus Mode isolates the correct subtree. Breadcrumbs navigate correctly. Layout works on 360px viewport.

---

## Unit 05: Quick Edit Bottom Sheet (Vaul Drawer) & Reparenting Modal

**Spec**: `context/specs/05-quick-edit-drawer-and-mutations.md`

**Scope**:

- Server Actions: `createCategory`, `updateCategory`, `deleteCategory`, `reparentCategory`.
- `<CategoryDrawer>`: Vaul bottom sheet for quick edits (name_ar, name_en, slug, parent_id).
- Reparenting UI: parent selector that disables disqualified options (uses Unit 03 utilities).
- Cascade delete: confirmation modal showing descendant count before deletion.
- Add new category: "+" button opens drawer in create mode.
- Slug auto-generation from `name_ar` with collision detection.

**Verification**: Create, edit, delete, and reparent all work. Circular reparenting is blocked client-side and server-side. Cascade delete removes all descendants. Slug collisions handled.

---

## Unit 06: Dedicated Category Edit Page (`/categories/[id]`)

**Spec**: `context/specs/06-category-details-and-attribute-mapping.md`

**Scope**:

- Full page route for comprehensive category editing.
- Image upload: file picker → resize to WebP → save to `public/categories/` → update `category.image`.
- Attribute binding: select from global attribute library, configure `allowed_values` and `is_variant`.
- Attribute list: show bound attributes with edit/remove actions.
- Navigation: back to tree view, breadcrumb context.

**Verification**: Image upload persists and displays. Attributes can be bound, configured, and removed. Page loads correctly for existing categories. 404 for invalid IDs.

---

## Unit 07: Live Search & Spotlight Palette (Cmdk)

**Spec**: `context/specs/07-live-search-and-spotlight-palette.md`

**Scope**:

- `<CommandPalette>`: Cmdk-based search palette triggered by Cmd+K / Ctrl+K or a search button.
- Searches across category names (Arabic + English) and attribute names.
- Results grouped by type (categories, attributes).
- Selecting a category scrolls/navigates to it in the tree (or opens its edit page).
- Selecting an attribute navigates to `/attributes` with that item highlighted.

**Verification**: Search finds results by partial Arabic and English text. Keyboard navigation works. Selection navigates correctly. Empty states handled.

---

## Unit 08: Enriched JSON Export API and Clean UI Actions

**Spec**: `context/specs/08-enriched-json-export-and-ui.md`

**Scope**:

- `GET /api/export` Route Handler.
- Generates Enriched Flat JSON: each category includes `materialized_path`, `depth`, `resolved_attributes`.
- `resolved_attributes` joins category attribute bindings with the full attribute definitions.
- UI: Export button in the top bar / bottom nav triggers download.
- Clean-up pass: ensure all UI polish, loading states, error boundaries, and empty states are complete.

**Verification**: Export output matches the `EnrichedCategory` schema. Materialized paths are correct for all depths. Attributes are fully resolved. File downloads in the browser.

---

## Supabase Implementation Units — Current Status (reconciled 2026-10-16)

The original local-JSON Units 01–08 remain historical completed work. The following status supersedes the earlier proposal-only wording. The owner does not require a full legacy data import; taxonomy and attributes can be authored afresh in the application. Do not dual-write JSON and Supabase.

### Unit 09 — Supabase Foundation Audit
**Spec:** `context/specs/09-supabase-foundation-audit.md`  
**Status:** Completed as the architecture and repository baseline.

### Unit 10 — Domain ERD and Relational Schema
**Spec:** `context/specs/10-domain-database-schema.md`  
**Status:** Initial schema deployed. Continue reviewing hierarchy rules, slug policy, value-set ownership, and archive/reference integrity. Avoid adding restrictive constraints until decisions are reviewed.

### Unit 11 — Auth, Session, and RLS
**Spec:** `context/specs/11-auth-and-rls-security.md`  
**Status:** Application Auth foundation and owner allowlist/RLS are merged. Database verification confirms all 15 public tables have RLS enabled and an active allowlisted Auth user exists. Browser-level owner sign-in and denial scenarios remain unverified. Confirm public sign-up is disabled and enable leaked-password protection in Supabase Dashboard.

### Unit 12 — Legacy JSON and Cutover Decision
**Spec:** `context/specs/12-json-to-supabase-migration.md`  
**Status:** Full legacy import/reconciliation is not a completion requirement. Keep JSON as reference/rollback material only; do not dual-write and do not delete legacy seed rows without explicit approval.

### Unit 13 — Supabase Relational Foundation
**Status:** Deployed to project `jbzpjvnbektpsjinptto`. Tables include taxonomy nodes, attributes, Product Type schemas and assignments, aliases, controlled values, measurement dimensions/units, selling units, conversion rules, variant axes/constraints, and the owner allowlist. Initial seed rows may remain; the owner will create new content through the app.

### Unit 14 — Next.js Supabase Auth and Owner Authorization
**Status:** Merged to `main`. Uses email/password and an explicit owner allowlist. Verify sign-in/sign-out and denied access through the deployed application; credentials must never be placed in source control or project documentation.

### Unit 15 — Supabase Repository / Data-Access Cutover
**Status:** Merged to `main`. Application reads/writes through Supabase-backed data-access functions; no JSON/PostgreSQL dual writes. Run one focused authenticated CRUD smoke check rather than expanding into a long test suite.

### Unit 16 — Persistent Category Image Storage
**Spec:** `context/specs/16-persistent-category-image-storage.md`  
**Status:** Implemented; bucket and policies were verified in the recorded audit. Recheck live policies and current deployment before storage changes.

### Unit 17 — Operational Readiness and Migration-History Reconciliation
**Spec:** `context/specs/17-operational-readiness-and-migration-history.md`  
**Status:** Partially verified. Owner sign-in/category creation are confirmed; migration-history duplication is documented. Public sign-up, leaked-password protection, denied-user scenarios, and current deployment verification remain open.

### Unit 18 — Domain Integrity and Authoring UX
**Spec:** `context/specs/18-domain-integrity-and-authoring-ux.md`  
**Status:** Merged in PR #7. Hierarchy and Product Type constraints, canonical global slugs, attribute search/filter, clearer deletion errors, and safe repository cleanup are implemented. Unit 20 records the subsequent domain review; Units 24–27 implement central compatibility and measurement/conversion rules. Do not introduce merchant products, offers, listings, or operational inventory into this tool.

### Unit 19 — Export Contract and YCP Interoperability
**Spec:** `context/specs/19-export-contract-and-ycp-interoperability.md`  
**Status:** Planned, not implemented as a new contract. Review the existing `/api/export` payload, consumer expectations, stable IDs, Product Type assignments, variant-axis metadata, and archive treatment before expanding it.

### Unit 20 — Domain Integrity and Authoring UX Review Record
**Spec:** `context/specs/20-domain-integrity-and-authoring-ux.md`  
**Status:** Review record is merged and aligned with the domain safeguards. Preserve legacy exceptions and use this record as context for follow-up compatibility work.

### Units 21–27 — Taxonomy Authoring and Central Definitions

These units are merged into `main`; implementation/CI status is distinct from remaining browser and security verification.

- **Unit 21 — Taxonomy Node Management Foundation:** `context/specs/21-taxonomy-node-management-foundation.md`; merged PR #9. Adds description metadata through an additive migration and updates the taxonomy snapshot RPC.
- **Unit 22 — Product Type Attribute Editor:** `context/specs/22-product-type-attribute-editor.md`; merged PR #11. Saves per-Product-Type assignments through a dedicated owner-authorized RPC.
- **Unit 23 — Dashboard and Taxonomy Management Workspace:** `context/specs/23-dashboard-and-taxonomy-management-workspace.md`; merged PR #13. Adds dashboard shortcuts and searchable/type-filtered node management.
- **Unit 24 — Central Attribute and Data Type Centers:** `context/specs/24-central-attribute-and-data-type-centers.md`; merged PR #14. Defines reusable attributes/aliases and system-governed primitive data types.
- **Unit 25 — Central Value Sets:** `context/specs/25-central-value-sets.md`; merged PR #15. Manages reusable enum sets/values.
- **Unit 26 — Measurement Dimensions and Units:** `context/specs/26-measurement-dimensions-and-units.md`; merged PR #15. Manages physical dimensions, units, and safe base-unit rebasing.
- **Unit 27 — Conversion Rules and Compatibility:** `context/specs/27-conversion-rules-and-compatibility.md`; merged PR #15. Enforces dimension-compatible conversion rules and formulas.

## Dependency Graph

```text
Unit 01 (Foundation)
  ├── Unit 02 (Attributes)
  ├── Unit 03 (Tree Utilities)
  │     ├── Unit 04 (Tree View)
  │     │     ├── Unit 05 (Quick Edit + Reparent)
  │     │     ├── Unit 07 (Search)
  │     │     └── Unit 06 (Category Edit Page) ← also depends on Unit 02
  │     └── Unit 08 (Export) ← also depends on Units 01, 02
  └── Unit 08 (Export)
```

Current authoring dependency sequence:

```text
Unit 20 (domain invariants)
  └── Unit 21 (node metadata)
       ├── Unit 22 (Product Type assignments)
       └── Unit 23 (dashboard + taxonomy workspace)
Unit 21 + Unit 22
  └── Unit 24 (central attributes + data types)
       ├── Unit 25 (value sets)
       └── Unit 26 (dimensions + units)
Unit 25 + Unit 26
  └── Unit 27 (conversion rules + compatibility)
```

Units 25 and 26 are parallelizable after Unit 24 in code terms; Unit 27 depends on the unit registry and its integrity rules.

## Summary

| Unit | Name | Status |
| ------ | ------ | ------ |
| 01–08 | Original taxonomy/attribute UI and local-JSON foundation | Completed historical baseline |
| 09 | Supabase foundation audit | Completed |
| 10 | Domain ERD and relational schema | Deployed; domain review ongoing |
| 11 | Auth, session, and RLS | Foundation merged; live Auth settings/smoke check pending |
| 12 | Legacy JSON cutover decision | Full import not required; no dual-write |
| 13 | Supabase relational foundation | Deployed |
| 14 | Auth and owner authorization | Merged; runtime verification pending |
| 15 | Supabase data access | Merged |
| 16 | Persistent image storage | Deployed; bucket/policies verified |
| 17 | Operational readiness and migration history | Owner sign-in/create verified; Auth safety settings pending |
| 18 | Domain integrity and authoring UX | Merged/deployed; owner visual verification pending |
| 19 | Export contract and YCP interoperability | Later |
| 20 | Domain integrity and authoring UX review record | Merged; legacy exceptions documented |
| 21 | Taxonomy node management foundation | Merged; browser verification pending |
| 22 | Product Type attribute editor | Merged; browser verification pending |
| 23 | Dashboard and taxonomy management workspace | Merged; main regression verification pending |
| 24 | Central attribute and data-type centers | Merged; browser verification pending |
| 25 | Central value sets | Merged; DB smoke tests/CI passed; browser verification pending |
| 26 | Measurement dimensions and units | Merged; DB smoke tests/CI passed; browser verification pending |
| 27 | Conversion rules and compatibility | Merged; formula smoke tests/CI passed; browser verification pending |
