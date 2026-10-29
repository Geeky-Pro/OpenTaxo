# YCP Taxonomy & Catalog Planner — خطة التحويل إلى تطبيق أندرويد

تحويل منصة **YCP لتخطيط وإدارة التصنيفات والكتالوج المركزي** من تطبيق ويب (Next.js) إلى تطبيق أندرويد أصيل (Kotlin + Jetpack Compose) يعمل بكفاءة عالية باللغة العربية (RTL) مع حفظ محلي فوري عبر **Room SQLite** ومزامنة سحابية اختيارية مع **Supabase PostgreSQL** وتصدير الكتالوج المثرى (Enriched JSON) ومشاركته مباشرة عبر نظام أندرويد.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> تم اعتماد القرارات التالية بناءً على إجاباتك في المرحلة الأولى:

- **Confirmed Decision 1 — التخزين والمزامنة (Local Room + Cloud Supabase Sync)**: استخدام قاعدة بيانات **Room** محلية مزودة بجميع البيانات الأولية للتصنيفات والخصائص والوحدات لضمان العمل الفوري دون انقطاع، مع طبقة مزامنة سحابية ثنائية الاتجاه مع **Supabase REST API** عند توفر مفاتيح الربط في إعدادات البيئة (`BuildConfig`).
- **Confirmed Decision 2 — الدخول المباشر مع قفل المالك (Direct Access + Owner Lock)**: يفتح التطبيق مباشرة على لوحة التحكم ومساحات العمل مع إمكانية تفعيل أو إلغاء **وضع قفل المالك (Owner Authoring Lock / Read-Only Mode)** لحماية البنية من التعديلات غير المقصودة أو تسجيل الدخول بحساب المالك للمزامنة السحابية.
- **Confirmed Decision 3 — نطاق الميزات الكامل وتصدير النظام (Full Workspace Suite + System Share)**: تضمين جميع مساحات العمل (لوحة التحكم، إدارة التصنيفات، شجرة التصنيفات، معرض المتجر ومحاكاة بطاقة المنتج، محرر خصائص `Product Type`، والمراكز الخمسة للتعريفات المركزية: الخصائص، أنواع البيانات، مجموعات القيم، الوحدات والأبعاد، وقواعد التحويل + حاسبة التحويل، بالإضافة إلى البحث الفوري Spotlight وتصدير JSON المثرى ومشاركته عبر Android Share Sheet).

---

## 1. Overview & Core Concept

- **What It Does**: أداة تخطيط ونمذجة مرئية لبنية تصنيفات المتجر الإلكتروني متعدد التجار (YCP)، تتيح بناء الشجرة الهرمية (`Department → Category → Subcategory → Product Type`)، وتعريف القاموس المركزي للخصائص والوحدات ومجموعات القيم، وربط الخصائص بأنواع المنتجات النهائية (`Product Type`) وتوليد ملف JSON المثرى.
- **Target Audience / Persona**: مهندس المنصة أو مدير الكتالوج الذي يصمم ويراجع هيكلية التصنيفات ومواصفات المنتجات باللغة العربية (مع دعم المسميات الإنجليزية والـ Slugs البرمجية).
- **Key Value**: تجربة أندرويد أصلية سريعة تدعم اللمس والسحب، وتعمل في وضع عدم الاتصال مع مزامنة سحابية، وتطبق جميع قواعد سلامة الشجرة والتوافق الدلالي للخصائص والوحدات.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **لوحة التحكم (`Dashboard`)**: عرض إحصائيات الكتالوج الحية (إجمالي العقد، أنواع المنتجات، الخصائص، الأقسام الرئيسية)، حالة المزامنة السحابية، وبطاقات الوصول السريع لجميع مساحات العمل، مع زر البحث السريع (Spotlight) وقائمة التصدير.
  2. **شجرة التصنيفات (`Tree Workspace`)**: استعراض هرمي متدرج مع خطوط إرشادية عمودية، طي/توسيع الفروع، **وضع التركيز (Focus / Isolate Subtree Mode)** مع مسار تنقل علوي (Breadcrumbs)، والنقر السريع لفتح **درج التعديل السريع (Quick Edit Bottom Sheet)** أو نقل التصنيف (`Reparent Modal`) مع منع الحلقات التكرارية (Subtree Disqualification).
  3. **إدارة التصنيفات (`Taxonomy List`) وتفاصيل العقدة (`Category & Product Type Editor`)**: بحث وتصفية حسب نوع العقدة والحالة (نشط/مؤرشف)، تعديل شامل للبيانات والصورة (باستخدام منتقي الصور الآمن `PickVisualMedia`)، وعند كون العقدة `Product Type` يظهر محرر ربط الخصائص (`Attribute Binding`) لضبط الإلزامية، الفلترة، متغيرات المنتج (`Variant Axes`)، الحدود الرقمية، الوحدة المتوافقة، ومجموعة القيم.
  4. **معرض المتجر (`Storefront Simulator`)**: تصفح الأقسام كما يراها المتسوق وصولاً إلى عرض **بطاقة مواصفات المنتج النهائي (`Product Blueprint`)** التي تحاكي شكل الفلاتر وخيارات المتغيرات.
  5. **التعريفات المركزية (`Central Definitions` — 5 مراكز)**:
     - **مركز الخصائص (`Attributes`)**: إدارة المفاتيح، الأسماء العربية/الإنجليزية، الأسماء البديلة (`Aliases`)، نوع البيانات، نمط الفلترة المتوافق، والبُعد الفيزيائي.
     - **مركز أنواع البيانات (`Data Types`)**: مرجع تفاعلي للأنواع الأربعة المحكومة (`string`, `number`, `boolean`, `enum`) ومصفوفة توافق الفلاتر.
     - **مركز القيم (`Value Sets`)**: إدارة مجموعات القيم للخصائص من نوع `enum` وخياراتها وترتيبها وأرشفتها.
     - **مركز الوحدات والأبعاد (`Measurements`)**: إدارة الأبعاد الفيزيائية والوحدات ومعاملات التحويل للوحدة الأساسية (`Base Unit Rebase`).
     - **قواعد التحويل وحاسبة الوحدات (`Unit Conversions`)**: إدارة قواعد التحويل الصريحة وحاسبة فورية للتحويل بين الوحدات المتوافقة ضمن نفس البُعد.

