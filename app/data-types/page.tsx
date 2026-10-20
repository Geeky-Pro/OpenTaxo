import Link from 'next/link';
import { Redo2, Braces, CheckCircle2, Ruler, Tags } from 'lucide-react';
import { DATA_TYPE_DEFINITIONS, FILTER_TYPE_LABELS } from '@/lib/domain/attribute-compatibility';
import type { FilterType } from '@/lib/types/attribute';

export default function DataTypesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-6 px-4 py-6 pb-28 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <Link href="/definitions" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><Redo2 className="h-4 w-4" /> التعريفات المركزية</Link>
        <Link href="/attributes" className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:border-primary/40 hover:bg-primary/5"><Tags className="h-4 w-4" /> مركز الخصائص</Link>
      </div>
      <section className="rounded-2xl border bg-background p-5 md:p-8">
        <div className="flex items-start gap-4"><span className="rounded-xl bg-primary/10 p-3 text-primary"><Braces className="h-6 w-6" /></span><div><p className="text-sm font-medium text-primary">التعريفات المركزية</p><h1 className="mt-1 text-2xl font-bold md:text-3xl">مركز أنواع البيانات</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">أنواع البيانات الأربعة ثابتة ومحكومة في النظام، وليست قيماً حرة يضيفها المستخدم. يعرض هذا المركز قواعد الإدخال وأنماط الفلترة المتوافقة؛ ويُفرض التوافق نفسه في التحقق البرمجي وقاعدة البيانات.</p></div></div>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        {DATA_TYPE_DEFINITIONS.map((definition) => (
          <article key={definition.key} className="space-y-4 rounded-2xl border bg-background p-5">
            <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{definition.labelAr}</h2><p className="mt-1 font-mono text-sm text-muted-foreground" dir="ltr">{definition.labelEn} · {definition.key}</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs">{definition.supportsDimension ? 'يدعم الأبعاد' : 'بلا بُعد فيزيائي'}</span></div>
            <p className="text-sm leading-6 text-muted-foreground">{definition.description}</p>
            <div className="space-y-1"><h3 className="text-sm font-semibold">قواعد الإدخال</h3><p className="text-sm leading-6">{definition.inputRule}</p></div>
            <div className="space-y-2"><h3 className="text-sm font-semibold">أنماط الفلترة المتوافقة</h3><div className="flex flex-wrap gap-2">{definition.compatibleFilters.map((filter: FilterType) => <span key={filter} className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />{FILTER_TYPE_LABELS[filter]}</span>)}</div></div>
            <div className="rounded-lg bg-muted/60 p-3 text-sm leading-6"><div className="mb-1 flex items-center gap-2 font-semibold"><Tags className="h-4 w-4" /> القيم المركزية</div>{definition.valueSetRule}</div>
            {definition.supportsDimension && <div className="flex items-center gap-2 text-sm text-primary"><Ruler className="h-4 w-4" /> يمكن ربطه ببُعد فيزيائي، ثم اختيار وحدة متوافقة عند إسناده إلى Product Type.</div>}
          </article>
        ))}
      </div>
      <section className="space-y-3 rounded-2xl border bg-background p-5">
        <h2 className="text-lg font-bold">ملخص التوافق</h2>
        <div className="overflow-x-auto"><table className="w-full min-w-[540px] text-right text-sm"><thead><tr className="border-b text-muted-foreground"><th className="p-3 font-medium">نوع البيانات</th><th className="p-3 font-medium">الفلاتر المسموحة</th><th className="p-3 font-medium">بُعد فيزيائي</th><th className="p-3 font-medium">مجموعة قيم</th></tr></thead><tbody>{DATA_TYPE_DEFINITIONS.map((definition) => <tr key={definition.key} className="border-b last:border-0"><td className="p-3 font-semibold">{definition.labelEn}</td><td className="p-3">{definition.compatibleFilters.map((filter) => FILTER_TYPE_LABELS[filter]).join('، ')}</td><td className="p-3">{definition.supportsDimension ? 'نعم' : 'لا'}</td><td className="p-3">{definition.key === 'enum' ? 'مركز القيم (Unit 25)' : 'ليست مطلوبة'}</td></tr>)}</tbody></table></div>
        <p className="text-xs leading-5 text-muted-foreground">السجلات القديمة ذات التركيبات غير المتوافقة تظل محفوظة كما هي حتى يراجعها المالك صراحةً؛ لا يجري تحويلها تلقائياً.</p>
      </section>
    </main>
  );
}
