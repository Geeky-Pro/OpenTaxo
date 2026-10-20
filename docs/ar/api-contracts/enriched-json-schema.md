---
id: enriched-json-schema
title: مواصفات كائن الـ JSON المخصب المصدّر
sidebar_position: 2
---

# مواصفات كائن الـ JSON المخصب والتكامل مع YCP

يحدد هذا المستند المخطط القياسي الرسمي (JSON Schema Specification) لكائن الكتالوج المخصب المصدّر لتغذية **محرك الاستيراد والتكامل لمنصة YCP**.

---

## 1. الدور المعماري في منظومة YCP

يجب ألا تقوم الخدمات الفرعية للمتجر (مثل فهارس Elasticsearch/Typesense، وتطبيقات الجوال، وبوابات إدراج منتجات التجار) بإجراء استعلامات SQL متكررة ومعقدة لإعادة بناء شجرة التصنيفات والخصائص من الصفر.

يقوم **ملف الكتالوج المخصب المسطح** بحساب ودمج ما يلي مسبقاً:

1. **المسارات وشريط التتبع (Breadcrumbs)**: مسارات نصية مجهزة بالكامل للعرض الفوري في الواجهات.
2. **عمق العقدة (Depth)**: رقم صحيح جاهز لتطبيق فلاتر التصفية والتصنيف الهرمي.
3. **قواميس الخصائص المفككة**: الخصائص، وأدوارها، وأنماط فلاترها، ووحداتها، وقيمها المحددة مضمنة مباشرة داخل العقدة الورقية.

```mermaid
graph LR
    Planner[مخطط التصنيفات] -->|GET /api/export| JSON[كائن JSON المخصب المسطح]
    JSON --> SearchEngine[محرك البحث والفهرسة Typesense / Elastic]
    JSON --> MerchantPortal[بوابة إدراج ومطابقة منتجات التجار]
    JSON --> MobileAPI[بوابة واجهة تطبيقات المتجر]
```

---

## 2. تعريف واجهات TypeScript البرمجية

من الملف `lib/utils/export.ts`:

```typescript
export interface EnrichedAttributeExport {
  attribute_id: string;
  name_ar: string;
  name_en?: string;
  data_type: 'number' | 'enum' | 'string' | 'boolean';
  filter_type: 'range' | 'checkbox' | 'select' | 'toggle' | 'color_swatch' | 'button_group';
  unit: string | null;
  role: 'identity' | 'variant' | 'descriptive' | 'commercial';
  group?: string;
  is_variant: boolean;
  allowed_values: string[];
}

export interface EnrichedBreadcrumb {
  id: string;
  name_ar: string;
  slug: string;
}

export interface EnrichedCategoryExport {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  node_type: 'department' | 'category' | 'subcategory' | 'product_type';
  parent_id: string | null;
  path: string; // مثال: "الكهرباء والإنارة / الإضاءة / لمبات / لمبة LED"
  depth: number; // 0 للجذر، 1، 2، إلخ
  breadcrumbs: EnrichedBreadcrumb[];
  image: string | null;
  attributes: EnrichedAttributeExport[];
}
```

---

## 3. المخطط القياسي الكامل (JSON Schema Draft 7)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "YCPEnrichedCatalogExportArabic",
  "type": "array",
  "items": {
    "type": "object",
    "required": [
      "id",
      "name_ar",
      "slug",
      "node_type",
      "path",
      "depth",
      "breadcrumbs",
      "attributes"
    ],
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "name_ar": {
        "type": "string",
        "minLength": 1
      },
      "name_en": {
        "type": ["string", "null"]
      },
      "slug": {
        "type": "string",
        "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
      },
      "node_type": {
        "type": "string",
        "enum": ["department", "category", "subcategory", "product_type"]
      },
      "parent_id": {
        "type": ["string", "null"],
        "format": "uuid"
      },
      "path": {
        "type": "string",
        "description": "المسار الهرمي مفصولاً بشرطات مائلة بالعربية"
      },
      "depth": {
        "type": "integer",
        "minimum": 0,
        "maximum": 5
      },
      "breadcrumbs": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["id", "name_ar", "slug"],
          "properties": {
            "id": { "type": "string", "format": "uuid" },
            "name_ar": { "type": "string" },
            "slug": { "type": "string" }
          }
        }
      },
      "image": {
        "type": ["string", "null"],
        "format": "uri"
      },
      "attributes": {
        "type": "array",
        "items": {
          "type": "object",
          "required": [
            "attribute_id",
            "name_ar",
            "data_type",
            "filter_type",
            "role",
            "is_variant",
            "allowed_values"
          ],
          "properties": {
            "attribute_id": { "type": "string", "format": "uuid" },
            "name_ar": { "type": "string" },
            "name_en": { "type": "string" },
            "data_type": {
              "type": "string",
              "enum": ["string", "number", "boolean", "enum"]
            },
            "filter_type": {
              "type": "string",
              "enum": ["range", "checkbox", "select", "toggle", "color_swatch", "button_group"]
            },
            "unit": { "type": ["string", "null"] },
            "role": {
              "type": "string",
              "enum": ["identity", "variant", "descriptive", "commercial"]
            },
            "group": { "type": "string" },
            "is_variant": { "type": "boolean" },
            "allowed_values": {
              "type": "array",
              "items": { "type": "string" }
            }
          }
        }
      }
    }
  }
}
```
