# YCP مخطط التصنيفات (Android — Kotlin & Jetpack Compose)

أداة تخطيط ونمذجة مرئية لبنية تصنيفات المتجر الإلكتروني وإدارة الكتالوج المركزي (YCP Taxonomy & Catalog Planner) مبنية كتطبيق أندرويد أصيل باستخدام **Kotlin** و **Jetpack Compose (Material 3)** مع دعم كامل للغة العربية (RTL).

## الميزات ومساحات العمل

1. **لوحة التحكم (`Dashboard`)**:
   - ملخص إحصائي فوري لإجمالي العقد النشطة، أنواع المنتجات (`Product Types`)، الخصائص العامة، والأقسام الرئيسية.
   - وصول سريع إلى جميع مساحات العمل والبحث الفوري (`Spotlight`) وتصدير JSON.
2. **شجرة التصنيفات (`Tree Workspace`)**:
   - استعراض هرمي متدرج (`Department → Category → Subcategory → Product Type`).
   - وضع التركيز وعزل الفروع (`Focus / Isolate Subtree Mode`) مع مسار تنقل (`Breadcrumbs`).
   - درج التعديل السريع (`ModalBottomSheet`) ونافذة نقل التصنيف (`Reparent Modal`) مع تطبيق قاعدة استبعاد الأحفاد (`Subtree Disqualification Rule`).
3. **إدارة التصنيفات وتفاصيل نوع المنتج (`Taxonomy List & Category/Product Type Detail`)**:
   - تصفية وبحث شامل في جميع العقد النشطة والمؤرشفة.
   - اختيار صورة التصنيف عبر منتقي الصور الآمن (`ActivityResultContracts.PickVisualMedia`).
   - محرر خصائص `Product Type` لضبط الإلزامية، الفلترة، محاور المتغيرات (`Variant Axes`)، الحدود الرقمية، الوحدات المتوافقة، ومجموعات القيم.
4. **معرض المتجر (`Storefront Simulator & Product Blueprint`)**:
   - تصفح الأقسام كما تظهر في المتجر ومعاينة بطاقة مواصفات المنتج النهائي التفاعلية.
5. **التعريفات المركزية (`Central Definitions` — 5 مراكز)**:
   - **مركز الخصائص (`Attributes Center`)** والمرادفات (`Aliases`).
   - **مركز أنواع البيانات (`Data Types Center`)** الأربعة المحكومة (`string`, `number`, `boolean`, `enum`).
   - **مركز القيم (`Value Sets Center`)** للخصائص من نوع `enum`.
   - **مركز الوحدات والأبعاد الفيزيائية (`Measurements Center`)** مع إعادة تعيين الوحدة الأساسية ذرياً (`Transactional Base Unit Rebase`).
   - **قواعد التحويل وحاسبة الوحدات (`Unit Conversions & Calculator`)**.
6. **التخزين والمزامنة والتصدير**:
   - قاعدة بيانات **Room SQLite** محلية تعمل بدون اتصال مع بيانات أولية كاملة.
   - مزامنة اختيارية مع **Supabase REST / Auth** عبر إعدادات البيئة.
   - تصدير الكتالوج المثرى (`Enriched JSON`) للنسخ أو المشاركة عبر نظام أندرويد (`Intent.ACTION_SEND`).
