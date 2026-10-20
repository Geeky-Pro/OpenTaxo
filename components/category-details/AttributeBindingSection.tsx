'use client';

import { useState, useTransition } from 'react';
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import TagInput from './TagInput';
import { saveProductTypeAttributeAssignments } from '@/lib/actions/product-type-attributes';
import type { CategoryWithEnrichedAttributes } from '@/lib/actions/category-details';
import type { ProductTypeEditorOptions } from '@/lib/data/product-type-editor';
import type { Attribute } from '@/lib/types/attribute';

type EnrichedCategoryAttribute = CategoryWithEnrichedAttributes['enriched_attributes'][number];

interface AttributeBindingSectionProps {
  boundAttributes: EnrichedCategoryAttribute[];
  globalAttributes: Attribute[];
  taxonomyNodeId: string;
  routeId: string;
  options: ProductTypeEditorOptions;
  onAdd: (attributeId: string) => void;
  onUpdate: (index: number, attr: EnrichedCategoryAttribute) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
}

const ROLES = [
  { value: 'descriptive', label: 'وصفية (Descriptive)' },
  { value: 'variant', label: 'تغييرية (Variant)' },
  { value: 'identity', label: 'هوية (Identity)' },
  { value: 'commercial', label: 'تجارية (Commercial)' },
] as const;

const DATA_TYPE_LABELS: Record<Attribute['data_type'], string> = {
  string: 'نص',
  number: 'رقم',
  boolean: 'نعم / لا',
  enum: 'قائمة محددة',
};

