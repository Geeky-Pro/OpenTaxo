'use client';

import { useMemo, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Check, Edit3, ListPlus, Plus, Search, X } from 'lucide-react';
import {
  saveAttributeValue,
  saveValueSet,
  setAttributeValueArchived,
  setValueSetArchived,
} from '@/lib/actions/value-sets';
import type { AttributeValueRecord, EnumAttributeOption, ValueSetRecord } from '@/lib/data/value-sets';

type Props = {
  valueSets: ValueSetRecord[];
  values: AttributeValueRecord[];
  enumAttributes: EnumAttributeOption[];
};
type SetDraft = {
  id: string | null;
  key: string;
  name_ar: string;
  name_en: string;
  attribute_id: string;
  sort_order: number;
};
type ValueDraft = {
  id: string | null;
  value_set_id: string;
  value_key: string;
  label_ar: string;
  label_en: string;
  raw_value: string;
  sort_order: number;
};

const emptySet = (): SetDraft => ({ id: null, key: '', name_ar: '', name_en: '', attribute_id: '', sort_order: 0 });
const emptyValue = (value_set_id: string, order: number): ValueDraft => ({
  id: null, value_set_id, value_key: '', label_ar: '', label_en: '', raw_value: '', sort_order: order,
});

export function ValueSetManager({ valueSets, values, enumAttributes }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState(() => valueSets.find((item) => item.status === 'active')?.id ?? valueSets[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [setDraft, setSetDraft] = useState<SetDraft | null>(null);
  const [valueDraft, setValueDraft] = useState<ValueDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filteredSets = useMemo(() => valueSets.filter((set) =>
    (showArchived || set.status === 'active') &&
    [set.key, set.name_ar, set.name_en ?? ''].some((text) => text.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
  ), [valueSets, showArchived, search]);
  const selected = valueSets.find((set) => set.id === selectedId) ?? filteredSets[0] ?? null;
  const selectedValues = useMemo(() => values.filter((value) =>
    value.value_set_id === selected?.id && (showArchived || value.status === 'active')
  ), [values, selected?.id, showArchived]);
  const selectedAttribute = enumAttributes.find((attribute) => attribute.id === selected?.attribute_id);

  const showResult = (message: string | null) => {
    setError(message);
    if (!message) setNotice('تم الحفظ بنجاح.');
  };

  const submitSet = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!setDraft) return;
    setError(null);
    startTransition(async () => {
      const result = await saveValueSet({
        ...setDraft,
        name_en: setDraft.name_en.trim() || null,
        attribute_id: setDraft.attribute_id || null,
      });
      if (!result.success) { showResult(typeof result.error === 'string' ? result.error : 'راجع البيانات المدخلة.'); return; }
      const savedId = typeof result.data === 'string' ? result.data : setDraft.id;
      setSetDraft(null);
      setSelectedId(savedId ?? selectedId);
      setNotice('تم حفظ مجموعة القيم.');
      router.refresh();
    });
  };

  const submitValue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valueDraft) return;
    setError(null);
    startTransition(async () => {
      const result = await saveAttributeValue({
        ...valueDraft,
        label_en: valueDraft.label_en.trim() || null,
        raw_value: valueDraft.raw_value.trim() || null,
      });
      if (!result.success) { showResult(typeof result.error === 'string' ? result.error : 'راجع البيانات المدخلة.'); return; }
      setValueDraft(null);
      setNotice('تم حفظ القيمة.');
      router.refresh();
    });
  };

  const changeSetStatus = (set: ValueSetRecord) => {
    const archived = set.status === 'active';
    const message = archived ? 'ستُؤرشف المجموعة مع الاحتفاظ بالقيم. هل تريد المتابعة؟' : 'إعادة تنشيط مجموعة القيم؟';
    if (!window.confirm(message)) return;
    setError(null);
    startTransition(async () => {
      const result = await setValueSetArchived(set.id, archived);
      if (!result.success) { showResult(typeof result.error === 'string' ? result.error : 'تعذر تغيير حالة المجموعة.'); return; }
      setNotice(archived ? 'تمت أرشفة مجموعة القيم.' : 'تمت إعادة تنشيط مجموعة القيم.');
      router.refresh();
    });
  };

  const changeValueStatus = (value: AttributeValueRecord) => {
    const archived = value.status === 'active';
    if (!window.confirm(archived ? 'أرشفة هذه القيمة؟' : 'إعادة تنشيط هذه القيمة؟')) return;
    setError(null);
    startTransition(async () => {
      const result = await setAttributeValueArchived(value.id, archived);
      if (!result.success) { showResult(typeof result.error === 'string' ? result.error : 'تعذر تغيير حالة القيمة.'); return; }
      setNotice(archived ? 'تمت أرشفة القيمة.' : 'تمت إعادة تنشيط القيمة.');
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-background p-5 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">التعريفات المركزية · Unit 25</p>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl">مركز القيم</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">عرّف مجموعة خيارات مرة واحدة، ثم أعد استخدامها في السمات من نوع Enum. تبقى المفاتيح ثابتة للأنظمة، بينما يمكن تعديل التسميات العربية والإنجليزية وترتيب العرض.</p>
          </div>
          <button type="button" onClick={() => { setSetDraft(emptySet()); setError(null); setNotice(null); }} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"><Plus className="h-4 w-4" /> مجموعة جديدة</button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">المجموعات</p><p className="mt-1 text-2xl font-bold tabular-nums">{valueSets.length}</p></div>
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">المجموعات النشطة</p><p className="mt-1 text-2xl font-bold tabular-nums">{valueSets.filter((set) => set.status === 'active').length}</p></div>
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">القيم</p><p className="mt-1 text-2xl font-bold tabular-nums">{values.length}</p></div>
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">خيارات Enum المتاحة</p><p className="mt-1 text-2xl font-bold tabular-nums">{enumAttributes.length}</p></div>
        </div>
      </section>

      {notice && <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-600/25 bg-emerald-600/10 p-3 text-sm"><Check className="h-4 w-4 text-emerald-700" />{notice}<button type="button" onClick={() => setNotice(null)} className="ms-auto rounded p-1" aria-label="إخفاء الرسالة"><X className="h-4 w-4" /></button></div>}
      {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(260px,0.85fr)_minmax(0,1.65fr)]">
        <aside className="overflow-hidden rounded-2xl border bg-background">
          <div className="space-y-3 border-b p-4">
            <div className="flex items-center justify-between gap-2"><h2 className="font-bold">مجموعات القيم</h2><span className="text-xs text-muted-foreground">{filteredSets.length}</span></div>
            <label className="flex h-10 items-center gap-2 rounded-lg border px-3"><Search className="h-4 w-4 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث بالاسم أو المفتاح..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} /> إظهار المؤرشف</label>
          </div>
          <div className="max-h-[620px] divide-y overflow-y-auto">
            {filteredSets.map((set) => <button type="button" key={set.id} onClick={() => { setSelectedId(set.id); setValueDraft(null); setError(null); setNotice(null); }} className={`block w-full p-4 text-start transition-colors hover:bg-muted/50 ${selected?.id === set.id ? 'bg-primary/5 ring-1 ring-inset ring-primary/25' : ''}`}>
              <div className="flex items-start justify-between gap-2"><span className="font-semibold">{set.name_ar}</span><span className={`rounded-full px-2 py-0.5 text-[10px] ${set.status === 'active' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>{set.status === 'active' ? 'نشطة' : 'مؤرشفة'}</span></div>
              <p className="mt-1 font-mono text-xs text-muted-foreground" dir="ltr">{set.key}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{set.active_value_count} قيمة نشطة</span><span>·</span><span>{set.product_type_usage_count} ارتباط بنوع منتج</span></div>
            </button>)}
            {filteredSets.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">لا توجد مجموعات تطابق البحث. أنشئ مجموعة جديدة للبدء.</p>}
          </div>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-2xl border bg-background">
          {selected ? <>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4 md:p-5">
              <div className="min-w-0"><p className="text-xs font-medium text-primary">تفاصيل المجموعة</p><h2 className="mt-1 text-xl font-bold">{selected.name_ar}</h2><p className="mt-1 font-mono text-sm text-muted-foreground" dir="ltr">{selected.key}</p>{selected.name_en && <p className="mt-1 text-sm text-muted-foreground">{selected.name_en}</p>}</div>
              <div className="flex flex-wrap gap-2">
                {selected.status === 'active' && <button type="button" onClick={() => { setSetDraft({ id: selected.id, key: selected.key, name_ar: selected.name_ar, name_en: selected.name_en ?? '', attribute_id: selected.attribute_id ?? '', sort_order: selected.sort_order }); setError(null); setNotice(null); }} className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm hover:bg-muted"><Edit3 className="h-4 w-4" /> تعديل</button>}
                <button type="button" disabled={pending} onClick={() => changeSetStatus(selected)} className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm hover:bg-muted disabled:opacity-50"><Archive className="h-4 w-4" />{selected.status === 'active' ? 'أرشفة' : 'إعادة تنشيط'}</button>
                {selected.status === 'active' && <button type="button" onClick={() => { setValueDraft(emptyValue(selected.id, selectedValues.length)); setError(null); setNotice(null); }} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground hover:opacity-90"><Plus className="h-4 w-4" /> إضافة قيمة</button>}
              </div>
            </div>
            <div className="grid gap-3 border-b bg-muted/20 p-4 sm:grid-cols-3">
              <div><p className="text-xs text-muted-foreground">الخاصية المرتبطة</p><p className="mt-1 text-sm font-medium">{selectedAttribute ? `${selectedAttribute.name_ar} · ${selectedAttribute.key}` : selected.attribute_id ? 'خاصية غير متاحة أو مؤرشفة' : 'مجموعة عامة قابلة لإعادة الاستخدام'}</p></div>
              <div><p className="text-xs text-muted-foreground">ترتيب المجموعة</p><p className="mt-1 text-sm font-medium">{selected.sort_order}</p></div>
              <div><p className="text-xs text-muted-foreground">استخدامها في Product Type</p><p className="mt-1 text-sm font-medium">{selected.product_type_usage_count ? 'مرتبطة حالياً — لا يمكن تغيير الخاصية المرتبطة أو أرشفتها' : 'غير مرتبطة حالياً'}</p></div>
            </div>
            <div className="p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="font-bold">القيم داخل المجموعة</h3><p className="mt-1 text-xs text-muted-foreground">المفتاح ثابت؛ التسمية المعروضة قابلة للترجمة.</p></div><span className="rounded-full bg-muted px-2.5 py-1 text-xs">{selectedValues.length} سجل</span></div>
              {selectedValues.length ? <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[560px] text-right text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="p-3 font-medium">المفتاح</th><th className="p-3 font-medium">التسمية العربية</th><th className="p-3 font-medium">القيمة الخام</th><th className="p-3 font-medium">الترتيب</th><th className="p-3 font-medium">الحالة</th><th className="p-3 font-medium">الإجراءات</th></tr></thead><tbody className="divide-y">{selectedValues.map((value) => <tr key={value.id} className="align-middle"><td className="p-3 font-mono text-xs" dir="ltr">{value.value_key}</td><td className="p-3 font-medium">{value.label_ar}{value.label_en && <p className="mt-0.5 text-xs text-muted-foreground">{value.label_en}</p>}</td><td className="p-3 font-mono text-xs" dir="auto">{value.raw_value ?? '—'}</td><td className="p-3 tabular-nums">{value.sort_order}</td><td className="p-3"><span className="text-xs">{value.status === 'active' ? 'نشطة' : 'مؤرشفة'}</span></td><td className="p-3"><div className="flex items-center gap-1">{value.status === 'active' && <button type="button" aria-label={`تعديل ${value.label_ar}`} onClick={() => { setValueDraft({ id: value.id, value_set_id: value.value_set_id, value_key: value.value_key, label_ar: value.label_ar, label_en: value.label_en ?? '', raw_value: value.raw_value ?? '', sort_order: value.sort_order }); setError(null); setNotice(null); }} className="rounded-lg p-2 hover:bg-muted"><Edit3 className="h-4 w-4" /></button>}<button type="button" aria-label={value.status === 'active' ? `أرشفة ${value.label_ar}` : `إعادة تنشيط ${value.label_ar}`} disabled={pending || selected.status !== 'active'} onClick={() => changeValueStatus(value)} className="rounded-lg p-2 hover:bg-muted disabled:opacity-40"><Archive className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div> : <div className="rounded-xl border border-dashed p-8 text-center"><ListPlus className="mx-auto h-8 w-8 text-muted-foreground" /><h4 className="mt-3 font-semibold">لا توجد قيم بعد</h4><p className="mt-1 text-sm text-muted-foreground">أضف خيارات مثل اللون أو المادة أو نوع الموصل، وستكون متاحة لإعادة الاستخدام.</p>{selected.status === 'active' && <button type="button" onClick={() => { setValueDraft(emptyValue(selected.id, 0)); setError(null); }} className="mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"><Plus className="h-4 w-4" /> إضافة أول قيمة</button>}</div>}
            </div>
          </> : <div className="p-10 text-center"><ListPlus className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">ابدأ بإنشاء مجموعة قيم</h2><p className="mt-1 text-sm text-muted-foreground">مثال: مجموعة الألوان تحتوي على الأسود والأبيض والأحمر.</p></div>}
        </section>
      </div>

      {setDraft && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSetDraft(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="value-set-dialog-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border bg-background p-5 shadow-2xl sm:rounded-2xl md:p-7">
          <div className="mb-5 flex items-start justify-between gap-3"><div><h2 id="value-set-dialog-title" className="text-xl font-bold">{setDraft.id ? 'تعديل مجموعة القيم' : 'مجموعة قيم جديدة'}</h2><p className="mt-1 text-sm text-muted-foreground">المجموعة العامة قابلة لإعادة الاستخدام، ويمكن ربطها بخاصية Enum واحدة عند الحاجة.</p></div><button type="button" onClick={() => setSetDraft(null)} aria-label="إغلاق" className="rounded-lg p-2 hover:bg-muted"><X className="h-5 w-5" /></button></div>
          <form onSubmit={submitSet} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><label htmlFor="set-key" className="text-sm font-medium">المفتاح الثابت</label><input id="set-key" maxLength={63} dir="ltr" value={setDraft.key} onChange={(event) => setSetDraft({ ...setDraft, key: event.target.value })} placeholder="يُنشأ تلقائياً إذا تُرك فارغاً (مثال: product_colors)" className="h-11 w-full rounded-lg border bg-background px-3 text-left font-mono text-sm" /><p className="text-xs text-muted-foreground">يُنشأ تلقائياً من الاسم إذا تُرك فارغاً، أو حدده بصيغة snake_case.</p></div>
              <div className="space-y-1.5"><label htmlFor="set-order" className="text-sm font-medium">ترتيب العرض</label><input id="set-order" type="number" min={0} max={100000} required value={setDraft.sort_order} onChange={(event) => setSetDraft({ ...setDraft, sort_order: Number(event.target.value) })} className="h-11 w-full rounded-lg border bg-background px-3" /></div>
              <div className="space-y-1.5"><label htmlFor="set-name-ar" className="text-sm font-medium">اسم المجموعة بالعربية *</label><input id="set-name-ar" required maxLength={120} value={setDraft.name_ar} onChange={(event) => setSetDraft({ ...setDraft, name_ar: event.target.value })} className="h-11 w-full rounded-lg border bg-background px-3" /></div>
              <div className="space-y-1.5"><label htmlFor="set-name-en" className="text-sm font-medium">اسم المجموعة بالإنجليزية</label><input id="set-name-en" maxLength={120} dir="ltr" value={setDraft.name_en} onChange={(event) => setSetDraft({ ...setDraft, name_en: event.target.value })} className="h-11 w-full rounded-lg border bg-background px-3 text-left" /></div>
              <div className="space-y-1.5 sm:col-span-2"><label htmlFor="set-attribute" className="text-sm font-medium">ربط اختياري بخاصية Enum</label><select id="set-attribute" value={setDraft.attribute_id} onChange={(event) => setSetDraft({ ...setDraft, attribute_id: event.target.value })} className="h-11 w-full rounded-lg border bg-background px-3"><option value="">مجموعة عامة قابلة لإعادة الاستخدام</option>{enumAttributes.map((attribute) => <option key={attribute.id} value={attribute.id}>{attribute.name_ar} · {attribute.key}</option>)}</select><p className="text-xs text-muted-foreground">إذا رُبطت المجموعة بخاصية، فلن يمكن إسنادها إلى خاصية أخرى أثناء استخدامها في Product Type.</p></div>
            </div>
            <div className="flex justify-end gap-2 border-t pt-4"><button type="button" onClick={() => setSetDraft(null)} className="h-10 rounded-lg border px-4 text-sm">إلغاء</button><button type="submit" disabled={pending} className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{pending ? 'جارٍ الحفظ...' : 'حفظ المجموعة'}</button></div>
          </form>
        </section>
      </div>}

      {valueDraft && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setValueDraft(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="value-dialog-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border bg-background p-5 shadow-2xl sm:rounded-2xl md:p-7">
          <div className="mb-5 flex items-start justify-between gap-3"><div><h2 id="value-dialog-title" className="text-xl font-bold">{valueDraft.id ? 'تعديل القيمة' : 'إضافة قيمة'}</h2><p className="mt-1 text-sm text-muted-foreground">احتفظ بالمفتاح ثابتاً واستخدم التسميات للعرض والترجمة.</p></div><button type="button" onClick={() => setValueDraft(null)} aria-label="إغلاق" className="rounded-lg p-2 hover:bg-muted"><X className="h-5 w-5" /></button></div>
          <form onSubmit={submitValue} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><label htmlFor="value-key" className="text-sm font-medium">مفتاح القيمة</label><input id="value-key" maxLength={80} dir="ltr" value={valueDraft.value_key} onChange={(event) => setValueDraft({ ...valueDraft, value_key: event.target.value })} placeholder="يُنشأ تلقائياً إذا تُرك فارغاً (مثال: dark_blue)" className="h-11 w-full rounded-lg border bg-background px-3 text-left font-mono text-sm" /><p className="text-xs text-muted-foreground">يُنشأ تلقائياً من الاسم إذا تُرك فارغاً.</p></div>
              <div className="space-y-1.5"><label htmlFor="value-order" className="text-sm font-medium">ترتيب العرض</label><input id="value-order" type="number" min={0} max={100000} required value={valueDraft.sort_order} onChange={(event) => setValueDraft({ ...valueDraft, sort_order: Number(event.target.value) })} className="h-11 w-full rounded-lg border bg-background px-3" /></div>
              <div className="space-y-1.5"><label htmlFor="value-label-ar" className="text-sm font-medium">التسمية بالعربية *</label><input id="value-label-ar" required maxLength={120} value={valueDraft.label_ar} onChange={(event) => setValueDraft({ ...valueDraft, label_ar: event.target.value })} className="h-11 w-full rounded-lg border bg-background px-3" /></div>
              <div className="space-y-1.5"><label htmlFor="value-label-en" className="text-sm font-medium">التسمية بالإنجليزية</label><input id="value-label-en" maxLength={120} dir="ltr" value={valueDraft.label_en} onChange={(event) => setValueDraft({ ...valueDraft, label_en: event.target.value })} className="h-11 w-full rounded-lg border bg-background px-3 text-left" /></div>
              <div className="space-y-1.5 sm:col-span-2"><label htmlFor="value-raw" className="text-sm font-medium">القيمة الخام (اختياري)</label><input id="value-raw" maxLength={200} dir="auto" value={valueDraft.raw_value} onChange={(event) => setValueDraft({ ...valueDraft, raw_value: event.target.value })} placeholder="مثال: #1E40AF أو رمز المورد" className="h-11 w-full rounded-lg border bg-background px-3" /><p className="text-xs text-muted-foreground">استخدمها عند الحاجة إلى لون أو رمز تقني؛ لا يلزم تكرار التسمية فيها.</p></div>
            </div>
            <div className="flex justify-end gap-2 border-t pt-4"><button type="button" onClick={() => setValueDraft(null)} className="h-10 rounded-lg border px-4 text-sm">إلغاء</button><button type="submit" disabled={pending || selected?.status !== 'active'} className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{pending ? 'جارٍ الحفظ...' : 'حفظ القيمة'}</button></div>
          </form>
        </section>
      </div>}
    </div>
  );
}
