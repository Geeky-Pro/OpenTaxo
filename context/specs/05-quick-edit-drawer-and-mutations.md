# Unit 05 Specification: Quick Edit Drawer & Category Mutations

> **Historical implementation spec (Units 01–08).** This spec describes the original local-JSON/filesystem implementation. Those units are retained as historical records; the current runtime uses Supabase PostgreSQL, server-side data access, Auth/RLS, and Supabase Storage. Do not implement filesystem persistence or JSON writes from this spec. Use `context/architecture.md` and `context/progress-tracker.md` for current architecture/status.

## 1. Goal
Implement category mutation actions (Create, Quick Edit, Reparent, Delete) and integrate a mobile-first Slide-Over/Bottom Sheet drawer directly on the Tree View (`/`). Planners can quickly manage categories without losing visual context.

## 2. Architectural Invariants to Enforce
1. **Subtree Disqualification in Reparenting**:
   - When moving a category, use `getForbiddenParentIds` from `lib/utils/tree.ts` to strictly disable/exclude the category itself, its current parent, and all its descendants from the "New Parent" selector.
   - Enforce server-side validation via `validateReparent` before writing.
2. **Safe Cascade Delete with Impact Counter**:
   - Deleting a node calculates all its descendants via `getDescendants()`.
   - The confirmation dialog must explicitly state: 
     `"تنبيه: سيؤدي حذف [اسم الفئة] إلى حذف عدد (X) من الفئات الفرعية التابعة لها بشكل نهائي."`
   - Atomically remove the category and all its descendants from `data/categories.json`.
3. **Auto-Slug Generation**:
   - Default slug generated from `name_ar` (or `name_en` if provided) using `lib/utils/slug.ts`.

## 3. Server Actions (`lib/actions/categories.ts`)
Implement and export the following typed actions (with `revalidatePath('/')`):
- `createCategory(data)`: Validates with `CategorySchema`, generates ID (`cat_...`), writes atomically to `data/categories.json`.
- `updateCategory(id, data)`: Validates and updates category metadata (`name_ar`, `name_en`, `slug`, `node_type`).
- `reparentCategory(categoryId, newParentId)`: Validates using `validateReparent()`, updates `parent_id`, writes atomically.
- `deleteCategory(categoryId)`: Gathers all descendant IDs, removes target + descendants from `data/categories.json`, writes atomically.

## 4. UI Components (`components/drawer/` & `components/modals/`)
1. `QuickEditDrawer.tsx`:
   - Mobile-first Bottom Sheet / Slide-over (accessible, smooth gesture/backdrop dismissal).
   - Form fields:
     - `name_ar` (Text, Required)
     - `name_en` (Text, Optional)
     - `slug` (Text, auto-filled with override option)
     - `node_type` (Select: `department`, `category`, `subcategory`, `product_type`)
   - Quick Actions:
     - "نقل التبعية (تغيير الأب)" button -> opens `ReparentModal`.
     - "حذف الفئة" button -> opens `DeleteCategoryModal`.
     - "تعديل متقدم والمواصفات الكاملة" link -> navigates to `/categories/[id]` (for Unit 06).
2. `ReparentModal.tsx`:
   - Parent selection dropdown/combobox with forbidden nodes disabled and grayed out.
   - Live validation error feedback if an illegal node is selected.
3. `DeleteCategoryModal.tsx`:
   - Confirmation dialog calculating exact descendant count dynamically.
4. **Main Screen Triggers**:
   - Add "إضافة قسم رئيسي" button in `TreeContainer` header.
   - Add "إضافة فرع جديد (+)" and "تعديل" triggers on each `TreeNodeItem` to open the drawer with pre-filled state.

## 5. Verification Checklist
- [ ] Clicking "إضافة قسم رئيسي" opens drawer and successfully appends a root department to `data/categories.json`.
- [ ] Clicking "إضافة فرع" on a node sets `parent_id` automatically and creates a valid child.
- [ ] Editing `name_ar` or `node_type` updates the JSON and refreshes the tree instantly.
- [ ] Reparenting modal strictly disables the category itself and its descendants. Attempting invalid reparent fails validation cleanly.
- [ ] Deleting a parent category shows correct descendant count and purges the entire sub-branch cleanly.
- [ ] `npx tsc --noEmit` passes with 0 errors.
- [ ] `npm run build` succeeds cleanly.
