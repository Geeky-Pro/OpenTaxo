# Unit 01: Project Setup, Schemas, and Atomic Filesystem Data Layer

> **Historical implementation spec (Units 01–08).** This spec describes the original local-JSON/filesystem implementation. Those units are retained as historical records; the current runtime uses Supabase PostgreSQL, server-side data access, Auth/RLS, and Supabase Storage. Do not implement filesystem persistence or JSON writes from this spec. Use `context/architecture.md` and `context/progress-tracker.md` for current architecture/status.

## Goal

Establish the complete project foundation: Next.js project with correct configuration, all domain types and validation schemas, seed data files, and a bulletproof atomic JSON read/write layer. After this unit, every future unit can read and write data safely.

## Design Decisions

1. **nanoid** (not UUID) for ID generation — shorter, URL-safe, sufficient for local single-user use.
2. **Zod schemas** are the single source of truth for both runtime validation and TypeScript types (via `z.infer`).
3. **Atomic write** uses `write → fsync → rename` pattern to prevent corruption.
4. **Seed data** includes a small but realistic category tree (3 levels deep) and a handful of attributes to verify the data layer immediately.
5. **Slug generation** transliterates Arabic to a URL-safe format using a simple mapping; collisions are resolved by appending `-N`.

---

## Implementation Details

### 1. Project Initialization

```bash
npx -y create-next-app@latest ./ \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --turbopack
```

**Post-init configuration:**

- Update `app/layout.tsx`: set `<html dir="rtl" lang="ar">`.
- Add IBM Plex Sans Arabic font via `next/font/google`.
- Install dependencies (see Dependencies section).

### 2. Zod Schemas & TypeScript Types

#### `lib/types/attribute.ts`

```typescript
import { z } from 'zod';

export const FilterTypeSchema = z.enum([
  'range',
  'checkbox',
  'select',
  'toggle',
  'color_swatch',
  'button_group',
]);

export type FilterType = z.infer<typeof FilterTypeSchema>;

export const AttributeSchema = z.object({
  id: z.string().min(1),
  name_ar: z.string().min(1),
  name_en: z.string().optional(),
  filter_type: FilterTypeSchema,
  unit: z.string().optional(),
});

export type Attribute = z.infer<typeof AttributeSchema>;

export const AttributesFileSchema = z.array(AttributeSchema);
```

#### `lib/types/category.ts`

```typescript
import { z } from 'zod';

export const CategoryAttributeSchema = z.object({
  attribute_id: z.string().min(1),
  allowed_values: z.array(z.string()).optional(),
  is_variant: z.boolean(),
});

export type CategoryAttribute = z.infer<typeof CategoryAttributeSchema>;

export const CategorySchema = z.object({
  id: z.string().min(1),
  name_ar: z.string().min(1),
  name_en: z.string().optional(),
  slug: z.string().min(1),
  parent_id: z.string().nullable(),
  image: z.string().optional(),
  attributes: z.array(CategoryAttributeSchema),
});

export type Category = z.infer<typeof CategorySchema>;

export const CategoriesFileSchema = z.array(CategorySchema);
```

#### `lib/types/action-result.ts`

```typescript
export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string | Record<string, string[]> };
```

### 3. Atomic JSON I/O

#### `lib/data/io.ts`

Core functions:

```typescript
/**
 * Read a JSON file and validate it against a Zod schema.
 * Returns the default value if the file doesn't exist (ENOENT).
 * Throws on parse/validation errors.
 */
async function readJsonFile<T>(filePath: string, schema: ZodSchema<T>, defaultValue: T): Promise<T>

/**
 * Write data to a JSON file atomically.
 * 1. Write to .tmp file
 * 2. fsync the temp file
 * 3. Rename temp → target (atomic on POSIX)
 * On failure, cleans up the temp file.
 */
async function writeJsonFileAtomically<T>(filePath: string, data: T): Promise<void>
```

**Implementation requirements:**

- Use `node:fs/promises` and `node:path`.
- `readJsonFile` catches `ENOENT` specifically and returns `defaultValue`. All other errors propagate.
- `writeJsonFileAtomically` creates parent directories if they don't exist (`mkdir -p` equivalent).
- JSON is written with `null, 2` indentation for human readability and git diffs.
- Temp file path: `${filePath}.tmp`.
- On write failure, the temp file is removed in a `finally` block (best effort).

### 4. Domain Data Access

#### `lib/data/categories.ts`

