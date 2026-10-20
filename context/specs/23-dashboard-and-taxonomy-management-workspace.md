# Unit 23 — Dashboard and Taxonomy Management Workspace

> Status: Merged in PR #13. CI passed on the merge commit. A current main-branch browser regression check remains pending.
> Depends on Unit 21 taxonomy-node metadata and must preserve the Unit 22 Product Type attribute editor.

## Goal

Provide a clear starting dashboard and a searchable, filterable management list for every taxonomy node, without duplicating the taxonomy tree or changing the underlying domain model.

## Scope

- The dashboard at `/` links to the main workspaces and shows summary counts for taxonomy nodes, Product Types, attributes, and departments.
- The `/taxonomy` page lists all taxonomy nodes, including parent context and useful node-type labels.
- Search covers Arabic/English names, slug, description, and parent name.
- Filter by node type and show counts for the filtered list.
- Allow quick creation from the workspace and navigation to the existing node details page.
- Keep the visual hierarchy editor at `/tree` and hierarchy browser at `/browse`; do not duplicate their mutation logic.
- Preserve Arabic RTL, mobile-first behavior, authenticated access, and existing domain validation.
- Keep Product Type attribute configuration in the existing `/categories/[id]` detail route.

## Out of scope

- New taxonomy node types or a new taxonomy table.
- Changes to parent/type placement rules, slug policy, archive policy, or snapshot semantics.
- Replacing the existing tree editor or Product Type attribute editor.
- Merchant-specific taxonomies, storefront product data, pricing, inventory, or offers.
- Broad role-based permissions beyond the existing owner authorization boundary.

## Acceptance criteria

- [x] Dashboard links to the existing taxonomy and central-definition workspaces.
- [x] Dashboard counts are derived from the data-access layer, not hard-coded.
- [x] Taxonomy management lists all node types and shows the relevant parent context.
- [x] Search covers names, slug, description, and parent name.
- [x] Node-type filtering and per-type counts work without mutating data.
- [x] Creating a node reuses the existing quick-edit/action path and domain rules.
- [x] Node details navigation reuses `/categories/[id]`.
- [x] PR #13 merged and CI passed.
- [ ] Run browser regression checks on current `main` for search/filter, create/navigation, mobile layout, and Product Type details.

## Verification notes

The implementation is in `app/page.tsx`, `app/taxonomy/page.tsx`, and `components/taxonomy/TaxonomyManagementClient.tsx`. This spec records the merged scope; any new behavior requires a separately scoped change and an update to this spec.
