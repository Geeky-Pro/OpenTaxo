# Architecture — Taxonomy & Catalog Planner

> **Current baseline (2026-10-16):** Next.js App Router + TypeScript; Supabase PostgreSQL is the source of truth. Supabase Auth, owner authorization, RLS, and persistent Supabase Storage are part of the current design. Local JSON/filesystem material is historical migration context only.

## Technology stack

Versions below are read from the current `package.json`, not version targets.

| Layer | Current dependency/configuration | Purpose |
| --- | --- | --- |
| Framework | Next.js `16.4.1` | App Router, Server Components, Server Actions, Route Handlers |
| UI | React / React DOM `19.x` | Server and client component rendering |
| Language | TypeScript `^6.0.3` | Strict static typing |
| Styling | Tailwind CSS `4.x` | RTL-first responsive UI and semantic design tokens |
| Database | Supabase PostgreSQL | Authoritative taxonomy and catalog definitions |
| Identity/session | Supabase Auth + `@supabase/ssr` | Cookie-aware server session |
| Database client | `@supabase/supabase-js` | Typed database access |
| Validation | Zod `4.x` | Server/domain input validation |
| Icons | Lucide React | Consistent accessible iconography |
| Fonts | IBM Plex Sans Arabic | Arabic-first UI typography |

Do not upgrade dependencies simply because a newer release exists. Check the actual lockfile, official compatibility, CI, and deployment behavior before changing versions.

## Runtime request and trust boundaries

```text
Browser (RTL Next.js UI)
  ├─ Server Components ── read data ──┐
  ├─ Server Actions ──── mutations ───┤
  └─ Route Handlers ──── HTTP APIs ───┤
                                      ▼
                     lib/data + lib/actions + lib/domain
                                      │
                       session-scoped Supabase client
                                      │
                                      ▼
                       PostgreSQL constraints + RLS
                                      │
                         Supabase Storage for images
```

- Client Components must never hold service-role keys or other privileged secrets.
- The server derives the actor from the verified Supabase session; a user-supplied ID is not proof of identity.
- The explicit application allowlist and RLS protect owner-only authoring. Hiding UI controls is not authorization.
- Validate input in Zod/domain code and enforce critical invariants again in PostgreSQL.
- Keep database calls behind the existing server-side data-access and action modules. Avoid direct table access from client components.
- Do not add filesystem-backed persistence or JSON/PostgreSQL dual writes.

## Current route map

| Route | Responsibility |
| --- | --- |
| `/` | Dashboard and workspace shortcuts |
| `/taxonomy` | Searchable/filterable management list for all taxonomy nodes |
| `/tree` | Hierarchical tree editing and reparenting |
| `/browse/[[...slug]]` | Hierarchy browser using canonical slug paths |
| `/categories/[id]` | Node details and Product Type attribute assignments |
| `/attributes` | Central attribute definitions, aliases, data type/filter compatibility, and dimension assignment |
| `/data-types` | Reference center for system-governed primitive data types and compatible filters |
| `/definitions` | Central definition workspace index |
| `/value-sets` | Reusable enum value sets and values |
| `/measurements` | Physical dimensions and units |
| `/unit-conversions` | Conversion rules and conversion calculator |
| `/api/export` | Owner-authorized enriched catalog JSON export; optional download header |
| `/api/upload` | Owner-authorized image upload to the categories Storage bucket; PNG/JPEG/WebP, maximum 5 MiB |
| `/login`, `/unauthorized` | Authentication and denied-access states |

Image uploads use Supabase Storage. The `categories` bucket is documented as public-read, with owner-authorized writes and PNG/JPEG/WebP restrictions, maximum 5 MiB. Verify current live policy before changing it.

## Domain model and ownership boundaries

