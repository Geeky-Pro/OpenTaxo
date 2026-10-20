# Code Standards — Taxonomy & Catalog Planner

> **Current standard:** Next.js Server Actions and Route Handlers use a server-side repository/data-access layer backed by Supabase Auth + RLS. Supabase PostgreSQL is the source of truth; the JSON snippets below are historical examples and must not be copied into new persistence features.

## TypeScript Conventions

### Strict Mode

`tsconfig.json` must enable:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false
  }
}
```

### Type Definitions

- Domain types live in `lib/types/`; database-generated Supabase types are maintained in `lib/supabase/database.types.ts`.
- Zod schemas live alongside their types in the same file, exported as both the schema and the inferred type.
- **Never use `any`.** Use `unknown` when the type is genuinely unknown, then narrow with Zod or type guards.
- **Never use `as` type assertions** unless interfacing with an untyped third-party API, and always add a comment explaining why.

```typescript
// lib/types/category.ts
import { z } from 'zod';

export const CategoryAttributeSchema = z.object({
  attribute_id: z.string(),
  allowed_values: z.array(z.string()).optional(),
  is_variant: z.boolean(),
});

export const CategorySchema = z.object({
  id: z.string(),
  name_ar: z.string().min(1),
  name_en: z.string().optional(),
  slug: z.string().min(1),
  parent_id: z.string().nullable(),
  image: z.string().optional(),
  attributes: z.array(CategoryAttributeSchema),
});

export type Category = z.infer<typeof CategorySchema>;
export type CategoryAttribute = z.infer<typeof CategoryAttributeSchema>;
```

### Naming Conventions

| Element | Convention | Example |
| --------- | ----------- | --------- |
| Files (components) | `kebab-case.tsx` | `tree-node.tsx` |
| Files (utilities) | `kebab-case.ts` | `tree-utils.ts` |
| Files (types) | `kebab-case.ts` | `category.ts` |
| Components | `PascalCase` | `TreeNode` |
| Functions | `camelCase` | `getDescendants` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_TREE_DEPTH` |
| Types/Interfaces | `PascalCase` | `Category` |
| Zod schemas | `PascalCase` + `Schema` suffix | `CategorySchema` |
| Server Actions | `camelCase` verb-noun | `createCategory` |
| Route Handlers | Next.js convention (`route.ts`) | `app/api/export/route.ts` |

## Server Actions

### Location & Structure

The current implementation keeps domain mutation actions under `lib/actions/` (for example, categories, category details, attribute definitions, Product Type assignments, value sets, and measurements). Route/page files and Client Components call these exported actions; do not create a second action layer in `app/actions/` unless a specific framework boundary requires it.

### Pattern

Every Server Action must follow the current repository's established action result and authorization pattern. This is a contract sketch, not a copy/paste implementation; use the relevant domain action and repository modules as the source of truth.

```typescript
'use server';

import { revalidatePath } from 'next/cache';
// Import the actual input schema, action result type, and domain repository
// used by the current feature. Do not assume a helper name from this example.

export async function updateDomainRecord(input: unknown): Promise<ActionResult<DomainRecord>> {
  const parsed = UpdateDomainRecordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() };
  }

  try {
    // Verify the signed-in actor/owner authorization.
    // Apply domain rules and persist through a session-scoped repository or
    // a reviewed SECURITY INVOKER RPC; never accept actor identity from input.
    const record = await updateDomainRecordInRepository(parsed.data);
    revalidatePath('/taxonomy');
    return { success: true, data: record };
  } catch {
    // Return a safe, actionable error; do not leak secrets or SQL internals.
    return { success: false, error: 'تعذر حفظ التغييرات. تحقق من البيانات والصلاحيات ثم حاول مجدداً.' };
  }
}
```

### Action Result Type

```typescript
// lib/types/action-result.ts
export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string | Record<string, string[]> };
```

## Supabase Data Access (Current Standard)

- Use `@supabase/ssr` for cookie-aware Next.js server clients and `@supabase/supabase-js` as the underlying client, following the current official Supabase SSR guide.
- Keep all database calls behind server-side data-access/repository functions. Client Components must not hold service-role/secret keys or bypass the app's authorization model.
- Validate mutation input with Zod; derive the actor from the authenticated Supabase session, never from a user-supplied ID.
- Enable RLS on every exposed table and test signed-out, unauthorized, and authorized requests. A hidden button is not access control.
- Never dual-write JSON and PostgreSQL. Legacy JSON/filesystem persistence has been removed from the current working tree.
- Prefer transaction-safe database constraints and domain operations over whole-collection read/modify/write cycles.

## Route Handlers

Use Route Handlers only for HTTP endpoints that need explicit request/response semantics. The current `GET /api/export` endpoint is owner-authorized and returns the enriched catalog JSON, optionally as a download. The current `POST /api/upload` endpoint is owner-authorized and uploads PNG/JPEG/WebP images up to 5 MiB to the `categories` Storage bucket. Preserve `requireOwner()` checks, input validation, safe error messages, and server-side storage access.

