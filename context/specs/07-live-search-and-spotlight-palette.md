# Unit 07 Specification: Live Search & Spotlight Command Palette

> **Historical implementation spec (Units 01–08).** This spec describes the original local-JSON/filesystem implementation. Those units are retained as historical records; the current runtime uses Supabase PostgreSQL, server-side data access, Auth/RLS, and Supabase Storage. Do not implement filesystem persistence or JSON writes from this spec. Use `context/architecture.md` and `context/progress-tracker.md` for current architecture/status.

## 1. Goal
Implement a global Spotlight / Command Palette modal accessible via keyboard shortcut (`Cmd+K` / `Ctrl+K`) and a prominent header trigger button. The palette provides instant search across all categories (departments, categories, subcategories, product types) and global attributes, displaying materialized ancestor paths and allowing one-click navigation.

## 2. Design & UX Requirements
- **Trigger Mechanisms**:
  - Global keyboard shortcut: `Ctrl+K` / `Cmd+K`.
  - Floating/Header search bar or icon in `TreeContainer` and top navigation.
- **RTL & Visual Styling**:
  - Backdrop blur overlay with centered modal dialog (max-w-xl).
  - Search input with auto-focus and clear button.
- **Grouped Search Results**:
  1. **التصنيفات والمنتجات (Categories & Product Types)**:
     - Shows `name_ar` (bold), `name_en`, and node type badge (`department`, `category`, `subcategory`, `product_type`).
     - Subtitle displays the full breadcrumb path (e.g., `الكهرباء والإنارة / الإضاءة / لمبات`).
     - Quick action on selection: Navigate directly to `/categories/[id]` or jump to tree focus.
  2. **مستودع الخصائص (Global Attributes)**:
     - Shows attribute `name_ar`, `filter_type` badge, and `data_type`.
     - Selection navigates to `/attributes`.
- **Keyboard Navigation**:
  - Arrow keys `Up` / `Down` to cycle results.
  - `Enter` to select and navigate.
  - `Escape` to close.
- **Empty State**:
  - "لم يتم العثور على أي نتائج مطابقة لـ '{query}'" with subtle helper hint.

## 3. Implementation Details

### Client Component (`components/search/SpotlightPalette.tsx`)
- Either use `cmdk` (if compatible with React 19) or implement a clean, lightweight accessible dialog using Tailwind + native keyboard listeners.
- Receives flat `categories` and `attributes` list (or fetches via Server Action).
- Uses `getCategoryPath()` from `lib/utils/tree.ts` to pre-calculate or format breadcrumb paths for matching results.
- Manages open/close state globally or via custom event/hook (`useSpotlight`).

### Integration Points
- Add the Spotlight trigger button into `TreeContainer.tsx` header alongside the existing search input.
- Ensure the palette is globally available on both `/` and `/attributes` (can be embedded in `app/layout.tsx` or a global header client wrapper).

## 4. Verification Checklist
- [ ] Pressing `Ctrl+K` or `Cmd+K` opens the Spotlight modal from anywhere in the application.
- [ ] Clicking the search trigger button opens the modal cleanly.
- [ ] Typing an Arabic keyword (e.g., 'لمبة' or 'مقاس') filters categories and attributes instantly.
- [ ] Category results clearly show their hierarchical breadcrumb path.
- [ ] Arrow navigation (`Up`/`Down`) and `Enter` selection correctly routes to `/categories/[id]` or `/attributes`.
- [ ] Closing via `Escape` or clicking outside works smoothly.
- [ ] Responsive behavior verified on mobile widths.
- [ ] `npx tsc --noEmit` passes with 0 errors.
- [ ] `npm run build` succeeds cleanly.
