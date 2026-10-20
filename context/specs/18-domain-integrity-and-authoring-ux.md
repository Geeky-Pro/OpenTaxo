# Unit 18 — Domain Integrity and Authoring UX

> Status: Implemented and merged in PR #7. The subsequent review record is maintained in Unit 20; additional central-definition and conversion safeguards were implemented in Units 24–27.

## Goal

Enforce the reviewed taxonomy hierarchy and improve authoring feedback without silently reclassifying legacy data or expanding the planner into operational commerce.

## Domain contract

- Root nodes are Departments.
- Department → Category.
- Category → Subcategory or Product Type.
- Subcategory → Product Type.
- Product Type is a leaf and the only attribute-schema boundary.
- New nodes and changed parent/type relationships must satisfy the hierarchy in both application/domain validation and PostgreSQL.
- Existing legacy placement mismatches are preserved until explicitly reviewed; do not bulk-reclassify them.
- Active taxonomy slugs are globally unique because the browse resolver identifies a node by its final slug segment.
- Prevent cycles and invalid reparenting.
- Archive referenced records safely; explain blocked deletion/archive actions rather than silently purging governed references.
- Attribute library search/filter and actionable deletion errors are part of the authoring UX.
- Keep Merchant Product, operational Variant, Merchant Offer, Branch Listing, pricing, inventory, checkout, and orders out of scope.

## Implementation evidence

- PR #7 merged hierarchy placement and Product Type schema safeguards, slug normalization/global active-slug uniqueness, attribute search/filter improvements, and safer deletion behavior.
- Database triggers validate new/changed placements and preserve untouched legacy mismatches.
- Unit 20 records the detailed domain review and follow-up decisions.

## Verification state

- [x] Domain/slug implementation merged and CI passed.
- [x] Legacy hierarchy mismatches were preserved rather than silently renamed.
- [ ] Recheck the current main deployment in a browser, including browse paths, reparenting, and blocked delete/archive flows.
- [ ] Keep remaining compatibility work aligned with Units 24–27 and the current architecture document.
