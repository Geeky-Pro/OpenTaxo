import Link from 'next/link';
import { ArrowUpLeft, Braces, CheckCircle2, Ruler, Tags, Scale } from 'lucide-react';

const activeCenters = [
  { href: '/attributes', title: 'مركز الخصائص', subtitle: 'المفتاح والأسماء والترجمات والأسماء البديلة ونوع البيانات والبُعد والحالة.', icon: Tags },
  { href: '/data-types', title: 'مركز أنواع البيانات', subtitle: 'قواعد الإدخال وأنماط الفلترة المتوافقة لكل نوع أساسي.', icon: Braces },
  { href: '/value-sets', title: 'مركز القيم', subtitle: 'مجموعات القيم والقيم الفردية والمفاتيح والترجمات والترتيب والأرشفة.', icon: CheckCircle2 },
  { href: '/measurements', title: 'مركز الوحدات والأبعاد', subtitle: 'الأبعاد الفيزيائية والوحدات الأساسية والرموز ومعاملات التحويل.', icon: Scale },
  { href: '/unit-conversions', title: 'قواعد التحويل', subtitle: 'قواعد تحويل صريحة وحاسبة للتحويل بين الوحدات المتوافقة.', icon: Ruler },
];

export default function DefinitionsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-7 px-4 py-6 pb-28 md:px-8 md:py-8">
      <section className="rounded-2xl border bg-background p-6 md:p-9"><p className="text-sm font-medium text-primary">إدارة الكتالوج</p><h1 className="mt-1 text-2xl font-bold md:text-3xl">التعريفات المركزية</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">المعلومة تُعرّف مرة واحدة وتُستخدم في كل أنواع المنتجات. نفصل تعريف الخاصية ونوع بياناتها وقيمها ووحداتها عن إعدادات إسنادها إلى Product Type، مع الحفاظ على سلامة العلاقات في قاعدة البيانات.</p></section>
      <section className="space-y-3"><h2 className="text-lg font-bold">متاح الآن</h2><div className="grid gap-4 md:grid-cols-2">{activeCenters.map((center) => { const Icon = center.icon; return <Link key={center.href} href={center.href} className="group flex min-h-44 items-start gap-4 rounded-2xl border bg-background p-5 transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"><span className="rounded-xl bg-primary/10 p-3 text-primary"><Icon className="h-6 w-6" /></span><div className="min-w-0 flex-1"><h3 className="font-bold">{center.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{center.subtitle}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">فتح المركز <ArrowUpLeft className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span></div></Link>; })}</div></section>
    </main>
  );
}
