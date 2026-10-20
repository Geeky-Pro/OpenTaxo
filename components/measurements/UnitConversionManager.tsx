'use client';

import { useMemo, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Redo2, Calculator, Check, Edit3, Plus, Ruler, X } from 'lucide-react';
import {
  convertMeasurementValue,
  saveUnitConversionRule,
  setUnitConversionRuleArchived,
} from '@/lib/actions/measurements';
import type { MeasurementDimensionRecord, MeasurementUnitRecord, SellingUnitOption, UnitConversionRuleRecord } from '@/lib/data/measurements';
import { conversionFromFactors } from '@/lib/domain/measurement-conversions';

type Props = {
  dimensions: MeasurementDimensionRecord[];
  units: MeasurementUnitRecord[];
  conversionRules: UnitConversionRuleRecord[];
  sellingUnits: SellingUnitOption[];
};
type RuleDraft = {
  id: string | null;
  source_unit_id: string;
  target_unit_id: string;
  multiplier: number;
  offset_value: number;
  selling_unit_definition_id: string;
};
const emptyRule = (units: MeasurementUnitRecord[]): RuleDraft => ({
  id: null,
  source_unit_id: units[0]?.id ?? '',
  target_unit_id: units.find((unit) => unit.id !== units[0]?.id && unit.dimension_id === units[0]?.dimension_id)?.id ?? '',
  multiplier: 1,
  offset_value: 0,
  selling_unit_definition_id: '',
});
function errorMessage(result: { success: boolean; error?: string | Record<string, string[]> }): string | null {
  if (result.success) return null;
  return typeof result.error === 'string' ? result.error : 'تحقق من البيانات المدخلة.';
}