- **Visual Identity & Theme**:
  - **Aesthetic Direction**: تصميم **Functional Elegance** احترافي عالي الكثافة المعلوماتية، مخصص للعربية من اليمين إلى اليسار (`LayoutDirection.Rtl`) مع دعم أصيل للوضعين الفاتح والداكن (OLED-friendly Dark Mode).
  - **Color Palette & Mood**:
    - الفاتح: خلفية نقية (`#FFFFFF`)، بطاقات وأقسام فرعية (`#F8FAFC`)، نص أساسي كحلي داكن (`#0F172A`)، أزرق علامة YCP الأساسي (`#2563EB`)، وأحمر تحذيري (`#EF4444`) للإجراءات الحساسة.
    - الداكن: خلفية داكنة عميقة (`#030712` / `#090D16`)، أسطح مرتفعة (`#111827`)، وأزرق ساطع (`#3B82F6`).
  - **Typography & Hierarchy**: خط **IBM Plex Sans Arabic** المدمج محلياً للعناوين والنصوص العربية، مع خط أحادي المسافة (`Monospace`) لعرض المفاتيح البرمجية (`slug`, `key`, ومعادلات التحويل) باتجاه `LTR`.
  - **Component Styling & Layout**: شريط تنقل سفلي (`NavigationBar`) على الهواتف يتحول إلى شريط جانبي (`NavigationRail`) على الشاشات العريضة والأجهزة اللوحية، مع نوافذ سفلية (`ModalBottomSheet`) للتعديل السريع وحوارات بحث فورية (`Spotlight Dialog`).
- **Interactive Feedback & Motion**: حركات سلسة لتوسيع/طي فروع الشجرة، تمييز بصري للعقد المستبعدة عند النقل، إشعارات (`Snackbar`) واضحة لكل عملية حفظ أو رفض بسبب قواعد السلامة، ومؤشر حالة المزامنة.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: معمارية Offline-First مع Room + مزامنة Supabase REST**
  - *Chosen Approach*: جعل قاعدة بيانات **Room** المصدر الفوري لواجهة المستخدم (`Flow`) مع تزويدها ببيانات البذرة الكاملة (الأقسام والإنارة والخصائص والوحدات)، وتوفير خدمة مزامنة (`SupabaseSyncService`) تتصل بـ Supabase عند ضبط `NEXT_PUBLIC_SUPABASE_URL` و`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` في لوحة الأسرار (Secrets).
  - *Why*: يضمن سرعة استجابة لحظية (0ms latency) أثناء تحرير الشجرة على الهاتف مع الحفاظ على التوافق الكامل مع قاعدة بيانات Supabase المشتركة.
  - *Alternatives Considered*: الاعتماد الحصري على الشبكة (يرفض العمل بدون اتصال أو عند غياب إعدادات البيئة).
- **Decision 2: فرض قواعد سلامة الدومين محلياً ومطابقتها لقواعد PostgreSQL**
  - *Chosen Approach*: تطبيق جميع القواعد الصارمة في طبقة الدومين بلغة Kotlin: تسلسل `Department → Category → Subcategory → Product Type`، قصر ربط الخصائص على `Product Type`، منع الحلقات التكرارية (`Cycle Prevention`)، التحقق من توافق `DataType` مع `FilterType`، ومنع الحذف النهائي للسجلات المرتبطة واستبداله بالأرشفة الآمنة (`Safe Archive`).
  - *Why*: يحافظ على تطابق السلوك 100% مع المواصفات المعتمدة في المشروع ويمنع فساد البيانات قبل المزامنة أو التصدير.
