# Unit 08 Specification: Enriched JSON Export API & UI Actions

> **Historical implementation spec (Units 01–08).** This spec describes the original local-JSON/filesystem implementation. Those units are retained as historical records; the current runtime uses Supabase PostgreSQL, server-side data access, Auth/RLS, and Supabase Storage. Do not implement filesystem persistence or JSON writes from this spec. Use `context/architecture.md` and `context/progress-tracker.md` for current architecture/status.

## 1. Goal

Implement a robust export pipeline that resolves and flattens categories with their materialized paths, breadcrumb chains, and fully resolved attributes (merged with global attribute definitions). Expose this via a dedicated Route Handler (`/api/export`) and accessible UI triggers (Download File & Copy to Clipboard) on the dashboard.

## 2. Enriched Payload Schema

The exported JSON must be an array of objects matching this exact structure:

```typescript
interface EnrichedCategoryExport {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  node_type: 'department' | 'category' | 'subcategory' | 'product_type';
  parent_id: string | null;
  path: string; // e.g., "الكهرباء والإنارة / الإضاءة / لمبات / لمبة LED"
  depth: number; // 0 for root, 1, 2, ...
  breadcrumbs: Array<{ id: string; name_ar: string; slug: string }>;
  image: string | null;
  attributes: Array<{
    attribute_id: string;
    name_ar: string;
    name_en?: string;
    data_type: 'number' | 'enum' | 'string' | 'boolean';
    filter_type: 'range' | 'checkbox' | 'select' | 'toggle' | 'color_swatch' | 'button_group';
    unit: string | null;
    role: 'identity' | 'variant' | 'descriptive' | 'commercial';
    group?: string;
    is_variant: boolean;
    allowed_values: string[];
  }>;
}

```

## 3. Implementation Details

### Core Export Generator (`lib/utils/export.ts`)

* Implement `generateEnrichedCatalog()`:
* Reads `data/categories.json` and `data/attributes.json`.
* Builds a lookup map for global attributes.
* For each category:
* Calculates `depth` and `path` using existing `getCategoryPath()`.
* Resolves `breadcrumbs` array using `getAncestors()`.
* Resolves every linked attribute by merging its local config (`role`, `group`, `is_variant`, `allowed_values`) with its global definition (`name_ar`, `name_en`, `data_type`, `filter_type`, `unit`).

* Returns the enriched array.

### Route Handler (`app/api/export/route.ts`)

* `GET /api/export`:
* Query parameter support: `?download=true` sets `Content-Disposition: attachment; filename="catalog-taxonomy-enriched.json"`.
* Returns `application/json` with pretty-printed formatting (2-space indent) for human readability.

### UI Export Trigger (`components/export/ExportMenu.tsx`)

* An accessible dropdown or button group placed prominently in `TreeContainer.tsx` header:
* **تحميل ملف JSON**: Triggers direct download from `/api/export?download=true`.
* **نسخ JSON**: Fetches payload or calls a server action and copies formatted JSON to clipboard with temporary feedback ("تم النسخ!").

## 4. Verification Checklist

* [ ] `GET /api/export` returns HTTP 200 with valid, fully populated `EnrichedCategoryExport[]`.
* [ ] Every item in the export contains accurate `path`, `depth`, and `breadcrumbs`.
* [ ] Bound attributes correctly inherit `filter_type`, `unit`, and `data_type` from global attributes.
* [ ] Unbound/empty categories still export cleanly with empty `attributes: []`.
* [ ] Clicking "تحميل ملف JSON" downloads the `.json` file in the browser.
* [ ] Clicking "نسخ JSON" copies valid JSON to the clipboard with visual confirmation.
* [ ] `npx tsc --noEmit` passes with 0 errors.
* [ ] `npm run build` succeeds cleanly.
* [ ] Final update to `context/progress-tracker.md` marking Phase 1 and Unit 08 as Completed.
