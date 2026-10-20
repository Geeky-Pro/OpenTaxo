import type { DataType, FilterType } from '@/lib/types/attribute';

export const FILTER_TYPE_LABELS: Record<FilterType, string> = {
  range: 'نطاق رقمي',
  checkbox: 'مربعات اختيار',
  select: 'قائمة منسدلة',
  toggle: 'مفتاح نعم/لا',
  color_swatch: 'عينات ألوان',
  button_group: 'مجموعة أزرار',
};

export const DATA_TYPE_DEFINITIONS: {
  key: DataType;
  labelAr: string;
  labelEn: string;
  description: string;
  inputRule: string;
  supportsDimension: boolean;
  valueSetRule: string;
  compatibleFilters: readonly FilterType[];
}[] = [
  {
    key: 'string',
    labelAr: 'نص',
    labelEn: 'String',
    description: 'قيمة نصية مثل اسم الموديل أو المادة.',
    inputRule: 'حقل نصي؛ تُحفظ القيمة كنص ولا تُجرى عليها عمليات حسابية.',
    supportsDimension: false,
    valueSetRule: 'يمكن استخدام الخيارات النصية عبر الفلاتر المتوافقة؛ القيم المركزية تأتي في مركز القيم.',
    compatibleFilters: ['select', 'checkbox', 'button_group'],
  },
  {
    key: 'number',
    labelAr: 'رقم',
    labelEn: 'Number',
    description: 'قيمة عددية قابلة للمقارنة والحساب.',
    inputRule: 'قيمة رقمية؛ حدود الحد الأدنى والأعلى والوحدة تُضبط عند إسناد الخاصية إلى Product Type.',
    supportsDimension: true,
    valueSetRule: 'لا يحتاج مجموعة قيم؛ الفلترة الافتراضية نطاق رقمي.',
    compatibleFilters: ['range'],
  },
  {
    key: 'boolean',
    labelAr: 'منطقي',
    labelEn: 'Boolean',
    description: 'قيمة ثنائية: صحيح/خطأ أو نعم/لا.',
    inputRule: 'قيمة منطقية حقيقية وليست نصاً مثل "نعم" أو "لا".',
    supportsDimension: false,
    valueSetRule: 'لا يحتاج مجموعة قيم.',
    compatibleFilters: ['toggle', 'checkbox'],
  },
  {
    key: 'enum',
    labelAr: 'قائمة محددة',
    labelEn: 'Enum',
    description: 'قيمة تختار من مجموعة خيارات معرفة مركزياً.',
    inputRule: 'تُحفظ قيمة مفتاح ثابت، بينما تظهر التسميات العربية والإنجليزية للمستخدم.',
    supportsDimension: false,
    valueSetRule: 'تُعرّف خياراته في مركز القيم، ثم تُختار مجموعة متوافقة عند إسناد السمة إلى Product Type.',
    compatibleFilters: ['select', 'checkbox', 'button_group', 'color_swatch'],
  },
];

const compatibleByType = DATA_TYPE_DEFINITIONS.reduce((result, definition) => {
  result[definition.key] = new Set<FilterType>(definition.compatibleFilters);
  return result;
}, {} as Record<DataType, ReadonlySet<FilterType>>);

export function isCompatibleFilter(dataType: DataType, filterType: FilterType): boolean {
  return compatibleByType[dataType].has(filterType);
}

export function compatibleFiltersFor(dataType: DataType): readonly FilterType[] {
  return DATA_TYPE_DEFINITIONS.find((definition) => definition.key === dataType)?.compatibleFilters ?? [];
}
