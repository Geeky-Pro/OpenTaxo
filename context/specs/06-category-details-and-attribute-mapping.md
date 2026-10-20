# Unit 06 Specification: Dedicated Category Details & Attribute Mapping

> **Historical implementation spec (Units 01–08).** This spec describes the original local-JSON/filesystem implementation. Those units are retained as historical records; the current runtime uses Supabase PostgreSQL, server-side data access, Auth/RLS, and Supabase Storage. Do not implement filesystem persistence or JSON writes from this spec. Use `context/architecture.md` and `context/progress-tracker.md` for current architecture/status.

## 1. Goal
Build the comprehensive Category Management page at route `/categories/[id]`. Planners can configure full metadata, manage category images, bind attributes from the global library (`attributes.json`), assign architectural roles (`identity`, `variant`, `descriptive`, `commercial`), organize them into visual groups, and define category-specific allowed values (`allowed_values`).

## 2. Design & Layout Requirements (`/categories/[id]`)
- **Route**: `/categories/[id]`
- **Header**:
  - Breadcrumbs path (Root > Sub > Current) using `getAncestors()`.
  - Category name (`name_ar`), node type badge (`department`, `category`, `subcategory`, `product_type`).
  - Action buttons: "العودة للشجرة" and "حفظ التغييرات".
- **Sections / Tabs Layout**:
  1. **معلومات الفئة والصورة (General Info & Media)**:
     - `name_ar` (Required), `name_en` (Optional), `slug` (Editable).
     - `node_type` selector.
     - `image`: Image URL input with live preview and local path support (`/categories/...`).
  2. **ربط الخصائص والمواصفات (Attribute & Variant Mapping)**:
     - **Add Attribute Selector**: Dropdown/combobox listing global attributes from `data/attributes.json` (excluding already bound attributes).
     - **Bound Attributes Table/Card Grid**: Grouped visually by `group` (e.g. 'المواصفات الفنية', 'الهوية والعلامة', 'الأبعاد').
     - **Per-Attribute Configuration**:
       - Role selector: `['identity', 'variant', 'descriptive', 'commercial']`.
       - Variant toggle (`is_variant`: boolean).
       - Group input (Text or common suggestions dropdown).
       - Allowed Values Manager: Interactive tag/chip input to add, view, and remove allowed options (e.g. `["7W", "9W", "12W"]` or `["0.5", "0.75", "1"]`).
       - Remove binding action button.

## 3. Server Actions (`lib/actions/category-details.ts`)
Implement and export typed actions (with `revalidatePath('/categories/[id]')` and `revalidatePath('/')`):
- `getCategoryWithAttributes(id)`: Fetches category by ID and enriches its bound attributes with global attribute metadata (`name_ar`, `filter_type`, `unit`, `data_type`).
- `saveCategoryFullDetails(id, data)`:
  - Validates category metadata and array of bound attributes via Zod.
  - Updates `data/categories.json` atomically.

## 4. UI Components (`app/categories/[id]/` & `components/category-details/`)
- `app/categories/[id]/page.tsx`: Server Component fetching category and global attributes.
- `components/category-details/CategoryDetailClient.tsx`: Client coordinator handling local form state, optimistic additions/removals, and submission transitions.
- `components/category-details/AttributeBindingSection.tsx`: The attribute binder, grouping UI, and role toggles.
- `components/category-details/TagInput.tsx`: Lightweight, accessible chip input for entering `allowed_values`.

## 5. Verification Checklist
- [ ] Navigating to `/categories/[id]` renders category details, breadcrumbs, and currently bound attributes.
- [ ] Adding an attribute from the global library binds it with default values (`role: 'descriptive'`, `is_variant: false`).
- [ ] Setting `role: 'identity'` and toggling `is_variant` persists correctly to `data/categories.json`.
- [ ] Adding and deleting tags in `allowed_values` updates the category's allowed array.
- [ ] Categorizing attributes under groups visually organizes them into collapsible or distinct card panels.
- [ ] Removing an attribute unbinds it without affecting the global attribute in `attributes.json`.
- [ ] `npx tsc --noEmit` passes with 0 errors.
- [ ] `npm run build` succeeds cleanly.
