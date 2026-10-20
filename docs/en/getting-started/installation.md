---
id: installation
title: Installation & Environment Setup
sidebar_position: 1
---

# Installation & Environment Setup

This guide walks you through setting up the **Taxonomy & Catalog Planner** development and production environments, configuring Supabase PostgreSQL, and managing environment variables.

---

## 1. Prerequisites

Ensure your development environment meets the following requirements:

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Package Manager**: `npm` (v10+ recommended)
- **Git**: For version control
- **Supabase CLI** (optional, for local migration testing): `v1.x+`
- **Modern Web Browser**: Chrome, Edge, Safari, or Firefox with RTL support

---

## 2. Repository Cloning & Dependency Installation

Clone the repository and install dependencies using `npm`:

```bash
# Clone the repository
git clone https://github.com/Geeky-Pro/taxonomy-builder.git
cd taxonomy-builder

# Install dependencies (respecting package-lock.json)
npm install
```

> **Note on Dependencies**: The project utilizes Next.js `16.4.1`, React `19.x`, and Tailwind CSS `4.x`. Always run `npm install` without arbitrary version upgrades to ensure lockfile integrity.

---

## 3. Environment Variables Configuration

Create a local environment file `.env.local` in the project root:

```bash
touch .env.local
```

Populate `.env.local` with your Supabase credentials:

```ini
# ==============================================================================
# Supabase Configuration (Next.js Public Variables)
# ==============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Development server port configuration
PORT=3000
```

### Environment Variable Contract

| Variable | Scope | Purpose | Security Classification |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Client & Server | The REST API URL of your Supabase project | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Client & Server | The anon/public API key (governed strictly by PostgreSQL RLS) | Public (Safe with RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-Only (Optional) | Administrative key for bypass scripts (NEVER expose to client) | Highly Confidential |

> **Critical Security Warning**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` is exposed in browser network requests. The application secures all authoring operations via PostgreSQL **Row-Level Security (RLS)** and the `app_authorized_users` table. **Never** prefix a service-role key with `NEXT_PUBLIC_`.

---

## 4. Supabase Database & Storage Setup

### 4.1 Database Migrations

All schema definitions, triggers, RPC functions, and RLS policies reside in `supabase/migrations/`. To apply them to your Supabase instance:

```bash
# Using Supabase CLI linked to your project
supabase link --project-ref your-project-id
supabase db push
```

Alternatively, you can apply migrations sequentially via the **Supabase Dashboard SQL Editor**:

1. `20261015175117_taxonomy_core_tables.sql`
2. `20261015175142_taxonomy_supporting_tables_and_rls.sql`
3. `20261015175318_index_foreign_keys.sql`
4. `20261015182130_snapshot_repository_rpc_functions.sql`
5. `20261015182602_atomic_catalog_snapshot_rpc.sql`
6. `20261015191025_categories_storage_bucket_and_owner_policies.sql`
7. `20261015204655_enforce_taxonomy_placement_rules.sql`
8. `20261015204746_enforce_taxonomy_placement_and_product_type_schema.sql`
9. `20261015204844_global_active_taxonomy_slug_uniqueness.sql`
10. `20261016000004_product_type_attribute_editor.sql`
11. `20261016100000_taxonomy_node_description.sql`
12. `20261016120000_central_attribute_definition_integrity.sql`
13. `20261016173835_value_unit_conversion_integrity.sql`
14. `20261016174003_measurement_unit_workflows.sql`
15. `20261016175400_rebase_archived_measurement_units.sql`
16. `20261016175606_measurement_dimension_base_invariant.sql`

### 4.2 Initial Owner Authorization

The system uses an explicit allowlist. After creating your user account in Supabase Auth (via Dashboard or invite):

```sql
-- Replace with your Supabase Auth user ID (from auth.users)
INSERT INTO public.app_authorized_users (user_id, is_active, note)
VALUES ('00000000-0000-0000-0000-000000000000', true, 'Primary Platform Architect')
ON CONFLICT (user_id) DO UPDATE SET is_active = true;
```

### 4.3 Supabase Storage Bucket (`categories`)

The storage bucket `categories` is provisioned with public read access and owner-only upload policies:

- **Bucket ID**: `categories`
- **Public URL Pattern**: `https://<project-id>.supabase.co/storage/v1/object/public/categories/<path>`
- **Allowed MIME types**: `image/png`, `image/jpeg`, `image/webp`
- **Maximum file size**: `5 MiB`

---

## 5. Starting the Development Server

Start the Next.js development server with Turbopack:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The application will render in RTL mode by default.

---

## 6. Verifying Build and Code Integrity

Before deploying or committing code, run static type checking and build verification:

```bash
# Verify TypeScript strict compilation
npx tsc --noEmit

# Verify Next.js production build
npm run build
```
