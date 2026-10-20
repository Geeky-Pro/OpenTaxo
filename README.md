# OpenTaxo

**Open Catalog Intelligence & PIM**

OpenTaxo is an open-source workspace for modeling product taxonomies, reusable attributes, and Product Type schemas. It helps catalog teams define consistent product data structures and export enriched taxonomy data for downstream commerce systems.

> **Project status:** OpenTaxo is being generalized from a taxonomy and catalog-definition tool originally built for the Yemen Commerce Platform (YCP). The current application focuses on taxonomy authoring and schema management. AI-assisted classification, automatic attribute extraction from product names, bulk catalog enrichment, and general multi-tenant workspaces are roadmap items—not current capabilities.

## Why OpenTaxo?

Product catalogs become difficult to search, filter, compare, and maintain when categories and specifications are inconsistent. OpenTaxo provides a central place to define the structure and reusable vocabulary that downstream commerce applications can consume.

The project is designed to keep **catalog definitions** separate from **operational commerce data**. OpenTaxo does not currently manage merchant offers, prices, stock, orders, checkout, or storefront operations.

## Current capabilities

- **Hierarchical taxonomy management** — organize Departments, Categories, optional Subcategories, and Product Types.
- **Taxonomy authoring and navigation** — browse and edit nodes, manage parent relationships, and validate supported hierarchy rules.
- **Central attribute library** — maintain reusable attribute definitions, bilingual names, aliases, data types, and compatible filter behavior.
- **Product Type schemas** — assign attributes to Product Types and configure required/filterable behavior, display order and groups, variant-axis settings, numeric bounds, compatible measurement units, and enum value sets.
- **Reusable value sets** — define and manage shared enumerated values.
- **Measurements and conversions** — manage physical dimensions, units, and conversion rules.
- **Persistent category images** — upload supported image formats to Supabase Storage.
- **Enriched JSON export** — export taxonomy nodes with paths, breadcrumbs, depth, and resolved attribute metadata for downstream integrations.
- **Arabic-first interface** — RTL-oriented authoring with support for English names.
- **Authentication and data safeguards** — Supabase Auth, an application-level owner authorization gate, PostgreSQL constraints, and Row Level Security (RLS).

See [Architecture](context/architecture.md), [Project Overview](context/project-overview.md), and the [Progress Tracker](context/progress-tracker.md) for implementation details and known verification gaps.

## Current scope and limitations

OpenTaxo is **not yet a general-purpose, multi-tenant PIM platform**. The current implementation uses a single-owner authorization model, and the application is still being separated from YCP-specific assumptions.

The following are planned, not implemented as end-to-end product features:

- Importing product catalogs from CSV, Excel, or arbitrary JSON files.
- Automatically extracting attributes from product names and descriptions.
- Rule-based or AI-assisted product-type classification and attribute suggestions.
- A human review queue with confidence, evidence, approval, and audit history.
- General-purpose, versioned integration APIs and adapters beyond the current enriched JSON export.
- Multi-tenant workspaces, organization membership, and role-based access control.

AI-generated suggestions, when introduced, should remain reviewable and must not silently create or remap canonical catalog definitions.

## Technology stack

