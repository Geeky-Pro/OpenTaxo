import { AttributesFileSchema, DataTypeSchema, FilterTypeSchema } from '@/lib/types/attribute';
import type { Attribute } from '@/lib/types/attribute';
import { createClient } from '@/lib/supabase/server';

function getSourceUnit(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  const unit = (value as Record<string, unknown>).unit;
  return typeof unit === 'string' ? unit : undefined;
}

export async function readAttributes(): Promise<Attribute[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attributes')
    .select('id, legacy_id, name_ar, name_en, data_type, filter_type, measurement_dimension_id, source_metadata, sort_order')
    .eq('status', 'active')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to read attributes: ${error.message}`);

  const attributes: Attribute[] = (data ?? []).map((row) => {
    const dataType = DataTypeSchema.safeParse(row.data_type);
    const filterType = FilterTypeSchema.safeParse(row.filter_type);
    const unit = getSourceUnit(row.source_metadata);

    return {
      id: row.legacy_id ?? row.id,
      database_id: row.id,
      ...(row.measurement_dimension_id ? { measurement_dimension_id: row.measurement_dimension_id } : {}),
      name_ar: row.name_ar,
      ...(row.name_en !== null ? { name_en: row.name_en } : {}),
      data_type: dataType.success ? dataType.data : 'string',
      filter_type: filterType.success ? filterType.data : 'select',
      ...(unit ? { unit } : {}),
    };
  });

  return AttributesFileSchema.parse(attributes);
}

export async function writeAttributes(attributes: Attribute[]): Promise<void> {
  const validated = AttributesFileSchema.parse(attributes);
  const supabase = await createClient();
  const payload = JSON.parse(JSON.stringify(validated));
  const { error } = await supabase.rpc('replace_attribute_snapshot', { p_attributes: payload });
  if (error) throw new Error(`Failed to save attribute snapshot: ${error.message}`);
}