- **Decision 3: تصدير JSON المثرى ومشاركته عبر النظام**
  - *Chosen Approach*: توليد هيكل `EnrichedCategoryExport` كامل مع المسارات المادية (`path`)، العمق (`depth`)، مسار التنقل (`breadcrumbs`)، والخصائص المحلولة، مع إمكانية استعراضه، نسخه إلى الحافظة، أو مشاركته كملف `.json` عبر `Intent.ACTION_SEND`.
  - *Why*: يوفر سير عمل متكامل على أندرويد يغني عن نقطة النهاية `/api/export` في المتصفح.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                  Jetpack Compose UI Layer (RTL Arabic-First)                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────────────┐  │
│  │  Dashboard   │ │ Taxonomy Tree│ │  Storefront  │ │ Central Definitions │  │
│  │ & Spotlight  │ │ & QuickSheet │ │  Simulator   │ │ (5 Centers + Calc)  │  │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────────┬──────────┘  │
│         └────────────────┴────────┬───────┴────────────────────┘             │
│                                   ▼                                          │
│                  Category / Product Type Detail & Export UI                  │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │ StateFlow / UI Actions
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     ViewModel & Domain Validation Layer                      │
│  • Hierarchy Rules (Dept → Cat → Subcat → ProductType, Cycle Disqualifier)   │
│  • Attribute Compatibility Matrix (DataType ↔ FilterType ↔ Dimension/Values) │
│  • Unit Conversion Engine (Canonical Base Factors & Rebase Recalculation)    │
│  • Enriched Catalog JSON Generator & Owner Lock / Auth Session Manager       │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │ Repository Contract
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                       CatalogRepository (Offline-First)                      │
│         ┌─────────────────────────┴─────────────────────────┐                │
│         ▼                                                   ▼                │
│  ┌───────────────────────────────────┐     ┌──────────────────────────────┐  │
│  │   Room Database (Local SQLite)    │◄───►│   Supabase Cloud Sync Engine │  │
│  │ • taxonomy_nodes                  │     │ • PostgREST / Auth HTTP Sync │  │
│  │ • attributes & aliases            │     │ • Reads BuildConfig Secrets  │  │
│  │ • product_type_attributes         │     │ • Push/Pull Snapshot & Delta │  │
│  │ • value_sets & attribute_values   │     └──────────────────────────────┘  │
│  │ • dimensions, units & conv_rules  │                                       │
│  └───────────────────────────────────┘                                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State
- **TaxonomyNodeEntity**: يحفظ المعرف (`id`)، نوع العقدة (`department`, `category`, `subcategory`, `product_type`)، الاسمين العربي والإنجليزي، الوصف، الرابط (`slug` الفريد للعقد النشطة)، معرف الأب (`parentId`)، مسار الصورة، الترتيب، والحالة (`active` / `archived`).
- **AttributeEntity & Aliases**: يحفظ المفتاح البرمجي (`key`)، الأسماء، نوع البيانات (`string`, `number`, `boolean`, `enum`)، نمط الفلترة، البُعد الفيزيائي المرتبط، والأسماء البديلة للبحث.
- **ProductTypeAttributeAssignment**: يربط عقدة `product_type` بالخصائص مع إعدادات الدور (`identity`, `variant`, `descriptive`, `commercial`)، المجموعة، الإلزامية، قابلية الفلترة، متغير المنتج (`isVariant`)، الحدود الرقمية (`minValue`, `maxValue`)، الوحدة (`unitId`)، ومجموعة القيم (`valueSetId`).
- **ValueSetEntity & AttributeValueEntity**: مجموعات القيم وخياراتها المرتبة ثنائية اللغة.
- **MeasurementDimensionEntity, MeasurementUnitEntity & UnitConversionRuleEntity**: الأبعاد الفيزيائية، الوحدات بمعادلة `base = value * multiplier + offset` مع ضمان وجود وحدة أساسية نشطة واحدة لكل بُعد، وقواعد التحويل المباشرة.

### Interactive Component & State Mapping
- **عمليات الشجرة والنقل (`Tree & Reparent`)**: عند اختيار نقل عقدة، يحسب الـ ViewModel مجموعة العقد المستبعدة (العقدة نفسها وجميع أحفادها + العقد التي لا تسمح قواعد المستوى الأبوي بها) ويعطلها بصرياً في نافذة النقل.
- **محرر خصائص نوع المنتج (`Product Type Editor`)**: يتحقق فورياً من أن `min_value <= max_value`، ويعرض فقط الوحدات النشطة المطابقة لبُعد الخاصية، ومجموعات القيم النشطة المتوافقة مع الخاصية من نوع `enum`.
- **إعادة تعيين الوحدة الأساسية (`Base Unit Rebase`)**: تنفذ داخل معاملة ذرية (`@Transaction`) تعيد حساب معاملات `to_base_multiplier` و`to_base_offset` لجميع وحدات البُعد وتحدّث قواعد التحويل المرتبطة تلقائياً.
- **المزامنة السحابية وقفل المالك (`Sync & Owner Gate`)**: يتيح شريط الحالة العلوي التبديل بين وضع المالك (تحرير كامل) ووضع القراءة فقط، وتنفيذ مزامنة فورية (سحب/دفع) مع Supabase أو العمل محلياً بالكامل مع إشعار واضح بالحالة.
