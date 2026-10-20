import 'server-only';

import { requireOwner } from '@/lib/auth/require-owner';

export type ValueSetRecord = {
  id: string;
  key: string;
  name_ar: string;
  name_en: string | null;
  attribute_id: string | null;
  status: 'active' | 'archived';
  sort_order: number;
  updated_at: string;
  value_count: number;
  active_value_count: number;
  product_type_usage_count: number;
};

export type AttributeValueRecord = {
  id: string;
  value_set_id: string;
  value_key: string;
  label_ar: string;
  label_en: string | null;
  raw_value: string | null;
  status: 'active' | 'archived';
  sort_order: number;
  updated_at: string;
};

export type EnumAttributeOption = {
  id: string;
  key: string;
  name_ar: string;
  name_en: string | null;
};

export async function readValueCenterData(): Promise<{
  valueSets: ValueSetRecord[];
  values: AttributeValueRecord[];
  enumAttributes: EnumAttributeOption[];
}> {
  const { supabase } = await requireOwner();
  const [setsResult, valuesResult, attributesResult, assignmentsResult, schemasResult] = await Promise.all([
    supabase.from('attribute_value_sets')
      .select('id, key, name_ar, name_en, attribute_id, status, sort_order, updated_at')
      .order('sort_order', { ascending: true })
      .order('name_ar', { ascending: true }),
    supabase.from('attribute_values')
      .select('id, value_set_id, value_key, label_ar, label_en, raw_value, status, sort_order, updated_at')
      .order('sort_order', { ascending: true })
      .order('label_ar', { ascending: true }),
    supabase.from('attributes')
      .select('id, key, name_ar, name_en')
      .eq('data_type', 'enum')
      .eq('status', 'active')
      .order('name_ar', { ascending: true }),
    supabase.from('product_type_attributes')
      .select('product_type_schema_id, configuration'),
    supabase.from('product_type_schemas')
      .select('id')
      .eq('status', 'active'),
  ]);

  for (const result of [setsResult, valuesResult, attributesResult, assignmentsResult, schemasResult]) {
    if (result.error) throw new Error(`تعذر تحميل مركز القيم: ${result.error.message}`);
  }

  const activeSchemaIds = new Set((schemasResult.data ?? []).map((row) => row.id));
  const usageCounts = new Map<string, number>();
  for (const binding of assignmentsResult.data ?? []) {
    if (!activeSchemaIds.has(binding.product_type_schema_id)) continue;
    const configuration = binding.configuration;
    if (!configuration || typeof configuration !== 'object' || Array.isArray(configuration)) continue;
    const valueSetId = (configuration as Record<string, unknown>).value_set_id;
    if (typeof valueSetId === 'string') usageCounts.set(valueSetId, (usageCounts.get(valueSetId) ?? 0) + 1);
  }

  const values = (valuesResult.data ?? []).map((row) => ({
    ...row,
    status: row.status === 'archived' ? 'archived' as const : 'active' as const,
  }));
  const valuesBySet = new Map<string, AttributeValueRecord[]>();
  for (const value of values) {
    const rows = valuesBySet.get(value.value_set_id) ?? [];
    rows.push(value);
    valuesBySet.set(value.value_set_id, rows);
  }

  return {
    valueSets: (setsResult.data ?? []).map((row) => {
      const setValues = valuesBySet.get(row.id) ?? [];
      return {
        ...row,
        status: row.status === 'archived' ? 'archived' as const : 'active' as const,
        value_count: setValues.length,
        active_value_count: setValues.filter((value) => value.status === 'active').length,
        product_type_usage_count: usageCounts.get(row.id) ?? 0,
      };
    }),
    values,
    enumAttributes: attributesResult.data ?? [],
  };
}