```typescript
import { CategoriesFileSchema, Category } from '@/lib/types/category';
import { readJsonFile, writeJsonFileAtomically } from './io';

const CATEGORIES_PATH = path.join(process.cwd(), 'data', 'categories.json');

export async function readCategories(): Promise<Category[]> {
  return readJsonFile(CATEGORIES_PATH, CategoriesFileSchema, []);
}

export async function writeCategories(categories: Category[]): Promise<void> {
  // Validate before writing
  CategoriesFileSchema.parse(categories);
  return writeJsonFileAtomically(CATEGORIES_PATH, categories);
}
```

#### `lib/data/attributes.ts`

```typescript
import { AttributesFileSchema, Attribute } from '@/lib/types/attribute';
import { readJsonFile, writeJsonFileAtomically } from './io';

const ATTRIBUTES_PATH = path.join(process.cwd(), 'data', 'attributes.json');

export async function readAttributes(): Promise<Attribute[]> {
  return readJsonFile(ATTRIBUTES_PATH, AttributesFileSchema, []);
}

export async function writeAttributes(attributes: Attribute[]): Promise<void> {
  AttributesFileSchema.parse(attributes);
  return writeJsonFileAtomically(ATTRIBUTES_PATH, attributes);
}
```

### 5. Utility Functions

#### `lib/utils/id.ts`

```typescript
import { nanoid } from 'nanoid';

/**
 * Generate a unique ID for categories and attributes.
 * Uses nanoid with default length (21 chars).
 */
export function generateId(): string {
  return nanoid();
}
```

#### `lib/utils/slug.ts`

```typescript
/**
 * Generate a URL-safe slug from an Arabic or English string.
 * - Converts Arabic characters to a simplified Latin transliteration.
 * - Lowercases, trims, replaces spaces with hyphens.
 * - Removes non-alphanumeric characters (except hyphens).
 *
 * If the slug collides with an existing slug in the provided list,
 * appends -1, -2, etc. until unique.
 */
export function generateSlug(name: string, existingSlugs: string[]): string
```

**Implementation requirements:**

- Handle Arabic input by transliterating common characters (ا→a, ب→b, ت→t, etc.).
- Handle English input by lowercasing.
- Replace whitespace sequences with single hyphens.
- Remove characters that aren't `[a-z0-9-]`.
- If the base slug is empty after processing, use `category` as fallback.
- Collision resolution: check against `existingSlugs`, append `-N` incrementally.

### 6. Seed Data Files

#### `data/categories.json`

```json
[
  {
    "id": "cat_electronics",
    "name_ar": "إلكترونيات",
    "name_en": "Electronics",
    "slug": "electronics",
    "parent_id": null,
    "attributes": []
  },
  {
    "id": "cat_phones",
    "name_ar": "هواتف",
    "name_en": "Phones",
    "slug": "phones",
    "parent_id": "cat_electronics",
    "attributes": []
  },
  {
    "id": "cat_smartphones",
    "name_ar": "هواتف ذكية",
    "name_en": "Smartphones",
    "slug": "smartphones",
    "parent_id": "cat_phones",
    "attributes": []
  },
  {
    "id": "cat_laptops",
    "name_ar": "حواسيب محمولة",
    "name_en": "Laptops",
    "slug": "laptops",
    "parent_id": "cat_electronics",
    "attributes": []
  },
  {
    "id": "cat_fashion",
    "name_ar": "أزياء",
    "name_en": "Fashion",
    "slug": "fashion",
    "parent_id": null,
    "attributes": []
  },
  {
    "id": "cat_men",
    "name_ar": "رجالي",
    "name_en": "Men",
    "slug": "men",
    "parent_id": "cat_fashion",
    "attributes": []
  },
  {
    "id": "cat_women",
    "name_ar": "نسائي",
    "name_en": "Women",
    "slug": "women",
    "parent_id": "cat_fashion",
    "attributes": []
  }
]
```

#### `data/attributes.json`

```json
[
  {
    "id": "attr_color",
    "name_ar": "اللون",
    "name_en": "Color",
    "filter_type": "color_swatch"
  },
  {
    "id": "attr_size",
    "name_ar": "المقاس",
    "name_en": "Size",
    "filter_type": "button_group"
  },
  {
    "id": "attr_material",
    "name_ar": "المادة",
    "name_en": "Material",
    "filter_type": "checkbox"
  },
  {
    "id": "attr_weight",
    "name_ar": "الوزن",
    "name_en": "Weight",
    "filter_type": "range",
    "unit": "كغ"
  },
  {
    "id": "attr_brand",
    "name_ar": "العلامة التجارية",
    "name_en": "Brand",
    "filter_type": "select"
  },
  {
    "id": "attr_waterproof",
    "name_ar": "مقاوم للماء",
    "name_en": "Waterproof",
    "filter_type": "toggle"
  }
]
```

