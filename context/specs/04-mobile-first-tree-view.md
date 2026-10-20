# Unit 04 Specification: Mobile-First Collapsible Tree View

> **Historical implementation spec (Units 01–08).** This spec describes the original local-JSON/filesystem implementation. Those units are retained as historical records; the current runtime uses Supabase PostgreSQL, server-side data access, Auth/RLS, and Supabase Storage. Do not implement filesystem persistence or JSON writes from this spec. Use `context/architecture.md` and `context/progress-tracker.md` for current architecture/status.

## 1. Goal
Build the main tree visualization at route `/` displaying categories hierarchically using the tree utilities built in Unit 03. The tree must support collapsible branches, real-time client-side search filtering, and an "Isolate/Focus Mode" to allow smooth navigation on mobile screens without deep indentation issues.

## 2. Design & Mobile UX Requirements
- **Route**: `/` (Main Dashboard)
- **RTL & Typography**: Aligned with `ui-context.md` (IBM Plex Sans Arabic, RTL layout).
- **Header & Controls**:
  - Search input at the top with debounce and clear button.
  - "Expand All" / "Collapse All" toggle buttons.
  - Quick link/button to `/attributes`.
- **Tree Node Item Anatomy**:
  - Indentation: Controlled indentation step (`ms-3` or `ms-4` per level) with visual vertical guide lines.
  - Expand/Collapse chevron icon (toggles branch state).
  - Category icon/badge based on `node_type`:
    - `department`: Blue badge (`قسم رئيسي`)
    - `category`: Gray/Slate badge (`تصنيف`)
    - `subcategory`: Amber/Orange badge (`فرعي`)
    - `product_type`: Emerald/Green badge (`نوع منتج`)
  - Category names: `name_ar` (primary bold) and `name_en` (muted small).
  - Metadata badges:
    - Child counter (e.g. `3 فروع`).
    - Bound attributes count (e.g. `4 خصائص`).
  - Action buttons per node:
    - **Focus Mode Icon (Maximize2/Focus)**: Isolates the selected branch as the active root, rendering breadcrumbs at the top with a "Back to full tree" action.
    - **Edit Trigger**: Placeholder for Unit 05 (triggering drawer or page navigation).
- **Empty States**: Clear Arabic messages when no categories match the search term or if the tree is empty.

## 3. Implementation Details

### Server Component (`app/page.tsx`)
- Read categories from `data/categories.json` via `readCategories()`.
- Pass flat categories to client tree manager.

### Client Components (`components/tree/`)
1. `TreeContainer.tsx`:
   - Manages top-level state: search query, expand/collapse set, and `focusedNodeId`.
   - Uses `buildTree()` and `filterTree()` from `lib/utils/tree.ts`.
   - Renders Breadcrumbs when `focusedNodeId` is active.
2. `TreeNodeItem.tsx`:
   - Renders individual node row and recursively renders children if expanded.
   - Handles animated toggle transitions smoothly.
3. `TreeBreadcrumbs.tsx`:
   - Displays ancestor path using `getAncestors()` with clickable steps to jump up levels.
   - Includes a button to exit focus mode back to the root.

## 4. Verification Checklist
- [ ] Navigating to `/` displays the full hierarchical tree loaded from `data/categories.json`.
- [ ] Expanding/collapsing nodes works smoothly without layout breaking.
- [ ] Typing in the search input filters nodes dynamically while keeping matching ancestor paths open.
- [ ] Clicking the "Focus" button on any node isolates its sub-branch and shows breadcrumbs to navigate back.
- [ ] Badges correctly differentiate `department`, `category`, `subcategory`, and `product_type`.
- [ ] Verified responsive usability on mobile screen width (375px–420px) without horizontal scrolling overflow.
- [ ] `npx tsc --noEmit` passes with 0 errors.
- [ ] `npm run build` succeeds cleanly.