```typescript
// app/api/export/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // Read, enrich, return
  return NextResponse.json(enrichedData);
}
```

## Error Handling

### Server-Side

- **Validation errors**: Return structured `ActionResult` with flattened Zod errors. Never throw.
- **Database errors**: Map expected constraint/auth/validation failures to safe typed action results; log no secrets or raw credentials. Do not treat query failures as empty data.
- **Invariant violations**: Return descriptive `ActionResult` errors (e.g., "Cannot reparent: target is a descendant").

### Client-Side

- Use `useActionState` (React 19) to handle Server Action results.
- Display errors via toast notifications (Sonner) or inline field errors.
- **Never swallow errors silently.** Every error must be visible to the user.

## RTL-First CSS Conventions

### Logical Properties Only

**Never use** `left`, `right`, `ml-*`, `mr-*`, `pl-*`, `pr-*`, `text-left`, `text-right`, `rounded-l-*`, `rounded-r-*`.

**Always use** logical equivalents:

| Physical (❌ Never) | Logical (✅ Always) | Meaning in RTL |
| --------------------- | --------------------- | ---------------- |
| `ml-4` | `ms-4` | Margin at the start (right in RTL) |
| `mr-4` | `me-4` | Margin at the end (left in RTL) |
| `pl-4` | `ps-4` | Padding at the start |
| `pr-4` | `pe-4` | Padding at the end |
| `left-0` | `start-0` | Position at the start |
| `right-0` | `end-0` | Position at the end |
| `text-left` | `text-start` | Text aligned to start |
| `text-right` | `text-end` | Text aligned to end |
| `rounded-l-lg` | `rounded-s-lg` | Border radius at start |
| `rounded-r-lg` | `rounded-e-lg` | Border radius at end |
| `border-l` | `border-s` | Border at start |
| `border-r` | `border-e` | Border at end |

### HTML Root

```html
<html dir="rtl" lang="ar">
```

This is set in `app/layout.tsx` and is the **default** for the entire application.

## Component Architecture

### Directory Structure

```text
app/
├── layout.tsx                    # Root layout (RTL, fonts, theme)
├── page.tsx                      # Tree view (/)
├── attributes/
│   └── page.tsx                  # Attribute library (/attributes)
├── categories/
│   └── [id]/
│       └── page.tsx              # Category edit (/categories/[id])
├── actions/
│   ├── category-actions.ts
│   └── attribute-actions.ts
├── api/
│   └── export/
│       └── route.ts
components/
├── ui/                           # Shadcn UI primitives (auto-generated)
├── tree/                         # Tree-specific components
│   ├── tree-view.tsx
│   ├── tree-node.tsx
│   └── tree-focus-breadcrumbs.tsx
├── category/                     # Category-specific components
│   ├── category-drawer.tsx
│   ├── category-form.tsx
│   └── category-image-upload.tsx
├── attribute/                    # Attribute-specific components
│   ├── attribute-list.tsx
│   └── attribute-form.tsx
├── search/                       # Search components
│   └── command-palette.tsx
└── layout/                       # Layout components
    ├── bottom-nav.tsx
    ├── top-bar.tsx
    └── theme-toggle.tsx
lib/
├── types/
│   ├── category.ts               # Zod schemas + types
│   ├── attribute.ts
│   └── action-result.ts
├── data/
│   ├── io.ts                     # Atomic JSON read/write utilities
│   ├── categories.ts             # readCategories, writeCategories
│   └── attributes.ts             # readAttributes, writeAttributes
├── tree/
│   ├── flat-to-tree.ts           # Convert flat array to nested tree
│   ├── subtree-disqualification.ts # Disqualification validator
│   └── breadcrumbs.ts            # Compute breadcrumb path
└── utils/
    ├── slug.ts                   # Slug generation with collision handling
    └── id.ts                     # ID generation (nanoid)
```

### Component Principles

1. **Server Components by default.** Only add `'use client'` when the component needs interactivity (event handlers, hooks, browser APIs).
2. **Co-locate related files.** Forms, hooks, and utilities specific to a feature live in that feature's directory.
3. **Props over context.** Prefer explicit props. Use React Context only for truly global concerns (theme, search state).
4. **Composition over configuration.** Build complex UIs by composing small, focused components rather than adding props/flags to existing ones.
5. **Shadcn UI as the primitive layer.** All custom components build on top of Shadcn/Radix primitives for accessibility.

## Import Conventions

- Use the `@/` path alias for all project imports.
- Group imports: React/Next → third-party → project (`@/lib`, `@/components`).
- Never use relative imports that traverse more than one level up (`../../`).

```typescript
// ✅ Correct
import { Category } from '@/lib/types/category';
import { readCategories } from '@/lib/data/categories';
import { TreeNode } from '@/components/tree/tree-node';

// ❌ Incorrect
import { Category } from '../../lib/types/category';
```
