'use client';

import { useMemo, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, CheckCircle2, Edit3, Plus, Search, X } from 'lucide-react';
import { archiveAttributeDefinition, saveAttributeDefinition } from '@/lib/actions/attribute-definitions';
import { DATA_TYPE_DEFINITIONS, FILTER_TYPE_LABELS, compatibleFiltersFor, isCompatibleFilter } from '@/lib/domain/attribute-compatibility';
import type { DataType, FilterType } from '@/lib/types/attribute';
import type { AttributeAliasInput, AttributeDefinition, AttributeDefinitionInput } from '@/lib/types/attribute-definition';
import type { MeasurementDimensionOption } from '@/lib/data/attribute-definitions';

type Props = { definitions: AttributeDefinition[]; dimensions: MeasurementDimensionOption[] };

type Draft = {
  id: string | null;
  key: string;
  name_ar: string;
  name_en: string;
  data_type: DataType;
  filter_type: FilterType;
  measurement_dimension_id: string | null;
  sort_order: number;
  aliases: AttributeAliasInput[];
};

const TYPE_LABELS = Object.fromEntries(DATA_TYPE_DEFINITIONS.map((item) => [item.key, item.labelAr])) as Record<DataType, string>;

function makeDraft(definition?: AttributeDefinition | null): Draft {
  return {
    id: definition?.id ?? null,
    key: definition?.key ?? '',
    name_ar: definition?.name_ar ?? '',
    name_en: definition?.name_en ?? '',
    data_type: definition?.data_type ?? 'string',
    filter_type: definition?.filter_type ?? 'select',
    measurement_dimension_id: definition?.measurement_dimension_id ?? null,
    sort_order: definition?.sort_order ?? 0,
    aliases: definition?.aliases.map((alias) => ({ ...alias })) ?? [],
  };
}

