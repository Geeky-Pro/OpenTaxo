'use client';

import { useMemo, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Check, Edit3, Plus, Ruler, Scale, Search, X } from 'lucide-react';
import {
  saveMeasurementDimension,
  saveMeasurementUnit,
  setMeasurementDimensionArchived,
  setMeasurementUnitArchived,
  setMeasurementUnitAsBase,
} from '@/lib/actions/measurements';
import type { MeasurementDimensionRecord, MeasurementUnitRecord } from '@/lib/data/measurements';

type Props = { dimensions: MeasurementDimensionRecord[]; units: MeasurementUnitRecord[] };
type DimensionDraft = { id: string | null; key: string; name_ar: string; name_en: string };
type UnitDraft = { id: string | null; dimension_id: string; key: string; name_ar: string; name_en: string; symbol: string; to_base_multiplier: number; to_base_offset: number; make_base: boolean };
const emptyDimension = (): DimensionDraft => ({ id: null, key: '', name_ar: '', name_en: '' });
const emptyUnit = (dimension_id: string, make_base: boolean): UnitDraft => ({ id: null, dimension_id, key: '', name_ar: '', name_en: '', symbol: '', to_base_multiplier: 1, to_base_offset: 0, make_base });
function errorMessage(result: { success: boolean; error?: string | Record<string, string[]> }): string | null {
  if (result.success) return null;
  return typeof result.error === 'string' ? result.error : 'تحقق من الحقول المدخلة.';
}