export default function AttributeBindingSection({
  boundAttributes,
  globalAttributes,
  taxonomyNodeId,
  routeId,
  options,
  onAdd,
  onUpdate,
  onRemove,
  onMove,
}: AttributeBindingSectionProps) {
  const [selectedAttributeToAdd, setSelectedAttributeToAdd] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();

  const unboundAttributes = globalAttributes.filter(
    (global) => !boundAttributes.some((bound) => bound.attribute_id === global.id),
  );

  const handleAdd = () => {
    if (!selectedAttributeToAdd) return;
    onAdd(selectedAttributeToAdd);
    setSelectedAttributeToAdd('');
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handleSave = () => {
    setSaveError(null);
    setSaveSuccess(null);
    startSave(async () => {
      const payload = boundAttributes.map((binding) => ({
        attribute_id: binding.attribute_id,
        role: binding.role,
        ...(binding.group ? { group: binding.group } : {}),
        is_variant: binding.is_variant,
        is_required: binding.is_required,
        is_filterable: binding.is_filterable,
        ...(binding.min_value !== undefined ? { min_value: binding.min_value } : {}),
        ...(binding.max_value !== undefined ? { max_value: binding.max_value } : {}),
        ...(binding.unit_id ? { unit_id: binding.unit_id } : {}),
        ...(binding.value_set_id ? { value_set_id: binding.value_set_id } : {}),
        ...(binding.allowed_values ? { allowed_values: binding.allowed_values } : {}),
      }));
      const result = await saveProductTypeAttributeAssignments(taxonomyNodeId, routeId, payload);
      if (!result.success) {
        setSaveError(typeof result.error === 'string' ? result.error : 'تحقق من إعدادات الخصائص ثم أعد المحاولة.');
        return;
      }
      setSaveSuccess(typeof result.data === 'string' ? result.data : 'تم حفظ الخصائص.');
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[--border] bg-[--background-muted] p-4 space-y-3">
        <div>
          <h3 className="font-semibold">إسناد الخصائص إلى نوع المنتج</h3>
          <p className="text-sm text-[--foreground-muted] mt-1">
            التعريف الأساسي للسمة موجود في المكتبة العامة؛ هنا تضبط سلوكها لهذا النوع من المنتجات.
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1 space-y-2">
            <label htmlFor="attribute-to-add" className="text-sm font-medium">السمة العامة</label>
            <select
              id="attribute-to-add"
              value={selectedAttributeToAdd}
              onChange={(event) => setSelectedAttributeToAdd(event.target.value)}
              className="w-full min-h-11 p-2 rounded-md border border-[--border] bg-[--background-elevated] text-[--foreground]"
            >
              <option value="">اختر سمة لإضافتها...</option>
              {unboundAttributes.map((attribute) => (
                <option key={attribute.id} value={attribute.id}>
                  {attribute.name_ar}{attribute.name_en ? ` (${attribute.name_en})` : ''} — {DATA_TYPE_LABELS[attribute.data_type]}
                </option>
              ))}
            </select>
            {unboundAttributes.length === 0 && (
              <p className="text-xs text-[--foreground-muted]">كل السمات النشطة مضافة بالفعل.</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectedAttributeToAdd}
            className="min-h-11 flex items-center justify-center gap-2 px-4 py-2 bg-[--primary] text-[--primary-foreground] rounded-md font-medium disabled:opacity-50"
          >
            <Plus size={18} /> إضافة سمة
          </button>
        </div>
      </div>

      {saveError && <div role="alert" className="rounded-md border border-[--destructive]/30 bg-[--destructive]/10 p-3 text-sm text-[--destructive]">{saveError}</div>}
      {saveSuccess && <div role="status" className="rounded-md border border-emerald-600/30 bg-emerald-600/10 p-3 text-sm">{saveSuccess}</div>}

      <div className="space-y-4">
        {boundAttributes.map((item, index) => {
          const compatibleUnits = item.global?.measurement_dimension_id
            ? options.units.filter((unit) => unit.dimension_id === item.global?.measurement_dimension_id)
            : [];
          const compatibleValueSets = options.valueSets.filter((set) =>
            set.attribute_id === null || set.attribute_id === item.global?.database_id,
          );
          const selectedSet = compatibleValueSets.find((set) => set.id === item.value_set_id);

          return (
            <article key={item.attribute_id} className="rounded-lg border border-[--border] bg-[--background-elevated] p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold">{item.global?.name_ar || 'سمة غير معروفة'}</h4>
                  <p className="text-sm text-[--foreground-muted] mt-1">
                    {item.global?.name_en ? `${item.global.name_en} · ` : ''}
                    نوع البيانات: {item.global ? DATA_TYPE_LABELS[item.global.data_type] : 'غير معروف'}
                    {' · '}الفلتر: {item.global?.filter_type || 'غير محدد'}{item.global?.unit ? ` · الوحدة الحالية: ${item.global.unit}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} aria-label="تحريك السمة لأعلى" title="تحريك لأعلى" className="p-2 rounded-md border border-[--border] disabled:opacity-30"><ArrowUp size={16} /></button>
                  <button type="button" onClick={() => onMove(index, 1)} disabled={index === boundAttributes.length - 1} aria-label="تحريك السمة لأسفل" title="تحريك لأسفل" className="p-2 rounded-md border border-[--border] disabled:opacity-30"><ArrowDown size={16} /></button>
                  <button type="button" onClick={() => onRemove(index)} aria-label={`إزالة ${item.global?.name_ar || 'السمة'}`} className="p-2 text-[--destructive] hover:bg-[--destructive]/10 rounded-md"><Trash2 size={17} /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">دور السمة</label>
                  <select value={item.role} onChange={(event) => onUpdate(index, { ...item, role: event.target.value as EnrichedCategoryAttribute['role'] })} className="w-full min-h-10 p-2 rounded-md border border-[--border] bg-[--background] text-sm">
                    {ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">المجموعة</label>
                  <input value={item.group || ''} onChange={(event) => onUpdate(index, { ...item, group: event.target.value })} maxLength={120} placeholder="مثال: الأبعاد أو الطاقة" className="w-full min-h-10 p-2 rounded-md border border-[--border] bg-[--background] text-sm" />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.is_required} onChange={(event) => onUpdate(index, { ...item, is_required: event.target.checked })} /> إلزامية</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.is_filterable} onChange={(event) => onUpdate(index, { ...item, is_filterable: event.target.checked })} /> قابلة للتصفية</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.is_variant} onChange={(event) => onUpdate(index, { ...item, is_variant: event.target.checked })} /> محور تنويعات</label>
                </div>
              </div>

              {item.global?.data_type === 'number' && (
                <section className="space-y-3 rounded-md border border-[--border] p-3">
                  <h5 className="text-sm font-semibold">النطاق العددي ووحدة القياس</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-sm">الحد الأدنى</label>
                      <input type="number" step="any" value={item.min_value ?? ''} onChange={(event) => onUpdate(index, { ...item, min_value: event.target.value === '' ? undefined : Number(event.target.value) })} className="w-full min-h-10 p-2 rounded-md border border-[--border] bg-[--background]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm">الحد الأعلى</label>
                      <input type="number" step="any" value={item.max_value ?? ''} onChange={(event) => onUpdate(index, { ...item, max_value: event.target.value === '' ? undefined : Number(event.target.value) })} className="w-full min-h-10 p-2 rounded-md border border-[--border] bg-[--background]" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">وحدة القياس المركزية</label>
                    <select value={item.unit_id || ''} onChange={(event) => onUpdate(index, { ...item, unit_id: event.target.value || undefined })} disabled={!item.global.measurement_dimension_id || compatibleUnits.length === 0} className="w-full min-h-10 p-2 rounded-md border border-[--border] bg-[--background] disabled:opacity-60">
                      <option value="">بدون وحدة محددة</option>
                      {compatibleUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name_ar}{unit.symbol ? ` (${unit.symbol})` : ''}{unit.name_en ? ` — ${unit.name_en}` : ''}</option>)}
                    </select>
                    {!item.global.measurement_dimension_id
                      ? <p className="text-xs text-[--foreground-muted]">لم يُربط بُعد قياس بهذه السمة في المكتبة العامة بعد.</p>
                      : compatibleUnits.length === 0
                        ? <p className="text-xs text-[--foreground-muted]">لا توجد وحدات نشطة لهذا البُعد. أضف تعريفات البُعد والوحدات في مرحلة التعريفات المركزية.</p>
                        : <p className="text-xs text-[--foreground-muted]">تُعرض الوحدات المطابقة لبُعد قياس السمة فقط.</p>}
                  </div>
                </section>
              )}

              {item.global?.data_type === 'enum' && (
                <section className="space-y-3 rounded-md border border-[--border] p-3">
                  <h5 className="text-sm font-semibold">مجموعة القيم المحددة</h5>
                  <select value={item.value_set_id || ''} onChange={(event) => onUpdate(index, { ...item, value_set_id: event.target.value || undefined })} className="w-full min-h-10 p-2 rounded-md border border-[--border] bg-[--background]">
                    <option value="">بدون مجموعة مركزية</option>
                    {compatibleValueSets.map((set) => <option key={set.id} value={set.id}>{set.name_ar}{set.name_en ? ` — ${set.name_en}` : ''}</option>)}
                  </select>
                  {compatibleValueSets.length === 0 && <p className="text-xs text-[--foreground-muted]">لا توجد مجموعات قيم نشطة متوافقة حتى الآن.</p>}
                  {selectedSet && (
                    <ul className="flex flex-wrap gap-2">
                      {selectedSet.values.map((value) => <li key={value.id} className="rounded-full border border-[--border] px-3 py-1 text-xs">{value.label_ar}{value.label_en ? ` / ${value.label_en}` : ''}</li>)}
                      {selectedSet.values.length === 0 && <li className="text-xs text-[--foreground-muted]">المجموعة فارغة حالياً.</li>}
                    </ul>
                  )}
                </section>
              )}

              {(item.global?.data_type === 'string' || item.global?.data_type === 'enum') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">قيم مسموحة إضافية (توافق مؤقت)</label>
                  <TagInput
                    tags={item.allowed_values || []}
                    onChange={(values) => onUpdate(index, { ...item, allowed_values: values.length ? values : undefined })}
                    placeholder="أضف قيمة ثم اضغط Enter..."
                  />
                  <p className="text-xs text-[--foreground-muted]">استخدم مجموعة القيم المركزية للسمات من نوع «قائمة محددة» متى توفرت. هذا الحقل يحافظ على التوافق مع الإعدادات القديمة.</p>
                </div>
              )}
            </article>
          );
        })}
        {boundAttributes.length === 0 && (
          <div className="rounded-lg border border-dashed border-[--border] p-8 text-center text-sm text-[--foreground-muted]">
            لا توجد خصائص مرتبطة بنوع المنتج. أضف سمة عامة من القائمة أعلاه.
          </div>
        )}
      </div>

      <div className="flex justify-start">
        <button type="button" onClick={handleSave} disabled={isSaving || !taxonomyNodeId} className="min-h-11 flex items-center gap-2 rounded-md bg-[--primary] px-4 py-2 font-medium text-[--primary-foreground] disabled:opacity-50">
          <Save size={18} /> {isSaving ? 'جاري حفظ الخصائص...' : 'حفظ خصائص نوع المنتج'}
        </button>
      </div>
    </div>
  );
}
