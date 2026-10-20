import { createClient } from '@/lib/supabase/server';
import { DataTypeSchema, FilterTypeSchema } from '@/lib/types/attribute';
import type { AttributeAliasInput, AttributeDefinition } from '@/lib/types/attribute-definition';

export type MeasurementDimensionOption = { id: string; key: string; name_ar: string; name_en: string | null };

export async function readAttributeCenterData(): Promise<{
  definitions: AttributeDefinition[];
  dimensions: MeasurementDimensionOption[];
}> {
  const supabase = await createClient();
  const [attributesResult, aliasesResult, dimensionsResult, bindingsResult, schemasResult, valueSetsResult] = await Promise.all([
    supabase
      .from('attributes')
      .select('id, legacy_id, key, name_ar, name_en, data_type, filter_type, measurement_dimension_id, source_metadata, status, sort_order')
      .order('sort_order', { ascending: true })
      .order('key', { ascending: true }),
    supabase
      .from('attribute_aliases')
      .select('id, attribute_id, alias_text, language_code')
      .order('alias_text', { ascending: true }),
    supabase
      .from('measurement_dimensions')
      .select('id, key, name_ar, name_en')
      .eq('status', 'active')
      .order('name_ar', { ascending: true }),
    supabase
      .from('product_type_attributes')
      .select('attribute_id, product_type_schema_id'),
    supabase
      .from('product_type_schemas')
      .select('id, status')
      .eq('status', 'active'),
    supabase
      .from('attribute_value_sets')
      .select('attribute_id, status')
      .eq('status', 'active'),
  ]);

  for (const result of [attributesResult, aliasesResult, dimensionsResult, bindingsResult, schemasResult, valueSetsResult]) {
    if (result.error) throw new Error(`Failed to read central attribute definitions: ${result.error.message}`);
  }

  const activeSchemaIds = new Set((schemasResult.data ?? []).map((schema) => schema.id));
  const usageCounts = new Map<string, number>();
  for (const binding of bindingsResult.data ?? []) {
    if (activeSchemaIds.has(binding.product_type_schema_id)) {
      usageCounts.set(binding.attribute_id, (usageCounts.get(binding.attribute_id) ?? 0) + 1);
    }
  }

  const valueSetCounts = new Map<string, number>();
  for (const set of valueSetsResult.data ?? []) {
    if (set.attribute_id) valueSetCounts.set(set.attribute_id, (valueSetCounts.get(set.attribute_id) ?? 0) + 1);
  }

  const aliasesByAttribute = new Map<string, AttributeAliasInput[]>();
  for (const alias of aliasesResult.data ?? []) {
    const aliases = aliasesByAttribute.get(alias.attribute_id) ?? [];
    aliases.push({
      alias_text: alias.alias_text,
      language_code: alias.language_code === 'ar' || alias.language_code === 'en' ? alias.language_code : null,
    });
    aliasesByAttribute.set(alias.attribute_id, aliases);
  }

  const dimensionById = new Map((dimensionsResult.data ?? []).map((dimension) => [dimension.id, dimension.name_ar]));
  const definitions: AttributeDefinition[] = (attributesResult.data ?? []).map((row) => {
    const metadata = typeof row.source_metadata === 'object' && row.source_metadata !== null && !Array.isArray(row.source_metadata)
      ? row.source_metadata as Record<string, unknown>
      : {};
    const legacyUnit = typeof metadata.unit === 'string' ? metadata.unit : null;
    const dataType = DataTypeSchema.safeParse(row.data_type);
    const filterType = FilterTypeSchema.safeParse(row.filter_type);
    return {
      id: row.id,
      legacy_id: row.legacy_id,
      key: row.key,
      name_ar: row.name_ar,
      name_en: row.name_en,
      data_type: dataType.success ? dataType.data : 'string',
      filter_type: filterType.success ? filterType.data : null,
      measurement_dimension_id: row.measurement_dimension_id,
      dimension_name_ar: row.measurement_dimension_id ? dimensionById.get(row.measurement_dimension_id) ?? null : null,
      legacy_unit: legacyUnit,
      status: row.status === 'archived' ? 'archived' : 'active',
      sort_order: row.sort_order,
      aliases: aliasesByAttribute.get(row.id) ?? [],
      usage_count: usageCounts.get(row.id) ?? 0,
      value_set_count: valueSetCounts.get(row.id) ?? 0,
    };
  });

  return {
    definitions,
    dimensions: dimensionsResult.data ?? [],
  };
}
