---
id: export-pipeline
title: مسار التصدير (/api/export)
sidebar_position: 1
---

# مسار التصدير البرمجي ونقطة نهاية الـ HTTP (`/api/export`)

يوفر هذا المستند مواصفة تقنية دقيقة لنقطة نهاية معالج المسار `/api/export`، متضمناً اتفاقيات الطلب والاستجابة، ومعايير الأمان، ومعاملات التحميل والتنزيل.

```mermaid
sequenceDiagram
    autonumber
    actor Client as النظام المستهلك (محرك البحث / المدير)
    participant Route as معالج المسار (/api/export)
    participant Guard as بوابة الأمان requireOwner
    participant ExpUtil as أداة التخصيب lib/utils/export.ts
    participant DB as قاعدة بيانات Supabase PostgreSQL

    Client->>Route: طلب GET /api/export?download=true
    Route->>Guard: التحقق من جلسة المالك المعتمد
    Guard-->>Route: تم التحقق بنجاح
    Route->>ExpUtil: استدعاء generateEnrichedCatalog()
    ExpUtil->>DB: استعلام التصنيفات والخصائص النشطة
    DB-->>ExpUtil: إرجاع السجلات العلائقية الخام
    ExpUtil->>ExpUtil: احتساب المسارات وتفكيك الخصائص
    ExpUtil-->>Route: كائن الكتالوج المخصب المسطح
    Route-->>Client: 200 OK (Content-Disposition: attachment, application/json)
```

---

## 1. مواصفات نقطة نهاية الـ HTTP

- **طريقة الطلب (HTTP Method)**: `GET`
- **المسار (Path)**: `/api/export`
- **المصادقة (Authentication)**: إلزامية (كوكيز جلسة Supabase Auth + مستخدم معتمد نشط في `app_authorized_users`)
- **تنسيق الاستجابة الافتراضي**: `application/json; charset=utf-8`

### 1.1 معاملات الاستعلام (Query Parameters)

| المعامل | النوع | هل هو إلزامي؟ | القيمة الافتراضية | الوصف |
| :--- | :--- | :---: | :---: | :--- |
| `download` | `boolean` | اختياري | `false` | عند ضبطه على `true`، يضيف الترويسة `Content-Disposition: attachment; filename="catalog-taxonomy-enriched.json"` لتنزيل الملف مباشرة في المتصفح. |

---

## 2. أمثلة الاستعلام والاستجابة

### 2.1 طلب برمجياً عبر cURL

```bash
curl -X GET "https://your-domain.com/api/export" \
  -H "Cookie: sb-access-token=eyJhbGciOi..." \
  -H "Accept: application/json"
```

### 2.2 ترويسات الاستجابة الناجحة (Response Headers)

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Disposition: attachment; filename="catalog-taxonomy-enriched.json"
Cache-Control: no-store, max-age=0
```

### 2.3 عينة من كائن الاستجابة (JSON Payload)

```json
[
  {
    "id": "e4b2d308-3a1e-450f-a49e-ec80d19f2a01",
    "name_ar": "هواتف ذكية",
    "name_en": "Smartphones",
    "slug": "smartphones",
    "node_type": "product_type",
    "parent_id": "c1f7b820-2d8c-4a33-87f5-231908bf9a11",
    "path": "الأجهزة الإلكترونية / الهواتف المحمولة / هواتف ذكية",
    "depth": 2,
    "breadcrumbs": [
      {
        "id": "a9e102f4-7c3d-4e56-9b11-209847120381",
        "name_ar": "الأجهزة الإلكترونية",
        "slug": "consumer-electronics"
      },
      {
        "id": "c1f7b820-2d8c-4a33-87f5-231908bf9a11",
        "name_ar": "الهواتف المحمولة",
        "slug": "mobile-phones"
      }
    ],
    "image": "https://your-project.supabase.co/storage/v1/object/public/categories/smartphones-banner.webp",
    "attributes": [
      {
        "attribute_id": "f8a12b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
        "name_ar": "سعة التخزين الداخلي",
        "name_en": "Internal Storage",
        "data_type": "number",
        "filter_type": "button_group",
        "unit": "GB",
        "role": "variant",
        "group": "الذاكرة والأداء",
        "is_variant": true,
        "allowed_values": ["128", "256", "512", "1024"]
      }
    ]
  }
]
```

---

## 3. رموز وأخطاء الاستجابة (Error Handling)

| رمز الحالة | رسالة الخطأ | السبب وطريقة الحل |
| :---: | :--- | :--- |
| `307 Temporary Redirect` | تحويل تلقائي إلى `/login` | الجلسة مفقودة أو منتهية الصلاحية. |
| `307 Temporary Redirect` | تحويل تلقائي إلى `/unauthorized` | المستخدم مسجل لكنه غير موجود في قائمة الملاك المعتمدين `app_authorized_users`. |
| `500 Internal Server Error` | `{"error": "Failed to generate export"}` | خطأ غير متوقع أثناء الاتصال بقاعدة البيانات أو معالجة التخصيب. |