- **Taxonomy node:** stable database UUID, optional legacy ID, node type, Arabic/English names, description, slug, parent UUID, image path, sort order, active/archived status, timestamps, and source metadata.
- **Global attribute:** stable UUID/key, Arabic/English names, primitive data type, compatible filter type, optional measurement dimension, lifecycle state, order, and source metadata.
- **Attribute aliases:** searchable alternative names attached to a global attribute.
- **Product Type schema:** schema boundary attached only to an active `product_type` taxonomy node.
- **Product Type attribute assignment:** per-schema configuration including required/filterable flags, display order/group, numeric bounds, optional compatible unit, optional enum value set, and role/configuration. Variant-axis state is represented by the linked `variant_axes` record.
- **Value set/value:** reusable enum option definitions with stable keys, bilingual labels, optional raw value, ordering, and archive lifecycle.
- **Measurement dimension/unit:** physical dimension and its units. A unit uses `base = value * multiplier + offset`; commercial selling units are a separate concept.
- **Conversion rule:** explicit source/target unit conversion; physical rules must be consistent with canonical unit factors unless an explicitly linked compatible selling-unit definition justifies custom coefficients.
- **Authorization:** owner allowlist plus RLS. The initial product is single-owner, not general multi-tenant/RBAC.

## Non-negotiable domain invariants

### Taxonomy hierarchy

```text
Department
└── Category
    ├── Subcategory (optional)
    │   └── Product Type
    └── Product Type
```

- Root nodes are Departments.
- Department → Category.
- Category → Subcategory or Product Type.
- Subcategory → Product Type.
- Product Type is a leaf and the only attribute-schema boundary.
- Prevent cycles and invalid reparenting in the UI/domain layer and PostgreSQL.
- Preserve existing legacy parent/type mismatches until explicitly reviewed; do not silently reclassify existing rows. Enforce rules on new or changed relationships.

### Identity, paths, and ordering

- UUIDs and foreign keys are the stable identity/relationship contract.
- Slugs are readable route/search keys, not foreign keys. Active taxonomy slugs are globally unique to match the current browse resolver.
- Node level/depth and full path are derived from the parent chain; do not maintain a manually editable level that can drift.
- Sort order is explicit metadata; list and tree order must remain deterministic.

### Attribute compatibility

The primitive types are system-governed: `string`, `number`, `boolean`, and `enum`. Filter behavior is separate from primitive data type.

- `number` supports numeric bounds and may reference a physical measurement dimension.
- A Product Type unit must be active and match the attribute's dimension.
- Value sets are for `enum` attributes only; attribute-specific sets must match the assigned attribute.
- Numeric bounds must be finite and `min_value <= max_value`.
- Variant axes must remain synchronized with the Product Type assignment.
- Enforce new/changed definitions in UI/domain validation and PostgreSQL; preserve untouched legacy mismatches rather than bulk-rewriting them.

### Safe lifecycle and persistence

- Archive referenced taxonomy and definition records instead of hard-deleting them.
- Block archive/reassignment while active references make the operation invalid.
- Do not reset or reseed the existing catalog as part of feature work.
- Every schema change is an additive, reviewed migration unless a separately approved migration plan states otherwise.
- Keep migration files aligned with applied Supabase migration history; investigate the documented duplicate Storage migration history before altering it.

## Legacy JSON model (historical only)

Units 01–08 originally used `data/categories.json`, `data/attributes.json`, and atomic filesystem writes. Those files and the filesystem I/O helper are no longer part of the working tree/runtime after the Supabase cutover. The old model and write protocol remain in Git history and older unit specs only to explain how the application evolved.

Do not copy old `readCategories()/writeCategories()`, cascade-delete, or JSON dual-write examples into new features. The relational model and current server-side data-access modules are authoritative.

## Explicit scope boundaries

This planner manages the shared YCP taxonomy and reusable catalog definitions. It is not a storefront or operational commerce backend.

Do not add merchant onboarding/tenant ownership, Merchant Product records, operational Variant records, Merchant Offers, Branch Listings, payment/checkout, orders, stock/inventory, or pricing operations without a separately approved YCP requirement. Canonical Product remains optional/later and is not a prerequisite for taxonomy or Product Type authoring.