function DefinitionForm({
  definition,
  dimensions,
  onCancel,
  onSave,
}: {
  definition: AttributeDefinition | null;
  dimensions: MeasurementDimensionOption[];
  onCancel: () => void;
  onSave: (draft: Draft) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => makeDraft(definition));
  const [error, setError] = useState<string | null>(null);
  const compatibleFilters = compatibleFiltersFor(draft.data_type);
  const legacyFilterMismatch = !isCompatibleFilter(draft.data_type, draft.filter_type);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  const handleTypeChange = (value: DataType) => {
    const filters = compatibleFiltersFor(value);
    setDraft((current) => ({
      ...current,
      data_type: value,
      filter_type: filters.includes(current.filter_type) ? current.filter_type : filters[0]!,
      measurement_dimension_id: value === 'number' ? current.measurement_dimension_id : null,
    }));
    setError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const aliases = draft.aliases
      .map((alias) => ({ ...alias, alias_text: alias.alias_text.trim() }))
      .filter((alias) => alias.alias_text.length > 0);
    const normalized: Draft = { ...draft, key: draft.key.trim().toLowerCase(), name_ar: draft.name_ar.trim(), name_en: draft.name_en.trim(), aliases };
    if (normalized.key && !/^[a-z][a-z0-9_]{1,62}$/.test(normalized.key)) return setError('استخدم مفتاحاً بصيغة snake_case مثل power_rating.');
    if (!normalized.name_ar) return setError('الاسم العربي مطلوب.');
    if (!isCompatibleFilter(normalized.data_type, normalized.filter_type)) return setError('اختر نمط فلترة متوافقاً مع نوع البيانات.');
    if (normalized.measurement_dimension_id && normalized.data_type !== 'number') return setError('البعد الفيزيائي متاح للخصائص الرقمية فقط.');
    const aliasKeys = aliases.map((alias) => `${alias.language_code ?? ''}:${alias.alias_text.toLocaleLowerCase()}`);
    if (new Set(aliasKeys).size !== aliasKeys.length) return setError('توجد أسماء بديلة مكررة باللغة نفسها.');
    onSave(normalized);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-start justify-between gap-3 border-b pb-3">
        <div>
          <h3 className="text-lg font-bold">{definition ? 'تعديل تعريف الخاصية' : 'تعريف خاصية مركزية جديدة'}</h3>
          <p className="mt-1 text-sm text-muted-foreground">هذا التعريف مشترك؛ إعدادات الإلزامية والترتيب داخل نوع المنتج تُدار في محرر Product Type.</p>
        </div>
        <button type="button" onClick={onCancel} aria-label="إغلاق" className="rounded-lg p-2 hover:bg-muted"><X className="h-5 w-5" /></button>
      </div>

      {definition?.legacy_unit && <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm leading-6">توجد وحدة نصية قديمة محفوظة: <strong>{definition.legacy_unit}</strong>. سنحتفظ بها دون تحويلها تلقائياً؛ ربطها بوحدة فيزيائية معرّفة سيتم عبر مركز الوحدات والأبعاد.</div>}
      {legacyFilterMismatch && (
        <div role="alert" className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm leading-6">
          هذا السجل يحتوي على تركيبة قديمة غير متوافقة ({draft.data_type} / {draft.filter_type}). اختر نوع البيانات أو نمط الفلترة الصحيح قبل الحفظ؛ لن تُعدّل البيانات تلقائياً.
        </div>
      )}
      {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {definition && (definition.usage_count > 0 || definition.value_set_count > 0) && <p className="rounded-lg border bg-muted/40 p-3 text-sm leading-6 text-muted-foreground">لأن هذه الخاصية مرتبطة بنوع منتج أو مجموعة قيم، لا يمكن تغيير نوع بياناتها أو بُعدها الفيزيائي حتى تُفصل الارتباطات أولاً. يمكنك تعديل الاسم والمفتاح والأسماء البديلة ونمط فلترة متوافق.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="attribute-key" className="text-sm font-medium">المفتاح الفريد (key)</label>
          <input id="attribute-key" value={draft.key} onChange={(event) => update('key', event.target.value)} maxLength={63} dir="ltr" placeholder="يُنشأ تلقائياً إذا تُرك فارغاً (مثال: power_rating)" className="h-11 w-full rounded-lg border bg-background px-3 text-left font-mono text-sm" />
          <p className="text-xs text-muted-foreground">يُنشأ تلقائياً من الاسم إذا تُرك فارغاً، أو حدده بصيغة snake_case.</p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="attribute-order" className="text-sm font-medium">ترتيب العرض</label>
          <input id="attribute-order" type="number" min={0} max={100000} value={draft.sort_order} onChange={(event) => update('sort_order', Number(event.target.value))} className="h-11 w-full rounded-lg border bg-background px-3" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="attribute-name-ar" className="text-sm font-medium">الاسم بالعربية *</label>
          <input id="attribute-name-ar" value={draft.name_ar} onChange={(event) => update('name_ar', event.target.value)} required maxLength={120} className="h-11 w-full rounded-lg border bg-background px-3" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="attribute-name-en" className="text-sm font-medium">الاسم بالإنجليزية</label>
          <input id="attribute-name-en" value={draft.name_en} onChange={(event) => update('name_en', event.target.value)} maxLength={120} dir="ltr" className="h-11 w-full rounded-lg border bg-background px-3 text-left" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="attribute-data-type" className="text-sm font-medium">نوع البيانات *</label>
          <select id="attribute-data-type" value={draft.data_type} onChange={(event) => handleTypeChange(event.target.value as DataType)} disabled={Boolean(definition && (definition.usage_count > 0 || definition.value_set_count > 0))} className="h-11 w-full rounded-lg border bg-background px-3 disabled:opacity-50">
            {DATA_TYPE_DEFINITIONS.map((item) => <option key={item.key} value={item.key}>{item.labelAr} ({item.labelEn})</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="attribute-filter-type" className="text-sm font-medium">نمط الفلترة *</label>
          <select id="attribute-filter-type" value={draft.filter_type} onChange={(event) => update('filter_type', event.target.value as FilterType)} className="h-11 w-full rounded-lg border bg-background px-3">
            {legacyFilterMismatch && <option value={draft.filter_type}>قديم وغير متوافق — {FILTER_TYPE_LABELS[draft.filter_type]}</option>}
            {compatibleFilters.map((filter) => <option key={filter} value={filter}>{FILTER_TYPE_LABELS[filter]}</option>)}
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="attribute-dimension" className="text-sm font-medium">البعد الفيزيائي (للخصائص الرقمية فقط)</label>
          <select id="attribute-dimension" value={draft.measurement_dimension_id ?? ''} onChange={(event) => update('measurement_dimension_id', event.target.value || null)} disabled={draft.data_type !== 'number' || Boolean(definition && definition.usage_count > 0)} className="h-11 w-full rounded-lg border bg-background px-3 disabled:opacity-50">
            <option value="">لا يوجد بُعد</option>
            {dimensions.map((dimension) => <option key={dimension.id} value={dimension.id}>{dimension.name_ar} — {dimension.key}{dimension.name_en ? ` (${dimension.name_en})` : ''}</option>)}
          </select>
          {draft.data_type !== 'number' && <p className="text-xs text-muted-foreground">الوحدات والأبعاد لا تنطبق على النص أو القيم المنطقية أو القوائم الثابتة.</p>}
          {draft.data_type === 'number' && dimensions.length === 0 && <p className="text-xs text-muted-foreground">لم تُعرّف أبعاد فيزيائية بعد؛ ستظهر خياراتها بعد إعداد مركز الوحدات والأبعاد.</p>}
        </div>
      </div>

      <section className="space-y-3 rounded-xl border p-4">
        <div className="flex items-center justify-between gap-3">
          <div><h4 className="font-semibold">الأسماء البديلة</h4><p className="text-xs text-muted-foreground">تُستخدم للبحث والتكامل مع أسماء مختلفة للخاصية.</p></div>
          <button type="button" onClick={() => update('aliases', [...draft.aliases, { alias_text: '', language_code: 'ar' }])} className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm hover:bg-muted"><Plus className="h-4 w-4" /> إضافة اسم</button>
        </div>
        {draft.aliases.length === 0 ? <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">لا توجد أسماء بديلة.</p> : (
          <div className="space-y-2">
            {draft.aliases.map((alias, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px_40px]">
                <input aria-label={`الاسم البديل ${index + 1}`} value={alias.alias_text} onChange={(event) => update('aliases', draft.aliases.map((item, itemIndex) => itemIndex === index ? { ...item, alias_text: event.target.value } : item))} maxLength={200} placeholder="مثال: القدرة الكهربائية" className="h-10 min-w-0 rounded-lg border bg-background px-3" />
                <select aria-label="لغة الاسم البديل" value={alias.language_code ?? 'ar'} onChange={(event) => update('aliases', draft.aliases.map((item, itemIndex) => itemIndex === index ? { ...item, language_code: event.target.value as 'ar' | 'en' } : item))} className="h-10 rounded-lg border bg-background px-2"><option value="ar">عربي</option><option value="en">إنجليزي</option></select>
                <button type="button" onClick={() => update('aliases', draft.aliases.filter((_, itemIndex) => itemIndex !== index))} aria-label="حذف الاسم البديل" className="flex h-10 items-center justify-center rounded-lg border text-muted-foreground hover:border-destructive hover:text-destructive"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="h-11 rounded-lg border px-4 text-sm font-medium hover:bg-muted">إلغاء</button>
        <button type="submit" className="h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"><CheckCircle2 className="ml-2 inline h-4 w-4" /> حفظ التعريف</button>
      </div>
    </form>
  );
}

export function AttributeDefinitionManager({ definitions, dimensions }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<DataType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [editing, setEditing] = useState<AttributeDefinition | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<AttributeDefinition | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isArchiving, startArchive] = useTransition();

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return definitions.filter((definition) => {
      if (typeFilter !== 'all' && definition.data_type !== typeFilter) return false;
      if (statusFilter !== 'all' && definition.status !== statusFilter) return false;
      const haystack = [definition.key, definition.name_ar, definition.name_en ?? '', ...definition.aliases.map((alias) => alias.alias_text)].join(' ').toLocaleLowerCase();
      return !normalized || haystack.includes(normalized);
    });
  }, [definitions, query, typeFilter, statusFilter]);

  const handleSave = (draft: Draft) => {
    setFormError(null);
    const payload: AttributeDefinitionInput = {
      ...draft,
      name_en: draft.name_en.trim() || null,
      aliases: draft.aliases,
    };
    startSave(async () => {
      const result = await saveAttributeDefinition(payload);
      if (!result.success) {
        setFormError(typeof result.error === 'string' ? result.error : 'تعذر حفظ تعريف الخاصية.');
        return;
      }
      setFormOpen(false);
      setEditing(null);
      router.refresh();
    });
  };

  const handleArchive = () => {
    if (!archiving) return;
    setArchiveError(null);
    startArchive(async () => {
      const result = await archiveAttributeDefinition(archiving.id);
      if (!result.success) {
        setArchiveError(typeof result.error === 'string' ? result.error : 'تعذر أرشفة الخاصية.');
        return;
      }
      setArchiving(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border bg-background p-5 md:flex-row md:items-center md:justify-between">
        <div><p className="text-sm font-medium text-primary">التعريفات المركزية</p><h1 className="mt-1 text-2xl font-bold md:text-3xl">مركز الخصائص</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">عرّف الخاصية مرة واحدة بمفتاح ثابت وأسماء مترجمة وبديلة ونوع بيانات وبُعد فيزيائي. إعدادات الإلزامية والفلترة داخل كل نوع منتج تبقى في محرر Product Type.</p></div>
        <button type="button" onClick={() => { setEditing(null); setFormError(null); setFormOpen(true); }} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"><Plus className="h-4 w-4" /> خاصية جديدة</button>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border bg-background p-4"><p className="text-xs text-muted-foreground">إجمالي التعريفات</p><p className="mt-1 text-2xl font-bold">{definitions.length}</p></div>
        <div className="rounded-xl border bg-background p-4"><p className="text-xs text-muted-foreground">نشطة</p><p className="mt-1 text-2xl font-bold">{definitions.filter((item) => item.status === 'active').length}</p></div>
        <div className="rounded-xl border bg-background p-4"><p className="text-xs text-muted-foreground">أسماء بديلة</p><p className="mt-1 text-2xl font-bold">{definitions.reduce((total, item) => total + item.aliases.length, 0)}</p></div>
        <div className="rounded-xl border bg-background p-4"><p className="text-xs text-muted-foreground">أبعاد معرفة</p><p className="mt-1 text-2xl font-bold">{dimensions.length}</p></div>
      </div>

      <div className="grid gap-3 rounded-2xl border bg-background p-4 sm:grid-cols-[minmax(0,1fr)_180px_180px]">
        <label className="relative"><span className="sr-only">البحث في تعريفات الخصائص</span><Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالمفتاح أو الاسم أو الاسم البديل..." className="h-11 w-full rounded-lg border bg-background pe-10 ps-3 text-sm" /></label>
        <select aria-label="تصفية نوع البيانات" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as DataType | 'all')} className="h-11 rounded-lg border bg-background px-3 text-sm"><option value="all">كل أنواع البيانات</option>{DATA_TYPE_DEFINITIONS.map((item) => <option key={item.key} value={item.key}>{item.labelAr}</option>)}</select>
        <select aria-label="تصفية الحالة" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | 'active' | 'archived')} className="h-11 rounded-lg border bg-background px-3 text-sm"><option value="active">النشطة</option><option value="archived">المؤرشفة</option><option value="all">كل الحالات</option></select>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground"><span>عرض {filtered.length} من {definitions.length} تعريف</span><span>الأرشفة آمنة؛ الحذف النهائي غير متاح.</span></div>

      {filtered.length === 0 ? <div className="rounded-2xl border border-dashed p-12 text-center"><Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" /><p className="font-semibold">لا توجد تعريفات مطابقة</p><p className="mt-1 text-sm text-muted-foreground">غيّر البحث أو أضف تعريفاً جديداً.</p></div> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((definition) => {
            const mismatch = definition.filter_type !== null && !isCompatibleFilter(definition.data_type, definition.filter_type);
            return <article key={definition.id} className="space-y-4 rounded-2xl border bg-background p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="break-words text-lg font-bold">{definition.name_ar}</h2><span className={`rounded-full px-2 py-0.5 text-xs ${definition.status === 'active' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>{definition.status === 'active' ? 'نشطة' : 'مؤرشفة'}</span></div>{definition.name_en && <p className="mt-0.5 text-sm text-muted-foreground" dir="ltr">{definition.name_en}</p>}<p className="mt-2 break-all font-mono text-xs text-muted-foreground" dir="ltr">{definition.key}</p></div><div className="flex shrink-0 gap-1">{definition.status === 'active' && <><button type="button" aria-label={`تعديل ${definition.name_ar}`} onClick={() => { setEditing(definition); setFormError(null); setFormOpen(true); }} className="rounded-lg border p-2 hover:border-primary/50 hover:text-primary"><Edit3 className="h-4 w-4" /></button><button type="button" aria-label={`أرشفة ${definition.name_ar}`} onClick={() => { setArchiving(definition); setArchiveError(null); }} disabled={definition.usage_count > 0 || definition.value_set_count > 0} title={definition.usage_count > 0 || definition.value_set_count > 0 ? 'أزل الارتباطات أولاً' : 'أرشفة التعريف'} className="rounded-lg border p-2 hover:border-destructive/50 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30"><Archive className="h-4 w-4" /></button></>}</div></div>
              <div className="flex flex-wrap gap-2"><span className="rounded-lg bg-muted px-2.5 py-1 text-xs">{TYPE_LABELS[definition.data_type]}</span><span className="rounded-lg bg-muted px-2.5 py-1 text-xs">{definition.filter_type ? FILTER_TYPE_LABELS[definition.filter_type] : 'لا يوجد فلتر'}</span>{definition.dimension_name_ar && <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs text-primary">{definition.dimension_name_ar}</span>}</div>
              {mismatch && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs leading-5">تعريف قديم غير متوافق. سيظل محفوظاً حتى يراجعه المالك ويعدله صراحةً.</p>}
              {definition.legacy_unit && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs leading-5">وحدة نصية قديمة محفوظة: {definition.legacy_unit} — لم تُحوّل بعد إلى وحدة مركزية.</p>}
              <div className="grid grid-cols-2 gap-3 border-t pt-3 text-sm"><div><p className="text-xs text-muted-foreground">الاستخدام</p><p className="mt-1 font-semibold">{definition.usage_count} ارتباط Product Type</p></div><div><p className="text-xs text-muted-foreground">مجموعات القيم</p><p className="mt-1 font-semibold">{definition.value_set_count}</p></div></div>
              {definition.aliases.length > 0 && <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground">الأسماء البديلة</p><div className="flex flex-wrap gap-1.5">{definition.aliases.map((alias, index) => <span key={`${alias.language_code}:${alias.alias_text}:${index}`} className="rounded-full border px-2 py-1 text-xs">{alias.alias_text} <span className="text-muted-foreground">({alias.language_code === 'en' ? 'EN' : 'AR'})</span></span>)}</div></div>}
            </article>;
          })}
        </div>
      )}

      {formOpen && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-3 sm:p-6"><div className="mx-auto my-4 w-full max-w-3xl rounded-2xl bg-background p-4 shadow-2xl sm:p-6">{formError && <div role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{formError}</div>}<fieldset disabled={isSaving} className="min-w-0 disabled:opacity-70"><DefinitionForm definition={editing} dimensions={dimensions} onCancel={() => { setFormOpen(false); setEditing(null); }} onSave={handleSave} /></fieldset>{isSaving && <p role="status" className="mt-3 text-sm text-muted-foreground">جارٍ حفظ التعريف والأسماء البديلة...</p>}</div></div>}

      {archiving && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="archive-title" className="w-full max-w-md space-y-4 rounded-2xl bg-background p-6 shadow-2xl"><div className="flex items-center gap-3"><Archive className="h-5 w-5 text-destructive" /><h2 id="archive-title" className="text-lg font-bold">تأكيد أرشفة الخاصية</h2></div><p className="text-sm leading-6">سيتم إيقاف استخدام <strong>{archiving.name_ar}</strong> في التعريفات النشطة، مع الاحتفاظ بسجلها وأسمائها البديلة. لن تُحذف أي بيانات.</p>{archiveError && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{archiveError}</p>}<div className="flex justify-end gap-2"><button type="button" disabled={isArchiving} onClick={() => setArchiving(null)} className="h-10 rounded-lg border px-4 text-sm">إلغاء</button><button type="button" disabled={isArchiving} onClick={handleArchive} className="h-10 rounded-lg bg-destructive px-4 text-sm font-semibold text-destructive-foreground disabled:opacity-50">{isArchiving ? 'جارٍ الأرشفة...' : 'أرشفة'}</button></div></section></div>}
    </div>
  );
}
