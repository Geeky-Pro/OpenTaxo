---
id: taxonomy-hierarchy
title: Taxonomy Hierarchy & 4-Tier Governance
sidebar_position: 1
---

# Taxonomy Hierarchy & 4-Tier Governance

This document details the mathematical and domain rules governing the 4-tier taxonomy structure in the **Taxonomy & Catalog Planner**.

```mermaid
graph TD
    Dept["Department (القسم الرئيسي) - Root Level"]
    Cat["Category (التصنيف) - Level 1"]
    Subcat["Subcategory (التصنيف الفرعي) - Level 2 (Optional)"]
    ProdType["Product Type (نوع المنتج) - Leaf Level (Schema Boundary)"]

    Dept -->|Contains| Cat
    Cat -->|Contains (Optional)| Subcat
    Cat -->|Directly Contains Leaf| ProdType
    Subcat -->|Contains Leaf| ProdType

    style ProdType fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#000
```

---

## 1. The 4-Tier Model Overview

The taxonomy model enforces strict semantic separation between **navigational hierarchy** and **product specification schemas**:

| Level | Node Type | Semantic Definition | Can Have Children? | Holds Bound Attributes? | Example |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **0** | `department` | Broadest top-level business department | Yes (`category` only) | ❌ No | `الإلكترونيات والأجهزة` |
| **1** | `category` | Major product vertical or group | Yes (`subcategory` or `product_type`) | ❌ No | `أجهزة الحاسوب المحمولة` |
| **2** | `subcategory` | Optional specialization grouping | Yes (`product_type` only) | ❌ No | `حواسيب الألعاب الاحترافية` |
| **3** | `product_type` | Specific sellable commodity classification | ❌ No (Strict Leaf) | ✅ **YES (Schema Boundary)** | `حاسوب محمول فائق الأداء` |

---

## 2. Invariants & Domain Rules

### Rule 2.1: The Leaf-Only Attribute Invariant
> **Non-Negotiable**: *Only `product_type` holds bound attribute schemas; upper nodes (`department`, `category`, `subcategory`) are strictly for customer navigation and aggregation.*

- **Rationale**: In e-commerce, allowing abstract parent nodes (e.g., `Electronics`) to define attributes leads to schema inheritance nightmares. A Television and a Laptop share very few physical specifications (screens differ in panel technology, ports, refresh rates; laptops have RAM and CPUs). Binding attributes exclusively to `product_type` guarantees that every product listing maps to an unambiguous, highly granular schema.

### Rule 2.2: Deterministic Parent-Child Relations
The placement validator (`validateNodePlacement` in `lib/utils/tree.ts`) enforces allowed child types:
- A `department` can **only** be a root node (`parent_id = null`).
- A `category` can **only** be parented by a `department`.
- A `subcategory` can **only** be parented by a `category`.
- A `product_type` can be parented by a `category` **or** a `subcategory`.
- A `product_type` can **never** have children.

```typescript
export const ALLOWED_CHILDREN: Record<Category['node_type'], Category['node_type'][]> = {
  department: ['category'],
  category: ['subcategory', 'product_type'],
  subcategory: ['product_type'],
  product_type: [],
};
```

### Rule 2.3: Derived Depth & Materialized Path
To prevent hierarchy drift:
- Node depth ($0, 1, 2, 3$) is **never stored** as an editable column. It is dynamically derived from the parent chain.
- Materialized paths (e.g., `"الكهرباء والإنارة / الإضاءة / لمبات"`) are computed from root to leaf, ensuring that renaming any ancestor automatically updates paths across the catalog without stale pointers.

---

## 3. Reparenting & The Subtree Disqualification Algorithm

When restructuring a category tree, moving a node must never create a cycle (e.g., making a parent a child of its own descendant).

The application uses the **Subtree Disqualification Algorithm** (`getForbiddenParentIds` in `lib/utils/tree.ts`):

```typescript
export function getForbiddenParentIds(categoryId: string, categories: Category[]): Set<string> {
  const forbidden = new Set<string>();
  
  // 1. A node cannot be parent to itself
  forbidden.add(categoryId);
  
  // 2. Its current parent is redundant
  const target = categories.find(c => c.id === categoryId);
  if (target && target.parent_id) {
    forbidden.add(target.parent_id);
  }
  
  // 3. Disqualify all descendants in the entire subtree
  const descendants = getDescendants(categoryId, categories);
  for (const desc of descendants) {
    forbidden.add(desc.id);
  }
  
  return forbidden;
}
```

### Invalidation & UI Feedback:
During reparenting in the Tree View or Node Details page:
- Any node appearing in `forbiddenParentIds` is disabled in parent dropdowns.
- If an invalid mutation is submitted, PostgreSQL deferred trigger `check_taxonomy_parent_placement` rejects the transaction with error code `23514`.

---

## 4. Deletion & Archival Governance (Cascade Clean)

Hard deletion is prohibited for populated nodes:
1. **Child Check**: If a node has active child categories, deletion is blocked:
   $$\text{Active Children} > 0 \implies \text{Reject: "انقل التصنيفات الفرعية أو احذفها أولاً"}$$
2. **Attribute Check**: If a `product_type` has active attribute bindings, deletion is blocked until bindings are removed.
3. **Safe Archival**: Empty leaf nodes or unreferenced nodes are marked `status = 'archived'` with an `archived_at` timestamp. Historical product records retain referential integrity.
