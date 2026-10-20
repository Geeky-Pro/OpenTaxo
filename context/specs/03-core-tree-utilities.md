# Unit 03 Specification: Core Tree Utilities & Algorithms

> **Historical implementation spec (Units 01–08).** This spec describes the original local-JSON/filesystem implementation. Those units are retained as historical records; the current runtime uses Supabase PostgreSQL, server-side data access, Auth/RLS, and Supabase Storage. Do not implement filesystem persistence or JSON writes from this spec. Use `context/architecture.md` and `context/progress-tracker.md` for current architecture/status.

## 1. Goal
Implement a robust, pure algorithmic module in \lib/utils/tree.ts\ for tree reconstruction, hierarchy traversal, ancestry tracking, and circular reference prevention (Subtree Disqualification rule). This unit contains NO UI components — it is purely logic, types, and unit verification.

## 2. Mathematical & Algorithmic Requirements

### Types (\CategoryTreeNode\)
Define \CategoryTreeNode\ extending \Category\ with:
- \children: CategoryTreeNode[]\
- \depth: number\ (0 for root/department, 1 for category, etc.)
- \path: string\ (e.g. 'الكهرباء/الإضاءة/لمبات')

### Core Functions in \lib/utils/tree.ts\:

1. \uildTree(categories: Category[]): CategoryTreeNode[]\
   - Transforms flat \Category[]\ array into a nested tree structure using an $O(n) hash-map algorithm.
   - Handles root categories (\parent_id === null\).
   - Sorts children by name or insertion order predictably.

2. \getAncestors(categoryId: string, categories: Category[]): Category[]\
   - Returns an ordered array of ancestor categories from the root department down to the immediate parent (for breadcrumbs).

3. \getDescendants(categoryId: string, categories: Category[]): Category[]\
   - Returns all descendant categories (children, grandchildren, etc.) recursively.

4. \getForbiddenParentIds(categoryId: string, categories: Category[]): Set<string>\
   - **Critical Subtree Disqualification Rule**:
     \Forbidden = { categoryId } ∪ { category.parent_id } ∪ { ids of all descendants of categoryId }\.
   - Used to disable invalid options in the "Change Parent" dropdown.

5. \alidateReparent(targetId: string, newParentId: string | null, categories: Category[]): { valid: boolean; error?: string }\
   - Enforces:
     a) Target exists.
     b) Target cannot be its own parent (\	argetId === newParentId\).
     c) New parent cannot be inside the target's descendant tree (\orbiddenParentIds.has(newParentId)\).
     d) Node type hierarchy logic: A \product_type\ cannot be parent to a \department\ or \category\.

6. \getCategoryPath(categoryId: string, categories: Category[], separator: string = ' / '): string\
   - Returns full localized materialized path string.

7. \ilterTree(tree: CategoryTreeNode[], searchQuery: string): CategoryTreeNode[]\
   - Recursively filters tree nodes by \
ame_ar\ or \
ame_en\ while preserving matching ancestors so the tree context remains unbroken.

## 3. Verification & Automated Test Script
- Create a test script \scripts/verify-tree-utils.ts\ (executable via \
px tsx scripts/verify-tree-utils.ts\ or \
ode\).
- The script must assert and verify with console output:
  1. Flat seed data converts to tree with accurate depth and child counts.
  2. Breadcrumbs calculation matches expected ancestor paths.
  3. \getForbiddenParentIds\ correctly includes self, direct parent, and all sub-branches.
  4. \alidateReparent\ rejects circular moves (e.g., trying to move a root department under one of its products).
  5. Search filter accurately keeps ancestor paths open for matched children.

## 4. Acceptance Criteria
- [ ] \lib/utils/tree.ts\ fully implemented with strict TypeScript types.
- [ ] \scripts/verify-tree-utils.ts\ runs and passes all 5 assertions with 100% success.
- [ ] \
px tsc --noEmit\ passes with 0 errors.
- [ ] \
pm run build\ succeeds cleanly.
- [ ] \context/progress-tracker.md\ updated.
