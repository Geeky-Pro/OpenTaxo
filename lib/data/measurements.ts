import 'server-only';

import { requireOwner } from '@/lib/auth/require-owner';

export type MeasurementDimensionRecord = {
  id: string;
  key: string;
  name_ar: string;
  name_en: string | null;
  status: 'active' | 'archived';
  updated_at: string;
  active_unit_count: number;
  attribute_usage_count: number;
  active_conversion_count: number;
};

export type MeasurementUnitRecord = {
  id: string;
  dimension_id: string;
  key: string;
  name_ar: string;
  name_en: string | null;
  symbol: string | null;
  to_base_multiplier: number;
  to_base_offset: number;
  is_base: boolean;
  status: 'active' | 'archived';
  updated_at: string;
  active_rule_count: number;
  product_type_usage_count: number;
};

export type UnitConversionRuleRecord = {
  id: string;
  source_unit_id: string;
  target_unit_id: string;
  multiplier: number;
  offset_value: number;
  selling_unit_definition_id: string | null;
  status: 'active' | 'archived';
  updated_at: string;
};

export type SellingUnitOption = {
  id: string;
  key: string;
  name_ar: string;
  name_en: string | null;
  measurement_dimension_id: string | null;
};

export async function readMeasurementCenterData(): Promise<{
  dimensions: MeasurementDimensionRecord[];
  units: MeasurementUnitRecord[];
  conversionRules: UnitConversionRuleRecord[];
  sellingUnits: SellingUnitOption[];
}> {
  const { supabase } = await requireOwner();
  const [dimensionsResult, unitsResult, rulesResult, sellingUnitsResult, attributesResult, assignmentsResult, schemasResult] = await Promise.all([
    supabase.from('measurement_dimensions')
      .select('id, key, name_ar, name_en, status, updated_at')
      .order('name_ar', { ascending: true }),
    supabase.from('measurement_units')
      .select('id, dimension_id, key, name_ar, name_en, symbol, to_base_multiplier, to_base_offset, is_base, status, updated_at')
      .order('key', { ascending: true }),
    supabase.from('unit_conversion_rules')
      .select('id, source_unit_id, target_unit_id, multiplier, offset_value, selling_unit_definition_id, status, updated_at')
      .order('updated_at', { ascending: false }),
    supabase.from('selling_unit_definitions')
      .select('id, key, name_ar, name_en, measurement_dimension_id')
      .eq('status', 'active')
      .order('name_ar', { ascending: true }),
    supabase.from('attributes')
      .select('measurement_dimension_id')
      .eq('status', 'active'),
    supabase.from('product_type_attributes')
      .select('product_type_schema_id, configuration'),
    supabase.from('product_type_schemas')
      .select('id')
      .eq('status', 'active'),
  ]);
  for (const result of [dimensionsResult, unitsResult, rulesResult, sellingUnitsResult, attributesResult, assignmentsResult, schemasResult]) {
    if (result.error) throw new Error(`تعذر تحميل مركز الوحدات والأبعاد: ${result.error.message}`);
  }

  const dimensions = dimensionsResult.data ?? [];
  const units = (unitsResult.data ?? []).map((unit) => ({
    ...unit,
    status: unit.status === 'archived' ? 'archived' as const : 'active' as const,
  }));
  const rules = (rulesResult.data ?? []).map((rule) => ({
    ...rule,
    multiplier: Number(rule.multiplier),
    offset_value: Number(rule.offset_value),
    status: rule.status === 'archived' ? 'archived' as const : 'active' as const,
  }));
  const activeSchemaIds = new Set((schemasResult.data ?? []).map((schema) => schema.id));
  const activeBindings = (assignmentsResult.data ?? []).filter((binding) => activeSchemaIds.has(binding.product_type_schema_id));
  const activeRulesByUnit = new Map<string, number>();
  for (const rule of rules.filter((item) => item.status === 'active')) {
    activeRulesByUnit.set(rule.source_unit_id, (activeRulesByUnit.get(rule.source_unit_id) ?? 0) + 1);
    activeRulesByUnit.set(rule.target_unit_id, (activeRulesByUnit.get(rule.target_unit_id) ?? 0) + 1);
  }
  const unitUsage = new Map<string, number>();
  for (const binding of activeBindings) {
    const config = binding.configuration;
    if (!config || typeof config !== 'object' || Array.isArray(config)) continue;
    const unitId = (config as Record<string, unknown>).unit_id;
    if (typeof unitId === 'string') unitUsage.set(unitId, (unitUsage.get(unitId) ?? 0) + 1);
  }

  const activeUnitCounts = new Map<string, number>();
  for (const unit of units.filter((item) => item.status === 'active')) {
    activeUnitCounts.set(unit.dimension_id, (activeUnitCounts.get(unit.dimension_id) ?? 0) + 1);
  }
  const activeAttributeCounts = new Map<string, number>();
  for (const attr of attributesResult.data ?? []) {
    if (attr.measurement_dimension_id) activeAttributeCounts.set(attr.measurement_dimension_id, (activeAttributeCounts.get(attr.measurement_dimension_id) ?? 0) + 1);
  }
  const activeRuleCounts = new Map<string, number>();
  for (const rule of rules.filter((item) => item.status === 'active')) {
    const source = units.find((unit) => unit.id === rule.source_unit_id);
    if (source) activeRuleCounts.set(source.dimension_id, (activeRuleCounts.get(source.dimension_id) ?? 0) + 1);
  }

  return {
    dimensions: dimensions.map((dimension) => ({
      ...dimension,
      status: dimension.status === 'archived' ? 'archived' as const : 'active' as const,
      active_unit_count: activeUnitCounts.get(dimension.id) ?? 0,
      attribute_usage_count: activeAttributeCounts.get(dimension.id) ?? 0,
      active_conversion_count: activeRuleCounts.get(dimension.id) ?? 0,
    })),
    units: units.map((unit) => ({
      ...unit,
      to_base_multiplier: Number(unit.to_base_multiplier),
      to_base_offset: Number(unit.to_base_offset),
      active_rule_count: activeRulesByUnit.get(unit.id) ?? 0,
      product_type_usage_count: unitUsage.get(unit.id) ?? 0,
    })),
    conversionRules: rules,
    sellingUnits: sellingUnitsResult.data ?? [],
  };
}

export async function readConversionCenterData() {
  const data = await readMeasurementCenterData();
  return { units: data.units, dimensions: data.dimensions, conversionRules: data.conversionRules, sellingUnits: data.sellingUnits };
}
