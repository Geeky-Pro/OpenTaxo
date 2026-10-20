---
id: value-sets
title: Centralized Value Sets & Vocabulary Governance
sidebar_position: 4
---

# Centralized Value Sets & Vocabulary Governance

This document details the architecture and lifecycle management of **Enum Value Sets** (`attribute_value_sets`) and discrete **Attribute Values** (`attribute_values`).

```mermaid
graph TD
    subgraph CentralCenter [Value Center /value-sets]
        VS[Value Set: Phone Colors / ألوان الهواتف<br/>key: phone_colors]
        V1[Value: Midnight Black / أسود ليلي<br/>key: midnight_black | raw: #121212]
        V2[Value: Starlight White / أبيض لؤلؤي<br/>key: starlight_white | raw: #F8F9FA]
        VS --> V1
        VS --> V2
    end

    subgraph ProductTypeSchemas [Product Type Schemas]
        PT1[Smartphones - هواتف ذكية]
        PT2[Smartwatches - ساعات ذكية]
    end

    VS -.->|Reused across schemas| PT1
    VS -.->|Reused across schemas| PT2
```

---

## 1. Architectural Mission

Free-text entry for enumerated attributes (e.g., colors, clothing sizes, material finishes, wireless protocols) inevitably causes catalog fragmentation:
- A merchant types `"Red"`, another `"Dark Red"`, another `"أحمر"`, and another `"#FF0000"`.
- Customer search filters fail because queries cannot group synonymous variants.

**Value Sets** solve this by enforcing:
1. **Reusability**: Define a standardized palette once (e.g., `Standard Colors`) and reuse it across Smartphones, Tablets, and Headphones.
2. **Stable Keys**: The internal programmatic key (`midnight_black`) remains constant across all database records and API feeds, regardless of language translations.
3. **Bilingual Labels**: Separate Arabic (`أسود ليلي`) and English (`Midnight Black`) display labels for seamless localization.
4. **Technical Raw Value**: An optional raw payload (e.g., HEX color `#121212` or hardware code) for rich UI rendering (color swatches).

---

## 2. Relational Schema & Constraints

### 2.1 `attribute_value_sets`
Represents the container group:

```sql
create table public.attribute_value_sets (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  key text not null unique check (length(btrim(key)) > 0),
  name_ar text not null check (length(btrim(name_ar)) > 0),
  name_en text null,
  attribute_id uuid null references public.attributes(id) on delete restrict,
  sort_order integer not null default 0,
  status text not null default 'active' check (status in ('active','archived')),
  source_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null
);
```

- **Attribute Association**: If `attribute_id` is set, the Value Set is dedicated to that specific attribute. If `attribute_id` is `null`, it is a **General Reusable Set** available to any compatible `enum` attribute.

### 2.2 `attribute_values`
The individual discrete options:

```sql
create table public.attribute_values (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  value_set_id uuid not null references public.attribute_value_sets(id) on delete restrict,
  value_key text not null check (length(btrim(value_key)) > 0),
  label_ar text not null check (length(btrim(label_ar)) > 0),
  label_en text null,
  raw_value text null,
  sort_order integer not null default 0,
  status text not null default 'active' check (status in ('active','archived')),
  source_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  unique (value_set_id, value_key)
);
```

- **Scoped Uniqueness**: The `value_key` is unique within its parent `value_set_id`.

---

## 3. Safe Archival Governance

To ensure transactional safety in active marketplaces:
- **Active Usage Guard**: A Value Set cannot be archived if it is currently assigned to an active Product Type schema:
  ```text
  "لا يمكن أرشفة مجموعة القيم وهي مستخدمة في نوع منتج نشط؛ افصل الارتباط أولاً."
  ```
- **Soft Deletion**: Records are updated with `status = 'archived'` and an `archived_at` timestamp. Historical product records retain referential integrity.