- [Next.js](https://nextjs.org/) App Router
- [React](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) — PostgreSQL, Auth, and Storage
- [Zod](https://zod.dev/) — input and domain validation

The exact dependency versions are defined in `package.json` and `package-lock.json`.

## Getting started

### Prerequisites

- Node.js compatible with the installed Next.js version (Node.js 20.9 or newer is the documented minimum for Next.js 16; use a supported current LTS release).
- npm
- A Supabase project with the required database schema, migrations, Auth configuration, and Storage bucket/policies.

### 1. Clone the repository

```bash
git clone https://github.com/Geeky-Pro/OpenTaxo.git
cd OpenTaxo
npm install
```

### 2. Configure environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env.local
```

Set the values in `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Use the publishable key intended for browser applications. **Never put a Supabase service-role key or other privileged secret in a `NEXT_PUBLIC_*` variable, commit it, or expose it to the browser.** Do not use a production database for local experiments unless you understand the consequences.

### 3. Prepare Supabase

Review the SQL migrations in the `supabase/` directory and the security/authorization requirements in [Architecture](context/architecture.md) before applying anything. Apply migrations in the intended order and verify the Auth allowlist, RLS policies, and Storage policies for your own environment. Do not assume that copying the repository automatically provisions a working Supabase backend.

The current application is configured around an authorized owner account; it is not an open self-service signup or multi-tenant deployment template.

### 4. Run the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Available project scripts:

```bash
npm run dev
npm run lint
npm run build
npm run start
```

The commands are provided by the current package configuration. A successful build or lint run does not replace browser-level verification or a review of the live Supabase security settings.

## Main application areas

| Route | Purpose |
| --- | --- |
| `/` | Dashboard and workspace shortcuts |
| `/taxonomy` | Taxonomy management list |
| `/tree` | Hierarchical tree editing |
| `/browse/[[...slug]]` | Browse the taxonomy hierarchy |
| `/categories/[id]` | Taxonomy node details and Product Type attribute assignments |
| `/attributes` | Central attribute definitions and aliases |
| `/data-types` | Primitive data types and compatible filter behaviors |
| `/definitions` | Central definitions workspace |
| `/value-sets` | Reusable enum value sets |
| `/measurements` | Physical dimensions and units |
| `/unit-conversions` | Conversion rules and calculator |
| `/api/export` | Owner-authorized enriched JSON export |
| `/api/upload` | Owner-authorized category image upload |

Routes and behavior may evolve as the project is generalized. The application requires valid environment configuration and an authorized session for protected functionality.

## Export and integration

The current enriched JSON export is designed to provide downstream systems with resolved taxonomy paths, breadcrumbs, depth, and attribute definitions without requiring those systems to reconstruct the hierarchy from the authoring database.

The existing contract was originally designed for YCP. Review [the enriched JSON schema and YCP interoperability contract](docs/en/api-contracts/enriched-json-schema.md) before building a consumer. A stable, versioned, platform-neutral public API and additional adapters are planned work.

## Roadmap

1. **Generalize the foundation** — remove product-specific assumptions from the core domain and document stable, platform-neutral contracts.
2. **Catalog import** — validate CSV, Excel, and JSON input and provide actionable import errors.
3. **Rule-based enrichment** — extract measurable values, units, colors, sizes, model numbers, and other attributes with explicit parsing rules.
4. **Classification suggestions** — recommend Product Types and attribute mappings using explainable rules, with optional AI providers.
5. **Human review and auditability** — preserve source text, proposed values, evidence, confidence methodology, reviewer decisions, and history.
6. **Integration layer** — version export/API contracts and build YCP and other platform adapters.
7. **Multi-tenant readiness** — only after a dedicated design for workspace isolation, authorization, and RLS.

## Development notes

This repository uses a spec-driven workflow. Before changing architecture or domain behavior, read [AGENTS.md](AGENTS.md) and the context documents in `context/`. The [Progress Tracker](context/progress-tracker.md) records implementation state and remaining verification.

Known verification gaps are documented in the project context, including browser-level checks for some recently merged authoring flows and confirmation of certain live Supabase Auth security settings. Please do not interpret a merged feature or passing CI as proof that every deployed flow has been manually verified.

## Contributing

Contributions and issue reports are welcome. Before opening a pull request:

1. Read [AGENTS.md](AGENTS.md) and the relevant context/specification files.
2. Keep changes focused and consistent with the current architecture.
3. Do not introduce secrets, production data, unreviewed migrations, or filesystem/database dual-write behavior.
4. Run the relevant checks, such as `npm run lint` and `npm run build`, and report any checks that could not be run.
5. Clearly distinguish implemented behavior from proposed roadmap work.

Please open an issue to discuss substantial architectural changes before starting implementation.

## License

OpenTaxo is distributed under the [MIT License](LICENSE). Review third-party dependency and asset licenses separately.
