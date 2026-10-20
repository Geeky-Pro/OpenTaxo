---
id: installation
title: التثبيت، المتغيرات البيئية وإعداد Supabase
sidebar_position: 1
---

# التثبيت وإعداد البيئة البرمجية

يوضح هذا الدليل الخطوات التفصيلية لإعداد بيئة التطوير والتشغيل لمشروع **مخطط التصنيفات والكتالوج**، وربطها بقاعدة بيانات سوبابيز (Supabase PostgreSQL)، وضبط المتغيرات البيئية وسياسات الأمان.

---

## 1. المتطلبات البرمجية الأساسية

تأكد من توافر الأدوات التالية على بيئة عملك:

- **Node.js**: الإصدار `v20.x` أو `v22.x` (يفضل إصدار LTS الحديث)
- **مدير الحزم (npm)**: الإصدار 10 وما فوق
- **Git**: لإدارة النسخ البرمجية
- **أداة Supabase CLI** (اختيارية، لاختبار ملفات الترحيل محلياً): الإصدار `v1.x` وما فوق
- **متصفح حديث**: Chrome أو Edge أو Safari يدعم التوجيه العربي الافتراضي (RTL)

---

## 2. استنساخ المشروع وتثبيت الحزم

قم باستنساخ مستودع المشروع وتثبيت الحزم المحددة في `package-lock.json`:

```bash
# استنساخ المستودع
git clone https://github.com/Geeky-Pro/taxonomy-builder.git
cd taxonomy-builder

# تثبيت الحزم بالاعتماد الصارم على ملف القفل
npm install
```

> **تنبيه حول الإصدارات**: يعتمد المشروع على Next.js `16.4.1` و React `19.x` و Tailwind CSS `4.x`. يرجى عدم ترقية أي حزم عشوائياً بدون مراجعة توافقية كاملة.

---

## 3. إعداد المتغيرات البيئية (`.env.local`)

أنشئ ملف إعداد المتغيرات البيئية المحلية في المجلد الجذري للمشروع:

```bash
touch .env.local
```

أضف الإعدادات الخاصة بمشروع Supabase التابع لك:

```ini
# ==============================================================================
# إعدادات اتصال Supabase لـ Next.js
# ==============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# منفذ خادم التطوير (اختياري)
PORT=3000
```

### جدول المتغيرات البيئية ودورها

| المتغير | النطاق البرمجي | الغرض والوظيفة | درجة الحساسية والأمان |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | عام (الواجهة والخادم) | رابط نقطة النهاية لمشروع Supabase | عام |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | عام (الواجهة والخادم) | مفتاح الوصول العام (المحمي بسياسات RLS) | عام وآمن بوجود RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | الخادم فقط (اختياري) | مفتاح الصلاحيات الكاملة للسكربتات الإدارية | سري للغاية (يمنع تعريضه للواجهة) |

> **تحذير أمني**: مفتاح `NEXT_PUBLIC_SUPABASE_ANON_KEY` يظهر في ترويسات طلبات المتصفح. يتم تأمين جميع عمليات التعديل والإنشاء والحذف في التطبيق بواسطة سياسات **Row-Level Security (RLS)** داخل PostgreSQL وجدول الملاك المعتمدين `app_authorized_users`.

---

## 4. إعداد قاعدة البيانات ومستودع الصور في Supabase

### 4.1 ترحيل الجداول والسياسات (Database Migrations)
توجد ملفات الترحيل المنظمة والمهيكلة في مجلد `supabase/migrations/`. لتطبيقها مباشرة على قاعدة البيانات:

```bash
# عبر Supabase CLI بعد ربط المشروع
supabase link --project-ref your-project-id
supabase db push
```

أو يمكنك تشغيلها تسلسلياً عبر **محرر SQL في لوحة تحكم Supabase**:
1. `20261015175117_taxonomy_core_tables.sql`
2. `20261015175142_taxonomy_supporting_tables_and_rls.sql`
3. `20261015175318_index_foreign_keys.sql`
4. `20261015182130_snapshot_repository_rpc_functions.sql`
5. `20261015182602_atomic_catalog_snapshot_rpc.sql`
6. `20261015191025_categories_storage_bucket_and_owner_policies.sql`
7. `20261015204655_enforce_taxonomy_placement_rules.sql`
8. `20261015204746_enforce_taxonomy_placement_and_product_type_schema.sql`
9. `20261015204844_global_active_taxonomy_slug_uniqueness.sql`
10. `20261016000004_product_type_attribute_editor.sql`
11. `20261016100000_taxonomy_node_description.sql`
12. `20261016120000_central_attribute_definition_integrity.sql`
13. `20261016173835_value_unit_conversion_integrity.sql`
14. `20261016174003_measurement_unit_workflows.sql`
15. `20261016175400_rebase_archived_measurement_units.sql`
16. `20261016175606_measurement_dimension_base_invariant.sql`

### 4.2 اعتماد حساب المالك الأولي
يعتمد التطبيق على قائمة سماح صريحة للملاك. بعد إنشاء حسابك في نظام مستخدمي Supabase Auth:

```sql
-- استبدل المعرف أدناه برمز UUID الخاص بحسابك من auth.users
INSERT INTO public.app_authorized_users (user_id, is_active, note)
VALUES ('00000000-0000-0000-0000-000000000000', true, 'المالك المعتمد لمنصة الكتالوج')
ON CONFLICT (user_id) DO UPDATE SET is_active = true;
```

### 4.3 مستودع تخزين الصور (`categories` Bucket)
تم ضبط وإعداد الحاوية `categories` لتوفير وصول قراءة عام وسريع عبر CDN، مع قصر الرفع على المالك:
- **معرّف الحاوية**: `categories`
- **نمط الرابط العام**: `https://<project-id>.supabase.co/storage/v1/object/public/categories/<path>`
- **أنواع الملفات المسموحة**: `image/png`, `image/jpeg`, `image/webp`
- **الحد الأقصى لحجم الصورة**: `5 ميجابايت`

---

## 5. تشغيل خادم التطوير

شغل خادم التطوير المعتمد على محرك Turbopack السريع:

```bash
npm run dev
```

افتح الرابط [http://localhost:3000](http://localhost:3000) في المتصفح. سيعمل التطبيق افتراضياً باللغة العربية والتوجيه من اليمين إلى اليسار (RTL).

---

## 6. فحص وتدقيق الجودة قبل النشر

قبل إرسال التغييرات أو تجهيز حزم الإنتاج، تحقق من سلامة الأنواع والبناء:

```bash
# فحص سلامة أنواع TypeScript بدون أخطاء
npx tsc --noEmit

# التحقق من نجاح بناء نسخة الإنتاج الكاملة
npm run build
```
