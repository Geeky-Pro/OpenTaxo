import Link from 'next/link';
import { readCategories } from '@/lib/data/categories';
import { readAttributes } from '@/lib/data/attributes';
import { Redo2, BookOpen, Box, FolderTree, Layers, Store, Tags, Network, Scale } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [categories, attributes] = await Promise.all([readCategories(), readAttributes()]);
  const counts = {
    departments: categories.filter((node) => node.node_type === 'department').length,
    productTypes: categories.filter((node) => node.node_type === 'product_type').length,
    categories: categories.length,
    attributes: attributes.length,
  };
  const destinations = [
    { href: '/taxonomy', title: 'إدارة التصنيفات', description: 'استعراض كل عقد الشجرة، البحث والتصفية، وفتح تفاصيل أي تصنيف أو Product Type.', icon: Network, metric: `${counts.categories} عقدة`, primary: true },
    { href: '/tree', title: 'شجرة التصنيفات', description: 'عرض هرمي مرئي لإضافة الأقسام وتعديلها وإعادة تنظيم العلاقات.', icon: FolderTree, metric: `${counts.departments} أقسام رئيسية` },
    { href: '/browse', title: 'معرض المتجر', description: 'تصفح الأقسام كما تظهر في بنية المتجر وانتقل بين المستويات حتى نوع المنتج.', icon: Store, metric: 'تصفح هرمي' },
    { href: '/attributes', title: 'مركز الخصائص', description: 'إدارة تعريفات الخصائص العامة التي يمكن ربطها بأنواع المنتجات.', icon: Tags, metric: `${counts.attributes} خاصية` },
    { href: '/definitions', title: 'التعريفات المركزية', description: 'إدارة السمات وأنواع البيانات ومجموعات القيم والوحدات والأبعاد وقواعد التحويل.', icon: Scale, metric: '5 مراكز' },
  ];
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/20">
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8 md:py-12">
        <section className="relative overflow-hidden rounded-3xl border bg-background p-6 shadow-sm md:p-10">
          <div className="pointer-events-none absolute -left-10 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary"><Layers className="h-4 w-4" /> YCP · Taxonomy & Catalog Planner</span>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">مركز إدارة التصنيفات والكتالوج</h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">نقطة البداية لإدارة بنية الكتالوج، واستعراض أنواع المنتجات، وربط الخصائص العامة بها. اختر مساحة العمل التي تريد الانتقال إليها.</p>
            <Link href="/taxonomy" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">فتح إدارة التصنيفات <Redo2 className="h-4 w-4" /></Link>
          </div>
        </section>
        <section aria-label="ملخص الكتالوج" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'إجمالي العقد', value: counts.categories, icon: Network },
            { label: 'أنواع المنتجات', value: counts.productTypes, icon: Box },
            { label: 'الخصائص العامة', value: counts.attributes, icon: Tags },
            { label: 'الأقسام الرئيسية', value: counts.departments, icon: Layers },
          ].map((stat) => { const Icon = stat.icon; return <div key={stat.label} className="rounded-2xl border bg-background p-4 shadow-sm"><div className="mb-3 flex items-center justify-between gap-2"><span className="text-sm text-muted-foreground">{stat.label}</span><Icon className="h-4 w-4 text-primary" /></div><p className="text-2xl font-bold tabular-nums">{stat.value}</p></div>; })}
        </section>
        <section className="space-y-4">
          <div><h2 className="text-xl font-bold">مساحات العمل</h2><p className="mt-1 text-sm text-muted-foreground">الوصول السريع إلى أهم صفحات التطبيق.</p></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {destinations.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} className={`group flex min-h-52 flex-col rounded-2xl border bg-background p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md ${item.primary ? 'ring-1 ring-primary/15' : ''}`}><div className="mb-5 flex items-start justify-between gap-3"><span className="rounded-xl bg-primary/10 p-3 text-primary"><Icon className="h-6 w-6" /></span><Redo2 className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-1 group-hover:text-primary" /></div><h3 className="font-bold">{item.title}</h3><p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{item.description}</p><span className="mt-4 self-start rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{item.metric}</span></Link>; })}
          </div>
        </section>
        <section className="flex flex-col gap-3 rounded-2xl border border-dashed bg-background/70 p-5 sm:flex-row sm:items-start">
          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div><h2 className="font-semibold">التعريفات المركزية أصبحت مساحة عمل مستقلة</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">افتح المركز لإدارة تعريفات الخصائص وأنواع البيانات والقيم المركزية والوحدات والأبعاد وقواعد التحويل. تُحفظ التعريفات مرة واحدة وتُعاد الاستفادة منها في أنواع المنتجات مع فرض التوافق في قاعدة البيانات.</p><Link href="/definitions" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">فتح التعريفات المركزية <Redo2 className="h-4 w-4" /></Link></div>
        </section>
      </main>
    </div>
  );
}
