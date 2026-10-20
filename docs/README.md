# Taxonomy & Catalog Planner — Documentation System

Welcome to the official, enterprise-grade documentation for the **Taxonomy & Catalog Planner** (YCP E-Commerce Platform).

This documentation is designed to be deployed directly via **Docusaurus**, published as a **GitHub Wiki**, or read as standard Markdown.

---

## Language Navigation / التنقل حسب اللغة

The documentation is fully mirrored in both **English (LTR)** and **Arabic (RTL)**:

| English (LTR) | العربية (RTL) | Description / الوصف |
| :--- | :--- | :--- |
| [**English Documentation**](./en/index.md) | [**التوثيق باللغة العربية**](./ar/index.md) | Complete architectural, domain, API, and operational guides |

---

## Documentation Map / خريطة التوثيق

```text
docs/
├── README.md                          # Root index & routing guide
├── en/                                # English Documentation (LTR)
│   ├── index.md                       # Introduction & Executive Summary
│   ├── getting-started/
│   │   ├── installation.md            # Setup, env variables, Supabase local/remote
│   │   └── quick-start.md             # First steps & workflow overview
│   ├── architecture/
│   │   ├── system-overview.md         # Next.js App Router, SSR, Server Actions
│   │   ├── supabase-database.md       # Tables, Foreign keys, RPCs, Snapshot pattern
│   │   └── security-and-rls.md        # Owner-only auth, RLS policies, session management
│   ├── pim-domain-model/
│   │   ├── taxonomy-hierarchy.md      # Department -> Category -> Subcategory -> Product Type
│   │   ├── attribute-system.md        # Global definitions, Roles (Identity, Variant, etc.), Groups
│   │   ├── measurements-and-units.md  # Dimensions, Base invariants, Unit conversions
│   │   └── value-sets.md              # Centralized enum sets & vocabulary governance
│   ├── user-guides/
│   │   ├── tree-management.md         # Collapsible tree, Focus mode, Reparenting rules
│   │   ├── category-authoring.md      # Quick edit drawer, image upload pipeline
│   │   ├── storefront-simulator.md    # /browse route, circular visual cards, blueprints
│   │   └── command-palette.md         # Spotlight search (Cmd+K)
│   ├── api-contracts/
│   │   ├── export-pipeline.md         # /api/export endpoint, query params
│   │   └── enriched-json-schema.md    # JSON schema specifications for YCP engine
│   └── operations/
│       ├── migrations-guide.md        # Supabase migration lifecycle
│       └── testing-and-integrity.md   # Tree invariants, verify scripts
└── ar/                                # Arabic Documentation (RTL)
    ├── index.md                       # المقدمة ونظرة عامة على المشروع
    ├── getting-started/
    │   ├── installation.md            # التثبيت، المتغيرات البيئية وإعداد Supabase
    │   └── quick-start.md             # البداية السريعة ودليل التشغيل الأول
    ├── architecture/
    │   ├── system-overview.md         # الهيكل المعماري لـ Next.js و Server Actions
    │   ├── supabase-database.md       # الجداول، العلاقات، دوال RPC ونمط Snapshot
    │   └── security-and-rls.md        # الأمان، سياسات RLS وجلسات المالك
    ├── pim-domain-model/
    │   ├── taxonomy-hierarchy.md      # المستويات الهرمية (قسم، فئة، فرعي، نوع منتج)
    │   ├── attribute-system.md        # الخصائص المركزية، أدوار الخصائص والمجموعات
    │   ├── measurements-and-units.md  # أبعاد القياس، الوحدات وقواعد التحويل
    │   └── value-sets.md              # مستودعات القيم المركزية وحوكمة المصطلحات
    ├── user-guides/
    │   ├── tree-management.md         # إدارة الشجرة، وضع التركيز، وقواعد نقل التبعية
    │   ├── category-authoring.md      # درج التعديل السريع ورفع الصور
    │   ├── storefront-simulator.md    # محاكي واجهة المتجر (/browse) وبطاقة المواصفات
    │   └── command-palette.md         # لوحة البحث الشامل السريعة (Cmd+K)
    ├── api-contracts/
    │   ├── export-pipeline.md         # مسار التصدير (/api/export)
    │   └── enriched-json-schema.md    # مواصفات كائن الـ JSON المخصب المصدّر
    └── operations/
        ├── migrations-guide.md        # إدارة ترحيل قواعد البيانات (Migrations)
        └── testing-and-integrity.md   # سكريبتات الفحص والتحقق من النزاهة الهندسية
```

---

## Core Principles & Technology Baseline

- **Runtime**: Next.js 16.4.1 (App Router, Turbopack, React 19, TypeScript ^6.0.3, Tailwind CSS 4.x).
- **Persistence**: Supabase PostgreSQL as live source of truth; persistent Storage bucket (`categories`) for imagery.
- **RTL-First**: Native Arabic (`dir="rtl"`, `lang="ar"`), with full English attribute and taxonomy alias support.
- **Strict Invariants**: Strict 4-tier taxonomy (`Department` → `Category` → `Subcategory` → `Product Type`), cycle prevention algorithms, physical measurement base invariants, and owner-only RLS authorization.