export function MeasurementCenterManager({ dimensions, units }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState(() => dimensions.find((item) => item.status === 'active')?.id ?? dimensions[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [dimensionDraft, setDimensionDraft] = useState<DimensionDraft | null>(null);
  const [unitDraft, setUnitDraft] = useState<UnitDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const visibleDimensions = useMemo(() => dimensions.filter((dimension) =>
    (showArchived || dimension.status === 'active') &&
    [dimension.key, dimension.name_ar, dimension.name_en ?? ''].some((value) => value.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
  ), [dimensions, search, showArchived]);
  const selected = dimensions.find((dimension) => dimension.id === selectedId) ?? visibleDimensions[0] ?? null;
  const selectedUnits = units.filter((unit) => unit.dimension_id === selected?.id && (showArchived || unit.status === 'active'));
  const hasBase = units.some((unit) => unit.dimension_id === selected?.id && unit.status === 'active' && unit.is_base);

  const showError = (result: { success: boolean; error?: string | Record<string, string[]> }) => {
    const message = errorMessage(result);
    setError(message);
    return message;
  };

  const submitDimension = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dimensionDraft) return;
    setError(null);
    startTransition(async () => {
      const result = await saveMeasurementDimension({ ...dimensionDraft, name_en: dimensionDraft.name_en.trim() || null });
      if (showError(result)) return;
      if (!result.success) return;
      setDimensionDraft(null);
      setSelectedId(typeof result.data === 'string' ? result.data : selectedId);
      setNotice('تم حفظ تعريف البُعد الفيزيائي.');
      router.refresh();
    });
  };

  const submitUnit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!unitDraft) return;
    setError(null);
    startTransition(async () => {
      const result = await saveMeasurementUnit({
        ...unitDraft,
        name_en: unitDraft.name_en.trim() || null,
        symbol: unitDraft.symbol.trim() || null,
        make_base: unitDraft.make_base || !hasBase,
        to_base_multiplier: unitDraft.make_base || !hasBase ? 1 : unitDraft.to_base_multiplier,
        to_base_offset: unitDraft.make_base || !hasBase ? 0 : unitDraft.to_base_offset,
      });
      if (showError(result)) return;
      if (!result.success) return;
      setUnitDraft(null);
      setNotice('تم حفظ وحدة القياس.');
      router.refresh();
    });
  };

  const changeDimensionStatus = (dimension: MeasurementDimensionRecord) => {
    const archived = dimension.status === 'active';
    if (!window.confirm(archived ? 'أرشفة البُعد؟ يجب أولاً أرشفة وحداته وفصل الخصائص المرتبطة به.' : 'إعادة تنشيط البُعد؟')) return;
    setError(null);
    startTransition(async () => {
      const result = await setMeasurementDimensionArchived(dimension.id, archived);
      if (showError(result)) return;
      setNotice(archived ? 'تمت أرشفة البُعد.' : 'تمت إعادة تنشيط البُعد.');
      router.refresh();
    });
  };

  const changeUnitStatus = (unit: MeasurementUnitRecord) => {
    const archived = unit.status === 'active';
    if (!window.confirm(archived ? 'أرشفة الوحدة؟ لا يمكن أرشفة وحدة مستخدمة في نوع منتج أو قاعدة تحويل نشطة.' : 'إعادة تنشيط الوحدة؟')) return;
    setError(null);
    startTransition(async () => {
      const result = await setMeasurementUnitArchived(unit.id, archived);
      if (showError(result)) return;
      setNotice(archived ? 'تمت أرشفة الوحدة.' : 'تمت إعادة تنشيط الوحدة.');
      router.refresh();
    });
  };

  const makeBase = (unit: MeasurementUnitRecord) => {
    if (!window.confirm(`اعتماد «${unit.name_ar}» كوحدة أساس؟ سيُعاد حساب معاملات جميع الوحدات في هذا البُعد للحفاظ على نتائج التحويل.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await setMeasurementUnitAsBase(unit.id);
      if (showError(result)) return;
      if (!result.success) return;
      setNotice(typeof result.data === 'string' ? result.data : 'تم تغيير وحدة الأساس.');
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-background p-5 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-sm font-medium text-primary">التعريفات المركزية · Unit 26</p><h1 className="mt-1 text-2xl font-bold md:text-3xl">مركز الوحدات والأبعاد</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">عرّف البُعد الفيزيائي مرة واحدة، ثم أضف وحداته. لكل بُعد وحدة أساس واحدة، وتُحفظ معاملات الوحدات نسبةً إليها؛ تغيير وحدة الأساس يعيد حساب المعاملات داخل معاملة قاعدة بيانات واحدة.</p></div>
          <button type="button" onClick={() => { setDimensionDraft(emptyDimension()); setError(null); setNotice(null); }} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"><Plus className="h-4 w-4" /> بُعد جديد</button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">الأبعاد</p><p className="mt-1 text-2xl font-bold tabular-nums">{dimensions.length}</p></div>
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">الأبعاد النشطة</p><p className="mt-1 text-2xl font-bold tabular-nums">{dimensions.filter((item) => item.status === 'active').length}</p></div>
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">الوحدات</p><p className="mt-1 text-2xl font-bold tabular-nums">{units.length}</p></div>
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">وحدات الأساس</p><p className="mt-1 text-2xl font-bold tabular-nums">{units.filter((unit) => unit.status === 'active' && unit.is_base).length}</p></div>
        </div>
      </section>
      {notice && <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-600/25 bg-emerald-600/10 p-3 text-sm"><Check className="h-4 w-4 text-emerald-700" />{notice}<button type="button" onClick={() => setNotice(null)} aria-label="إخفاء الرسالة" className="ms-auto"><X className="h-4 w-4" /></button></div>}
      {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(260px,0.85fr)_minmax(0,1.65fr)]">
        <aside className="overflow-hidden rounded-2xl border bg-background">
          <div className="space-y-3 border-b p-4"><div className="flex items-center justify-between gap-2"><h2 className="font-bold">الأبعاد الفيزيائية</h2><span className="text-xs text-muted-foreground">{visibleDimensions.length}</span></div><label className="flex h-10 items-center gap-2 rounded-lg border px-3"><Search className="h-4 w-4 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث بالاسم أو المفتاح..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} /> إظهار المؤرشف</label></div>
          <div className="max-h-[620px] divide-y overflow-y-auto">
            {visibleDimensions.map((dimension) => <button key={dimension.id} type="button" onClick={() => { setSelectedId(dimension.id); setUnitDraft(null); setError(null); setNotice(null); }} className={`block w-full p-4 text-start transition-colors hover:bg-muted/50 ${selected?.id === dimension.id ? 'bg-primary/5 ring-1 ring-inset ring-primary/25' : ''}`}>
              <div className="flex items-start justify-between gap-2"><span className="font-semibold">{dimension.name_ar}</span><span className={`rounded-full px-2 py-0.5 text-[10px] ${dimension.status === 'active' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>{dimension.status === 'active' ? 'نشط' : 'مؤرشف'}</span></div><p className="mt-1 font-mono text-xs text-muted-foreground" dir="ltr">{dimension.key}</p><div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{dimension.active_unit_count} وحدة نشطة</span><span>·</span><span>{dimension.attribute_usage_count} خاصية مرتبطة</span></div>
            </button>)}
            {!visibleDimensions.length && <p className="p-6 text-center text-sm text-muted-foreground">لا توجد أبعاد. أنشئ بُعداً مثل الطول أو الكتلة أو القدرة.</p>}
          </div>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-2xl border bg-background">
          {selected ? <>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4 md:p-5"><div><p className="text-xs font-medium text-primary">تفاصيل البُعد</p><h2 className="mt-1 text-xl font-bold">{selected.name_ar}</h2><p className="mt-1 font-mono text-sm text-muted-foreground" dir="ltr">{selected.key}</p>{selected.name_en && <p className="mt-1 text-sm text-muted-foreground">{selected.name_en}</p>}</div><div className="flex flex-wrap gap-2">{selected.status === 'active' && <button type="button" onClick={() => { setDimensionDraft({ id: selected.id, key: selected.key, name_ar: selected.name_ar, name_en: selected.name_en ?? '' }); setError(null); }} className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm hover:bg-muted"><Edit3 className="h-4 w-4" /> تعديل البُعد</button>}<button type="button" disabled={pending} onClick={() => changeDimensionStatus(selected)} className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm hover:bg-muted disabled:opacity-50"><Archive className="h-4 w-4" />{selected.status === 'active' ? 'أرشفة' : 'إعادة تنشيط'}</button>{selected.status === 'active' && <button type="button" onClick={() => { setUnitDraft(emptyUnit(selected.id, !hasBase)); setError(null); setNotice(null); }} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground hover:opacity-90"><Plus className="h-4 w-4" /> إضافة وحدة</button>}</div></div>
            <div className="grid gap-3 border-b bg-muted/20 p-4 sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">الوحدات النشطة</p><p className="mt-1 text-sm font-medium">{selected.active_unit_count}</p></div><div><p className="text-xs text-muted-foreground">الخصائص الرقمية المرتبطة</p><p className="mt-1 text-sm font-medium">{selected.attribute_usage_count}</p></div><div><p className="text-xs text-muted-foreground">قواعد التحويل</p><p className="mt-1 text-sm font-medium">{selected.active_conversion_count}</p></div></div>
            <div className="p-4 md:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold">وحدات البُعد</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">معادلة التحويل إلى وحدة الأساس: القيمة × المعامل + الإزاحة.</p></div>{hasBase ? <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700">وحدة أساس محددة</span> : <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700">لم تُحدد وحدة أساس</span>}</div>
              {selectedUnits.length ? <div className="grid gap-3 md:grid-cols-2">{selectedUnits.map((unit) => <article key={unit.id} className={`rounded-xl border p-4 ${unit.is_base ? 'border-primary/40 bg-primary/[0.03]' : ''}`}>
                <div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold">{unit.name_ar}</h4>{unit.symbol && <span dir="ltr" className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{unit.symbol}</span>}</div><p className="mt-1 font-mono text-xs text-muted-foreground" dir="ltr">{unit.key}</p>{unit.name_en && <p className="mt-1 text-xs text-muted-foreground">{unit.name_en}</p>}</div><span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${unit.is_base ? 'bg-primary/10 text-primary' : unit.status === 'active' ? 'bg-muted text-muted-foreground' : 'bg-muted text-muted-foreground'}`}>{unit.is_base ? 'وحدة الأساس' : unit.status === 'active' ? 'وحدة تحويل' : 'مؤرشفة'}</span></div>
                <div className="mt-4 rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground">عوامل التحويل إلى الأساس</p><p className="mt-1 font-mono text-sm" dir="ltr">× {unit.to_base_multiplier} {unit.to_base_offset >= 0 ? '+' : '−'} {Math.abs(unit.to_base_offset)}</p></div>
                <div className="mt-3 flex flex-wrap gap-2">{unit.status === 'active' && <button type="button" onClick={() => { setUnitDraft({ id: unit.id, dimension_id: unit.dimension_id, key: unit.key, name_ar: unit.name_ar, name_en: unit.name_en ?? '', symbol: unit.symbol ?? '', to_base_multiplier: unit.to_base_multiplier, to_base_offset: unit.to_base_offset, make_base: unit.is_base }); setError(null); }} className="inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs hover:bg-muted"><Edit3 className="h-3.5 w-3.5" /> تعديل</button>}
                  {unit.status === 'active' && !unit.is_base && <button type="button" disabled={pending} onClick={() => makeBase(unit)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary/30 px-2.5 text-xs text-primary hover:bg-primary/5 disabled:opacity-50"><Scale className="h-3.5 w-3.5" /> اعتماد كوحدة أساس</button>}
                  <button type="button" disabled={pending} onClick={() => changeUnitStatus(unit)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs hover:bg-muted disabled:opacity-50"><Archive className="h-3.5 w-3.5" />{unit.status === 'active' ? 'أرشفة' : 'إعادة تنشيط'}</button></div>
              </article>)}</div> : <div className="rounded-xl border border-dashed p-8 text-center"><Ruler className="mx-auto h-8 w-8 text-muted-foreground" /><h4 className="mt-3 font-semibold">لا توجد وحدات بعد</h4><p className="mt-1 text-sm text-muted-foreground">أضف أول وحدة؛ ستصبح وحدة الأساس تلقائياً.</p></div>}
            </div>
          </> : <div className="p-10 text-center"><Scale className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">ابدأ بإنشاء بُعد فيزيائي</h2><p className="mt-1 text-sm text-muted-foreground">مثل الطول أو الكتلة أو القدرة الكهربائية.</p></div>}
        </section>
      </div>

      {dimensionDraft && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setDimensionDraft(null); }}><section role="dialog" aria-modal="true" aria-labelledby="dimension-dialog-title" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border bg-background p-5 shadow-2xl sm:rounded-2xl md:p-7"><div className="mb-5 flex items-start justify-between gap-3"><div><h2 id="dimension-dialog-title" className="text-xl font-bold">{dimensionDraft.id ? 'تعديل البُعد' : 'تعريف بُعد جديد'}</h2><p className="mt-1 text-sm text-muted-foreground">مثال: power · القدرة الكهربائية.</p></div><button type="button" onClick={() => setDimensionDraft(null)} aria-label="إغلاق" className="rounded-lg p-2 hover:bg-muted"><X className="h-5 w-5" /></button></div><form onSubmit={submitDimension} className="space-y-4"><div className="space-y-1.5"><label htmlFor="dimension-key" className="text-sm font-medium">المفتاح الثابت</label><input id="dimension-key" maxLength={63} dir="ltr" value={dimensionDraft.key} onChange={(event) => setDimensionDraft({ ...dimensionDraft, key: event.target.value })} placeholder="يُنشأ تلقائياً إذا تُرك فارغاً (مثال: power)" className="h-11 w-full rounded-lg border bg-background px-3 text-left font-mono text-sm" /><p className="text-xs text-muted-foreground">يُنشأ تلقائياً من الاسم إذا تُرك فارغاً.</p></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><label htmlFor="dimension-name-ar" className="text-sm font-medium">الاسم بالعربية *</label><input id="dimension-name-ar" required maxLength={120} value={dimensionDraft.name_ar} onChange={(event) => setDimensionDraft({ ...dimensionDraft, name_ar: event.target.value })} className="h-11 w-full rounded-lg border bg-background px-3" /></div><div className="space-y-1.5"><label htmlFor="dimension-name-en" className="text-sm font-medium">الاسم بالإنجليزية</label><input id="dimension-name-en" maxLength={120} dir="ltr" value={dimensionDraft.name_en} onChange={(event) => setDimensionDraft({ ...dimensionDraft, name_en: event.target.value })} className="h-11 w-full rounded-lg border bg-background px-3 text-left" /></div></div><div className="flex justify-end gap-2 border-t pt-4"><button type="button" onClick={() => setDimensionDraft(null)} className="h-10 rounded-lg border px-4 text-sm">إلغاء</button><button type="submit" disabled={pending} className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{pending ? 'جارٍ الحفظ...' : 'حفظ البُعد'}</button></div></form></section></div>}

      {unitDraft && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setUnitDraft(null); }}><section role="dialog" aria-modal="true" aria-labelledby="unit-dialog-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border bg-background p-5 shadow-2xl sm:rounded-2xl md:p-7"><div className="mb-5 flex items-start justify-between gap-3"><div><h2 id="unit-dialog-title" className="text-xl font-bold">{unitDraft.id ? 'تعديل وحدة القياس' : 'إضافة وحدة قياس'}</h2><p className="mt-1 text-sm text-muted-foreground">المعامل والإزاحة يحددان كيفية تحويل الوحدة إلى وحدة الأساس الحالية.</p></div><button type="button" onClick={() => setUnitDraft(null)} aria-label="إغلاق" className="rounded-lg p-2 hover:bg-muted"><X className="h-5 w-5" /></button></div>
        <form onSubmit={submitUnit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><label htmlFor="unit-key" className="text-sm font-medium">المفتاح الثابت</label><input id="unit-key" maxLength={63} dir="ltr" value={unitDraft.key} onChange={(event) => setUnitDraft({ ...unitDraft, key: event.target.value })} placeholder="يُنشأ تلقائياً إذا تُرك فارغاً (مثال: watt)" className="h-11 w-full rounded-lg border bg-background px-3 text-left font-mono text-sm" /><p className="text-xs text-muted-foreground">يُنشأ تلقائياً من الاسم أو الرمز إذا تُرك فارغاً.</p></div>
          <div className="space-y-1.5"><label htmlFor="unit-symbol" className="text-sm font-medium">الرمز</label><input id="unit-symbol" maxLength={40} dir="ltr" value={unitDraft.symbol} onChange={(event) => setUnitDraft({ ...unitDraft, symbol: event.target.value })} placeholder="W" className="h-11 w-full rounded-lg border bg-background px-3 text-left font-mono text-sm" /></div>
          <div className="space-y-1.5"><label htmlFor="unit-name-ar" className="text-sm font-medium">الاسم بالعربية *</label><input id="unit-name-ar" required maxLength={120} value={unitDraft.name_ar} onChange={(event) => setUnitDraft({ ...unitDraft, name_ar: event.target.value })} className="h-11 w-full rounded-lg border bg-background px-3" /></div>
          <div className="space-y-1.5"><label htmlFor="unit-name-en" className="text-sm font-medium">الاسم بالإنجليزية</label><input id="unit-name-en" maxLength={120} dir="ltr" value={unitDraft.name_en} onChange={(event) => setUnitDraft({ ...unitDraft, name_en: event.target.value })} className="h-11 w-full rounded-lg border bg-background px-3 text-left" /></div>
          <div className="space-y-1.5"><label htmlFor="unit-multiplier" className="text-sm font-medium">معامل التحويل إلى الأساس *</label><input id="unit-multiplier" type="number" step="any" min="0.000000000000000001" required disabled={unitDraft.make_base || !hasBase} value={unitDraft.make_base || !hasBase ? 1 : unitDraft.to_base_multiplier} onChange={(event) => setUnitDraft({ ...unitDraft, to_base_multiplier: Number(event.target.value) })} className="h-11 w-full rounded-lg border bg-background px-3 disabled:opacity-60" /></div>
          <div className="space-y-1.5"><label htmlFor="unit-offset" className="text-sm font-medium">إزاحة التحويل إلى الأساس *</label><input id="unit-offset" type="number" step="any" required disabled={unitDraft.make_base || !hasBase} value={unitDraft.make_base || !hasBase ? 0 : unitDraft.to_base_offset} onChange={(event) => setUnitDraft({ ...unitDraft, to_base_offset: Number(event.target.value) })} className="h-11 w-full rounded-lg border bg-background px-3 disabled:opacity-60" /></div>
        </div>
        {unitDraft.make_base || !hasBase ? <p className="rounded-lg border border-primary/25 bg-primary/5 p-3 text-sm leading-6">ستصبح هذه وحدة الأساس لهذا البُعد؛ ستُضبط عواملها إلى 1 و0. أول وحدة نشطة في البُعد تُعتمد أساساً تلقائياً.</p> : <p className="rounded-lg border bg-muted/40 p-3 text-sm leading-6">أدخل العامل والإزاحة نسبةً إلى وحدة الأساس الحالية. القيمة المحوّلة = القيمة الأصلية × المعامل + الإزاحة.</p>}
        <div className="flex justify-end gap-2 border-t pt-4"><button type="button" onClick={() => setUnitDraft(null)} className="h-10 rounded-lg border px-4 text-sm">إلغاء</button><button type="submit" disabled={pending} className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{pending ? 'جارٍ الحفظ...' : 'حفظ الوحدة'}</button></div></form>
      </section></div>}
    </div>
  );
}
