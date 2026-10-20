'use client';

import { useActionState } from 'react';
import { createAttribute, updateAttribute } from '@/lib/actions/attributes';
import type { Attribute, FilterType, DataType } from '@/lib/types/attribute';

const DATA_TYPES: Record<DataType, string> = {
  string: 'نص (String)',
  number: 'رقم (Number)',
  boolean: 'نعم/لا (Boolean)',
  enum: 'قائمة ثابتة (Enum)',
};

const FILTER_TYPES: Record<FilterType, string> = {
  select: 'قائمة منسدلة (Select)',
  checkbox: 'صندوق اختيار (Checkbox)',
  button_group: 'أزرار (Button Group)',
  color_swatch: 'ألوان (Color Swatch)',
  range: 'نطاق (Range)',
  toggle: 'مفتاح تبديل (Toggle)',
};

type Props = {
  attribute?: Attribute; // If provided, we are editing
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function AttributeForm({ attribute, onSuccess, onCancel }: Props) {
  // Action wrapper to pass the ID if editing
  const formAction = async (prevState: any, formData: FormData) => {
    const rawData = {
      name_ar: formData.get('name_ar') as string,
      name_en: formData.get('name_en') as string || undefined,
      data_type: formData.get('data_type') as DataType,
      filter_type: formData.get('filter_type') as FilterType,
      unit: formData.get('unit') as string || undefined,
    };

    const res = attribute
      ? await updateAttribute(attribute.id, rawData)
      : await createAttribute(rawData);
      
    if (res.success && onSuccess) {
      onSuccess();
    }
    
    return res;
  };

  const [state, action, isPending] = useActionState(formAction, null);

  return (
    <form action={action} className="space-y-4">
      {state && !state.success && state.error && (<div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{typeof state.error === "string" ? state.error : "حدث خطأ"}</div>)}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="name_ar" className="block text-sm font-medium">
            الاسم بالعربية <span className="text-destructive">*</span>
          </label>
          <input
            id="name_ar"
            name="name_ar"
            type="text"
            required
            defaultValue={attribute?.name_ar}
            className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
            placeholder="مثال: اللون، الحجم"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="name_en" className="block text-sm font-medium">
            الاسم بالإنجليزية
          </label>
          <input
            id="name_en"
            name="name_en"
            type="text"
            defaultValue={attribute?.name_en}
            className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
            dir="ltr"
            placeholder="e.g. Color, Size"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="data_type" className="block text-sm font-medium">
            نوع البيانات <span className="text-destructive">*</span>
          </label>
          <select
            id="data_type"
            name="data_type"
            required
            defaultValue={attribute?.data_type || 'string'}
            className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
          >
            {Object.entries(DATA_TYPES).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="filter_type" className="block text-sm font-medium">
            نوع الفلتر <span className="text-destructive">*</span>
          </label>
          <select
            id="filter_type"
            name="filter_type"
            required
            defaultValue={attribute?.filter_type || 'select'}
            className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
          >
            {Object.entries(FILTER_TYPES).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1 md:col-span-2">
          <label htmlFor="unit" className="block text-sm font-medium">
            وحدة القياس (اختياري)
          </label>
          <input
            id="unit"
            name="unit"
            type="text"
            defaultValue={attribute?.unit}
            className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
            placeholder="مثال: سم، كغ، بوصة"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-background-muted transition-colors disabled:opacity-50"
          >
            إلغاء
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? 'جاري الحفظ...' : attribute ? 'حفظ التعديلات' : 'إضافة السمة'}
        </button>
      </div>
    </form>
  );
}
