---
id: value-sets
title: مستودعات القيم المركزية وحوكمة المصطلحات
sidebar_position: 4
---

# مستودعات القيم المركزية وحوكمة المصطلحات

يوضح هذا المستند بنية ودورة حياة **مجموعات القيم المركزية** (`attribute_value_sets`) والخيارات الفردية المندرجة تحتها (`attribute_values`).

```mermaid
graph TD
    subgraph CentralCenter [مركز القيم /value-sets]
        VS[مجموعة القيم: ألوان الهواتف<br/>المفتاح: phone_colors]
        V1[قيمة: أسود ليلي<br/>المفتاح: midnight_black | الخام: #121212]
        V2[قيمة: أبيض لؤلؤي<br/>المفتاح: starlight_white | الخام: #F8F9FA]
        VS --> V1
        VS --> V2
    end

    subgraph ProductTypeSchemas [مخططات أنواع المنتجات]
        PT1[هواتف ذكية]
        PT2[ساعات ذكية]
    end

    VS -.->|إعادة استخدام عبر المخططات| PT1
    VS -.->|إعادة استخدام عبر المخططات| PT2
```

---

## 1. الهدف الهندسي والاستراتيجي

يؤدي الإدخال النصي الحر لسمات الخيارات الثابتة (مثل الألوان، المقاسات، أنواع التوصيلات) إلى تشتت حتمي في الكتالوج:

- تاجر يُدخل `"أحمر"`، وآخر `"أحمر غامق"`، وثالث `"Red"`، ورابع `"#FF0000"`.
- تفشل فلاتر المتجر في تجميع الخيارات المتشابهة تحت خيار تصفية واحد.

توفر **مجموعات القيم المركزية** حلاً جذرياً عبر:

1. **إعادة الاستخدام (Reusability)**: تعريف لوحة الألوان أو مقاسات الملابس مرة واحدة واستخدامها في عدة أنواع منتجات.
2. **ثبات المفاتيح البرمجية (Stable Keys)**: يبقى المفتاح البرمجي (`midnight_black`) ثابتاً في قواعد البيانات والتكاملات، بصرف النظر عن لغة العرض أو الترجمة.
3. **تسميات ثنائية اللغة**: دعم كامل للتسمية العربية (`أسود ليلي`) والإنجليزية (`Midnight Black`).
4. **القيمة الخام التقنية (Raw Value)**: إمكانية تخزين قيمة لونية بتنسيق HEX (مثل `#121212`) لعرضها في المتجر كمربعات ألوان بصرية (Color Swatches).

---

## 2. البنية العلائقية والقيود

### 2.1 جدول مجموعات القيم (`attribute_value_sets`)

يمثل المجموعة الحاوية:

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

- **نوع الارتباط**: إذا تم تحديد `attribute_id` تصبح المجموعة خاصة بتلك الخاصية فقط؛ أما إذا كان الحقل فارغاً فتعتبر **مجموعة عامة قابلة لإعادة الاستخدام** في أي خاصية من نوع قائمة محددة (`enum`).

### 2.2 جدول القيم الفردية (`attribute_values`)

يمثل الخيارات التفصيلية المندرجة:

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

- **فرادة المفتاح**: المفتاح `value_key` فريد محلياً داخل المجموعة نفسها عبر القيد `unique (value_set_id, value_key)`.

---

## 3. حوكمة الأرشفة الآمنة

لحماية الكتالوج الحي من التلف:

- **حظر أرشفة المجموعات النشطة المستعملة**: يمنع النظام أرشفة أي مجموعة قيم إذا كانت مستخدمة في نوع منتج نشط:

  ```text
  "لا يمكن أرشفة مجموعة القيم وهي مستخدمة في نوع منتج نشط؛ افصل الارتباط أولاً."
  ```

- **الأرشفة بدلاً من الحذف**: تُحفظ السجلات بصيغة `status = 'archived'` للحفاظ على تكامل البيانات التاريخية للمنتجات المباعة مسبقاً.