### 7. Root Layout Setup

#### `app/layout.tsx`

```typescript
import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'مخطط التصنيفات — Taxonomy Planner',
  description: 'أداة تخطيط وتنظيم تصنيفات المتجر الإلكتروني',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html dir="rtl" lang="ar" className={ibmPlexArabic.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
```

### 8. Minimal Root Page

#### `app/page.tsx`

A minimal placeholder that confirms the app is running:

```typescript
export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">مخطط التصنيفات</h1>
    </main>
  );
}
```

This will be replaced in Unit 04 with the Tree View.

### 9. Tailwind CSS Configuration

- Ensure `globals.css` includes the semantic color tokens from `context/ui-context.md`.
- Configure the dark mode toggle class strategy (`class` based).
- Add the `--font-sans` variable to the Tailwind theme.

---

## Dependencies

### Install via npm

```bash
npm install zod nanoid
```

### Shadcn UI Setup (init only — no components yet)

```bash
npx shadcn@latest init
```

Configure for:

- Style: New York
- Base color: Slate (will be overridden by our tokens)
- CSS variables: Yes

> **Note**: Do NOT install any Shadcn components in this unit. Components are installed as needed in future units.

---

## Files Created in This Unit

| File | Purpose |
| ------ | --------- |
| `lib/types/category.ts` | Zod schemas + types for Category, CategoryAttribute |
| `lib/types/attribute.ts` | Zod schemas + types for Attribute, FilterType |
| `lib/types/action-result.ts` | ActionResult type for Server Action returns |
| `lib/data/io.ts` | Atomic JSON read/write utilities |
| `lib/data/categories.ts` | Category-specific data access (read/write) |
| `lib/data/attributes.ts` | Attribute-specific data access (read/write) |
| `lib/utils/id.ts` | nanoid wrapper for ID generation |
| `lib/utils/slug.ts` | Slug generation with Arabic transliteration + collision handling |
| `data/categories.json` | Seed data: 7 categories across 3 levels |
| `data/attributes.json` | Seed data: 6 attributes with various filter types |
| `app/layout.tsx` | Root layout: RTL, Arabic font, metadata |
| `app/page.tsx` | Minimal placeholder page |
| `app/globals.css` | Semantic color tokens, theme setup |

## Files Modified in This Unit

| File | Change |
| ------ | -------- |
| `tsconfig.json` | Verify `strict: true`, path alias `@/*` |
| `tailwind.config.ts` | Add font-sans variable, dark mode class |
| `package.json` | New dependencies: `zod`, `nanoid` |

---

## Verification Checklist

### Static Checks

- [ ] `npx tsc --noEmit` passes with zero errors.
- [ ] All Zod schemas are exported and infer correct TypeScript types.
- [ ] No `any` types anywhere in the codebase.
- [ ] All imports use the `@/` path alias.

### Filesystem & Data Layer

- [ ] `data/categories.json` exists and contains valid JSON matching `CategoriesFileSchema`.
- [ ] `data/attributes.json` exists and contains valid JSON matching `AttributesFileSchema`.
- [ ] `readCategories()` returns the 7 seed categories.
- [ ] `readAttributes()` returns the 6 seed attributes.
- [ ] `readCategories()` returns `[]` if `data/categories.json` is deleted (graceful ENOENT handling).
- [ ] `writeCategories()` writes atomically: if the process crashes mid-write, the original file is intact.
- [ ] `writeCategories()` creates the `data/` directory if it doesn't exist.
- [ ] Written JSON is formatted with 2-space indentation.

### Slug Generation

- [ ] `generateSlug("هواتف ذكية", [])` produces a valid slug (e.g., `hwatf-dhkyh`).
- [ ] `generateSlug("Smartphones", [])` produces `smartphones`.
- [ ] `generateSlug("test", ["test"])` produces `test-1`.
- [ ] `generateSlug("test", ["test", "test-1"])` produces `test-2`.
- [ ] Empty or whitespace-only input produces `category` as fallback.

### ID Generation

- [ ] `generateId()` returns a string of length 21.
- [ ] Two calls return different values.

### Application

- [ ] `npm run dev` starts without errors.
- [ ] `localhost:3000` shows the placeholder page with Arabic text "مخطط التصنيفات".
- [ ] The page renders in RTL direction.
- [ ] IBM Plex Sans Arabic font is loaded and applied.

### Cleanup

- [ ] No files exist that aren't listed in this spec.
- [ ] No dependencies are installed that aren't listed in this spec.
- [ ] `public/categories/` directory exists (empty, ready for Unit 06).