export function UnitConversionManager({ dimensions, units, conversionRules, sellingUnits }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<RuleDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [value, setValue] = useState('1');
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [converted, setConverted] = useState<number | null>(null);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [convertPending, startConvert] = useTransition();

  const activeUnits = units.filter((unit) => unit.status === 'active');
  const sourceUnit = activeUnits.find((unit) => unit.id === sourceId) ?? activeUnits[0] ?? null;
  const compatibleUnits = useMemo(() => activeUnits.filter((unit) => unit.dimension_id === sourceUnit?.dimension_id && unit.id !== sourceUnit?.id), [activeUnits, sourceUnit?.dimension_id, sourceUnit?.id]);
  const selectedTarget = compatibleUnits.find((unit) => unit.id === targetId) ?? compatibleUnits[0] ?? null;
  const activeRules = conversionRules.filter((rule) => rule.status === 'active');
  const unitsById = new Map(units.map((unit) => [unit.id, unit]));
  const dimensionsById = new Map(dimensions.map((dimension) => [dimension.id, dimension]));

  const refreshExpected = (source: MeasurementUnitRecord | undefined, target: MeasurementUnitRecord | undefined) => {
    if (!source || !target) return { multiplier: 1, offset_value: 0 };
    try {
      return conversionFromFactors(source, target);
    } catch {
      return { multiplier: 1, offset_value: 0 };
    }
  };

  const openNewRule = () => {
    const initial = emptyRule(activeUnits);
    const expected = refreshExpected(unitsById.get(initial.source_unit_id), unitsById.get(initial.target_unit_id));
    setDraft({ ...initial, ...expected });
    setError(null);
    setNotice(null);
  };

  const updateRuleUnits = (source_unit_id: string, target_unit_id: string, selling_unit_definition_id: string) => {
    const source = unitsById.get(source_unit_id);
    const target = unitsById.get(target_unit_id);
    const expected = refreshExpected(source, target);
    setDraft((current) => current ? { ...current, source_unit_id, target_unit_id, selling_unit_definition_id, ...(!selling_unit_definition_id ? expected : {}) } : current);
  };

  const submitRule = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft) return;
    setError(null);
    startTransition(async () => {
      const result = await saveUnitConversionRule({
        ...draft,
        selling_unit_definition_id: draft.selling_unit_definition_id || null,
      });
      if (!result.success) { setError(errorMessage(result)); return; }
      setDraft(null);
      setNotice('تم حفظ قاعدة التحويل.');
      router.refresh();
    });
  };

  const changeRuleStatus = (rule: UnitConversionRuleRecord) => {
    const archived = rule.status === 'active';
    if (!window.confirm(archived ? 'أرشفة قاعدة التحويل؟' : 'إعادة تنشيط قاعدة التحويل؟')) return;
    setError(null);
    startTransition(async () => {
      const result = await setUnitConversionRuleArchived(rule.id, archived);
      if (!result.success) { setError(errorMessage(result)); return; }
      setNotice(archived ? 'تمت أرشفة قاعدة التحويل.' : 'تمت إعادة تنشيط قاعدة التحويل.');
      router.refresh();
    });
  };

  const runConversion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sourceUnit || !selectedTarget) return;
    setConvertError(null);
    setConverted(null);
    startConvert(async () => {
      const result = await convertMeasurementValue({
        value: Number(value),
        source_unit_id: sourceUnit.id,
        target_unit_id: selectedTarget.id,
      });
      if (!result.success) {
        setConvertError(typeof result.error === 'string' ? result.error : 'تعذر إجراء التحويل.');
        return;
      }
      setConverted(result.data.value);
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-background p-5 md:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-medium text-primary">التعريفات المركزية · Unit 27</p><h1 className="mt-1 text-2xl font-bold md:text-3xl">قواعد التحويل والتوافق</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">التحويل الحسابي يعتمد على عوامل الوحدات في قاعدة البيانات. قواعد التحويل المحفوظة توثق التحويل بين وحدتين من البُعد نفسه، ويمكن ربط قاعدة خاصة بتعريف وحدة بيع عند الحاجة.</p></div><button type="button" disabled={!activeUnits.length} onClick={openNewRule} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"><Plus className="h-4 w-4" /> قاعدة جديدة</button></div><div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4"><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">الأبعاد النشطة</p><p className="mt-1 text-2xl font-bold tabular-nums">{dimensions.filter((dimension) => dimension.status === 'active').length}</p></div><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">الوحدات النشطة</p><p className="mt-1 text-2xl font-bold tabular-nums">{activeUnits.length}</p></div><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">قواعد التحويل النشطة</p><p className="mt-1 text-2xl font-bold tabular-nums">{activeRules.length}</p></div><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">تعريفات وحدات البيع</p><p className="mt-1 text-2xl font-bold tabular-nums">{sellingUnits.length}</p></div></div></section>
      {notice && <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-600/25 bg-emerald-600/10 p-3 text-sm"><Check className="h-4 w-4 text-emerald-700" />{notice}<button type="button" onClick={() => setNotice(null)} aria-label="إخفاء الرسالة" className="ms-auto"><X className="h-4 w-4" /></button></div>}
      {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <section className="rounded-2xl border bg-background p-5 md:p-7">
        <div className="flex items-start gap-3"><span className="rounded-xl bg-primary/10 p-3 text-primary"><Calculator className="h-5 w-5" /></span><div><h2 className="text-lg font-bold">حاسبة تحويل الوحدات</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">تستدعي دالة PostgreSQL نفسها التي تتحقق من توافق البُعد. لا يمكن تحويل وحدات من أبعاد مختلفة مثل الكتلة والقدرة.</p></div></div>
        <form onSubmit={runConversion} className="mt-5 grid items-end gap-3 md:grid-cols-[minmax(100px,0.7fr)_minmax(0,1fr)_auto_minmax(0,1fr)_auto]">
          <div className="space-y-1.5"><label htmlFor="convert-value" className="text-sm font-medium">القيمة</label><input id="convert-value" type="number" step="any" required value={value} onChange={(event) => setValue(event.target.value)} className="h-11 w-full rounded-lg border bg-background px-3" /></div>
          <div className="space-y-1.5"><label htmlFor="convert-source" className="text-sm font-medium">من الوحدة</label><select id="convert-source" value={sourceUnit?.id ?? ''} onChange={(event) => { setSourceId(event.target.value); setTargetId(''); setConverted(null); }} required className="h-11 w-full rounded-lg border bg-background px-3">{activeUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name_ar}{unit.symbol ? ` (${unit.symbol})` : ''} · {dimensionsById.get(unit.dimension_id)?.name_ar}</option>)}</select></div>
          <Redo2 className="mx-auto mb-3 hidden h-5 w-5 text-muted-foreground md:block" />
          <div className="space-y-1.5"><label htmlFor="convert-target" className="text-sm font-medium">إلى الوحدة</label><select id="convert-target" value={selectedTarget?.id ?? ''} onChange={(event) => { setTargetId(event.target.value); setConverted(null); }} required disabled={!compatibleUnits.length} className="h-11 w-full rounded-lg border bg-background px-3 disabled:opacity-50">{compatibleUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name_ar}{unit.symbol ? ` (${unit.symbol})` : ''}</option>)}</select></div>
          <button type="submit" disabled={convertPending || !sourceUnit || !selectedTarget || !Number.isFinite(Number(value))} className="h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{convertPending ? 'يحسب...' : 'تحويل'}</button>
        </form>
        {convertError && <p role="alert" className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{convertError}</p>}
        {converted !== null && sourceUnit && selectedTarget && <div role="status" className="mt-4 rounded-xl border border-primary/25 bg-primary/5 p-4"><p className="text-sm text-muted-foreground">النتيجة</p><p className="mt-1 text-2xl font-bold tabular-nums" dir="ltr">{new Intl.NumberFormat('en-US', { maximumFractionDigits: 12 }).format(converted)} {selectedTarget.symbol ?? selectedTarget.key}</p><p className="mt-1 text-sm text-muted-foreground">{value} {sourceUnit.symbol ?? sourceUnit.key} = {new Intl.NumberFormat('en-US', { maximumFractionDigits: 12 }).format(converted)} {selectedTarget.symbol ?? selectedTarget.key}</p></div>}
        {!activeUnits.length && <p className="mt-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">أضف أبعاداً ووحدات نشطة أولاً من <a href="/measurements" className="font-semibold text-primary underline">مركز الوحدات والأبعاد</a>.</p>}
      </section>

      <section className="overflow-hidden rounded-2xl border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 md:p-5"><div><h2 className="font-bold">قواعد التحويل المسجلة</h2><p className="mt-1 text-sm text-muted-foreground">القيمة المستهدفة = القيمة المصدر × المعامل + الإزاحة.</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs">{conversionRules.length} قاعدة</span></div>
        {conversionRules.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-right text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="p-3 font-medium">المصدر</th><th className="p-3 font-medium">الهدف</th><th className="p-3 font-medium">المعامل</th><th className="p-3 font-medium">الإزاحة</th><th className="p-3 font-medium">السياق</th><th className="p-3 font-medium">الحالة</th><th className="p-3 font-medium">الإجراءات</th></tr></thead><tbody className="divide-y">{conversionRules.map((rule) => { const source = unitsById.get(rule.source_unit_id); const target = unitsById.get(rule.target_unit_id); const selling = sellingUnits.find((item) => item.id === rule.selling_unit_definition_id); return <tr key={rule.id}><td className="p-3 font-medium">{source?.name_ar ?? 'وحدة غير متاحة'}{source?.symbol && <span className="ms-1 text-xs text-muted-foreground" dir="ltr">{source.symbol}</span>}</td><td className="p-3 font-medium">{target?.name_ar ?? 'وحدة غير متاحة'}{target?.symbol && <span className="ms-1 text-xs text-muted-foreground" dir="ltr">{target.symbol}</span>}</td><td className="p-3 font-mono" dir="ltr">{rule.multiplier}</td><td className="p-3 font-mono" dir="ltr">{rule.offset_value}</td><td className="p-3 text-xs">{selling ? selling.name_ar : 'تحويل فيزيائي عام'}<p className="mt-1 text-muted-foreground">{source && target ? dimensionsById.get(source.dimension_id)?.name_ar : ''}</p></td><td className="p-3">{rule.status === 'active' ? 'نشطة' : 'مؤرشفة'}</td><td className="p-3"><div className="flex items-center gap-1">{rule.status === 'active' && <button type="button" aria-label="تعديل قاعدة التحويل" onClick={() => { setDraft({ id: rule.id, source_unit_id: rule.source_unit_id, target_unit_id: rule.target_unit_id, multiplier: rule.multiplier, offset_value: rule.offset_value, selling_unit_definition_id: rule.selling_unit_definition_id ?? '' }); setError(null); setNotice(null); }} className="rounded-lg p-2 hover:bg-muted"><Edit3 className="h-4 w-4" /></button>}<button type="button" disabled={pending} onClick={() => changeRuleStatus(rule)} aria-label={rule.status === 'active' ? 'أرشفة قاعدة التحويل' : 'إعادة تنشيط قاعدة التحويل'} className="rounded-lg p-2 hover:bg-muted disabled:opacity-50"><Archive className="h-4 w-4" /></button></div></td></tr>; })}</tbody></table></div> : <div className="p-10 text-center"><Ruler className="mx-auto h-8 w-8 text-muted-foreground" /><h3 className="mt-3 font-semibold">لا توجد قواعد مسجلة</h3><p className="mt-1 text-sm text-muted-foreground">يمكنك استخدام الحاسبة مباشرة؛ أضف قاعدة عندما تحتاج إلى توثيق تحويل محدد أو ربطه بوحدة بيع.</p></div>}
      </section>

      {draft && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setDraft(null); }}><section role="dialog" aria-modal="true" aria-labelledby="conversion-dialog-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border bg-background p-5 shadow-2xl sm:rounded-2xl md:p-7"><div className="mb-5 flex items-start justify-between gap-3"><div><h2 id="conversion-dialog-title" className="text-xl font-bold">{draft.id ? 'تعديل قاعدة التحويل' : 'قاعدة تحويل جديدة'}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">يجب أن تنتمي الوحدتان إلى البُعد الفيزيائي نفسه. التحويل العام يطابق عوامل الوحدات؛ الربط بوحدة بيع يسمح بعامل خاص.</p></div><button type="button" onClick={() => setDraft(null)} aria-label="إغلاق" className="rounded-lg p-2 hover:bg-muted"><X className="h-5 w-5" /></button></div>
        <form onSubmit={submitRule} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><label htmlFor="rule-source" className="text-sm font-medium">وحدة المصدر *</label><select id="rule-source" required value={draft.source_unit_id} onChange={(event) => { const sourceId = event.target.value; const source = unitsById.get(sourceId); const targets = activeUnits.filter((unit) => unit.dimension_id === source?.dimension_id && unit.id !== sourceId); updateRuleUnits(sourceId, targets[0]?.id ?? '', draft.selling_unit_definition_id); }} className="h-11 w-full rounded-lg border bg-background px-3">{activeUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name_ar} · {dimensionsById.get(unit.dimension_id)?.name_ar}</option>)}</select></div>
          <div className="space-y-1.5"><label htmlFor="rule-target" className="text-sm font-medium">وحدة الهدف *</label><select id="rule-target" required value={draft.target_unit_id} onChange={(event) => updateRuleUnits(draft.source_unit_id, event.target.value, draft.selling_unit_definition_id)} className="h-11 w-full rounded-lg border bg-background px-3">{activeUnits.filter((unit) => unit.dimension_id === unitsById.get(draft.source_unit_id)?.dimension_id && unit.id !== draft.source_unit_id).map((unit) => <option key={unit.id} value={unit.id}>{unit.name_ar}{unit.symbol ? ` (${unit.symbol})` : ''}</option>)}</select></div>
          <div className="space-y-1.5"><label htmlFor="rule-selling-unit" className="text-sm font-medium">تعريف وحدة بيع (اختياري)</label><select id="rule-selling-unit" value={draft.selling_unit_definition_id} onChange={(event) => { const id = event.target.value; setDraft((current) => { if (!current) return current; const expected = refreshExpected(unitsById.get(current.source_unit_id), unitsById.get(current.target_unit_id)); return { ...current, selling_unit_definition_id: id, ...(!id ? expected : {}) }; }); }} className="h-11 w-full rounded-lg border bg-background px-3"><option value="">تحويل فيزيائي عام</option>{sellingUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name_ar} · {unit.key}</option>)}</select></div>
          <div className="space-y-1.5"><label htmlFor="rule-multiplier" className="text-sm font-medium">المعامل *</label><input id="rule-multiplier" type="number" step="any" min="0.000000000000000001" required value={draft.multiplier} disabled={!draft.selling_unit_definition_id} onChange={(event) => setDraft({ ...draft, multiplier: Number(event.target.value) })} className="h-11 w-full rounded-lg border bg-background px-3 disabled:opacity-60" /></div>
          <div className="space-y-1.5 sm:col-span-2"><label htmlFor="rule-offset" className="text-sm font-medium">الإزاحة *</label><input id="rule-offset" type="number" step="any" required value={draft.offset_value} disabled={!draft.selling_unit_definition_id} onChange={(event) => setDraft({ ...draft, offset_value: Number(event.target.value) })} className="h-11 w-full rounded-lg border bg-background px-3 disabled:opacity-60" /></div>
        </div>
          {!draft.selling_unit_definition_id && <div className="rounded-lg border bg-muted/40 p-3 text-sm leading-6">المعامل والإزاحة محسوبان من عوامل الوحدتين ولا يمكن تعديلهما يدويًا. إذا احتجت تحويلًا خاصًا بوحدة بيع، اختر تعريف وحدة البيع أعلاه.</div>}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm"><p className="font-medium">معاينة المعادلة</p><p className="mt-1 font-mono" dir="ltr">target = source × {draft.multiplier} + ({draft.offset_value})</p></div>
          <div className="flex justify-end gap-2 border-t pt-4"><button type="button" onClick={() => setDraft(null)} className="h-10 rounded-lg border px-4 text-sm">إلغاء</button><button type="submit" disabled={pending || !draft.source_unit_id || !draft.target_unit_id} className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{pending ? 'جارٍ الحفظ...' : 'حفظ القاعدة'}</button></div></form>
      </section></div>}
    </div>
  );
}
