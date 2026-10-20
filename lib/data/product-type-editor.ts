import { createClient } from '@/lib/supabase/server';

export type MeasurementUnitOption = {
  id: string;
  dimension_id: string;
  name_ar: string;
  name_en: string | null;
  symbol: string | null;
};

export type AttributeValueOption = {
  id: string;
  value_key: string;
  label_ar: string;
  label_en: string | null;
  raw_value: string | null;
};

export type AttributeValueSetOption = {
  id: string;
  attribute_id: string | null;
  name_ar: string;
  name_en: string | null;
  values: AttributeValueOption[];
};

export type ProductTypeEditorOptions = {
  units: MeasurementUnitOption[];
  valueSets: AttributeValueSetOption[];
};

export async function readProductTypeEditorOptions(): Promise<ProductTypeEditorOptions> {
  const supabase = await createClient();
  const [unitsResult, setsResult] = await Promise.all([
    supabase
      .from('measurement_units')
      .select('id, dimension_id, name_ar, name_en, symbol')
      .eq('status', 'active')
      .order('name_ar', { ascending: true }),
    supabase
      .from('attribute_value_sets')
      .select('id, attribute_id, name_ar, name_en, sort_order')
      .eq('status', 'active')
      .order('sort_order', { ascending: true })
      .order('name_ar', { ascending: true }),
  ]);

  if (unitsResult.error) throw new Error(`Failed to read measurement units: ${unitsResult.error.message}`);
  if (setsResult.error) throw new Error(`Failed to read attribute value sets: ${setsResult.error.message}`);

  const sets = setsResult.data ?? [];
  const setIds = sets.map((set) => set.id);
  const valuesResult = setIds.length
    ? await supabase
        .from('attribute_values')
        .select('id, value_set_id, value_key, label_ar, label_en, raw_value')
        .eq('status', 'active')
        .in('value_set_id', setIds)
        .order('sort_order', { ascending: true })
        .order('value_key', { ascending: true })
    : { data: [], error: null };

  if (valuesResult.error) throw new Error(`Failed to read attribute values: ${valuesResult.error.message}`);

  const valuesBySet = new Map<string, AttributeValueOption[]>();
  for (const value of valuesResult.data ?? []) {
    const current = valuesBySet.get(value.value_set_id) ?? [];
    current.push({
      id: value.id,
      value_key: value.value_key,
      label_ar: value.label_ar,
      label_en: value.label_en,
      raw_value: value.raw_value,
    });
    valuesBySet.set(value.value_set_id, current);
  }

  return {
    units: unitsResult.data ?? [],
    valueSets: sets.map((set) => ({
      id: set.id,
      attribute_id: set.attribute_id,
      name_ar: set.name_ar,
      name_en: set.name_en,
      values: valuesBySet.get(set.id) ?? [],
    })),
  };
}
