import { CategoriesFileSchema } from '@/lib/types/category';
import type { Category, CategoryAttribute } from '@/lib/types/category';
import { createClient } from '@/lib/supabase/server';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === 'string');
}

const allowedRoles = new Set(['identity', 'variant', 'descriptive', 'commercial']);

export async function readCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data: nodes, error: nodesError } = await supabase
    .from('taxonomy_nodes')
    .select('id, legacy_id, parent_id, node_type, name_ar, name_en, description, slug, image_path, sort_order')
    .eq('status', 'active')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (nodesError) throw new Error(`Failed to read taxonomy nodes: ${nodesError.message}`);
  if (!nodes?.length) return [];

  const productTypeIds = nodes.filter((node) => node.node_type === 'product_type').map((node) => node.id);
  const schemaByNodeId = new Map<string, string>();
  if (productTypeIds.length) {
    const { data: schemas, error: schemasError } = await supabase
      .from('product_type_schemas')
      .select('id, taxonomy_node_id')
      .eq('status', 'active')
      .in('taxonomy_node_id', productTypeIds);
    if (schemasError) throw new Error(`Failed to read Product Type schemas: ${schemasError.message}`);
    for (const schema of schemas ?? []) schemaByNodeId.set(schema.taxonomy_node_id, schema.id);
  }

  const schemaIds = [...schemaByNodeId.values()];
  const bindingsBySchemaId = new Map<string, Array<{
    id: string;
    attribute_id: string;
    display_order: number;
    is_required: boolean;
    is_filterable: boolean;
    group_key: string | null;
    configuration: unknown;
  }>>();
  const variantBindingIds = new Set<string>();
  const legacyAttributeIdByUuid = new Map<string, string>();

  if (schemaIds.length) {
    const { data: bindings, error: bindingsError } = await supabase
      .from('product_type_attributes')
      .select('id, product_type_schema_id, attribute_id, is_required, is_filterable, display_order, group_key, configuration')
      .in('product_type_schema_id', schemaIds)
      .order('display_order', { ascending: true });
    if (bindingsError) throw new Error(`Failed to read Product Type attribute bindings: ${bindingsError.message}`);

    const bindingRows = bindings ?? [];
    for (const binding of bindingRows) {
      const current = bindingsBySchemaId.get(binding.product_type_schema_id) ?? [];
      current.push({
        id: binding.id,
        attribute_id: binding.attribute_id,
        display_order: binding.display_order,
        is_required: binding.is_required,
        is_filterable: binding.is_filterable,
        group_key: binding.group_key,
        configuration: binding.configuration,
      });
      bindingsBySchemaId.set(binding.product_type_schema_id, current);
    }

    const bindingIds = bindingRows.map((binding) => binding.id);
    const attributeIds = [...new Set(bindingRows.map((binding) => binding.attribute_id))];

    if (bindingIds.length) {
      const { data: axes, error: axesError } = await supabase
        .from('variant_axes')
        .select('product_type_attribute_id')
        .in('product_type_attribute_id', bindingIds);
      if (axesError) throw new Error(`Failed to read variant axes: ${axesError.message}`);
      for (const axis of axes ?? []) variantBindingIds.add(axis.product_type_attribute_id);
    }

    if (attributeIds.length) {
      const { data: attributes, error: attributesError } = await supabase
        .from('attributes')
        .select('id, legacy_id')
        .eq('status', 'active')
        .in('id', attributeIds);
      if (attributesError) throw new Error(`Failed to resolve bound attributes: ${attributesError.message}`);
      for (const attribute of attributes ?? []) {
        legacyAttributeIdByUuid.set(attribute.id, attribute.legacy_id ?? attribute.id);
      }
    }
  }

  const legacyIdByUuid = new Map(nodes.map((node) => [node.id, node.legacy_id ?? node.id]));
  const categories: Category[] = nodes.map((node) => {
    const schemaId = schemaByNodeId.get(node.id);
    const bindings = schemaId ? bindingsBySchemaId.get(schemaId) ?? [] : [];

    const attributes: CategoryAttribute[] = bindings.flatMap((binding) => {
      const legacyAttributeId = legacyAttributeIdByUuid.get(binding.attribute_id);
      if (!legacyAttributeId) return [];

      const configuration = isRecord(binding.configuration) ? binding.configuration : {};
      const roleValue = configuration.role;
      const role = typeof roleValue === 'string' && allowedRoles.has(roleValue)
        ? roleValue as CategoryAttribute['role']
        : 'descriptive';
      const groupValue = configuration.group;
      const group = typeof groupValue === 'string' ? groupValue : binding.group_key ?? undefined;
      const allowedValues = asStringArray(configuration.allowed_values);

      return [{
        attribute_id: legacyAttributeId,
        role,
        ...(group ? { group } : {}),
        is_variant: variantBindingIds.has(binding.id),
        is_required: binding.is_required,
        is_filterable: binding.is_filterable,
        ...(typeof configuration.min_value === 'number' ? { min_value: configuration.min_value } : {}),
        ...(typeof configuration.max_value === 'number' ? { max_value: configuration.max_value } : {}),
        ...(typeof configuration.unit_id === 'string' ? { unit_id: configuration.unit_id } : {}),
        ...(typeof configuration.value_set_id === 'string' ? { value_set_id: configuration.value_set_id } : {}),
        ...(allowedValues ? { allowed_values: allowedValues } : {}),
      }];
    });

    return {
      id: node.legacy_id ?? node.id,
      database_id: node.id,
      name_ar: node.name_ar,
      name_en: node.name_en,
      description: node.description ?? undefined,
      sort_order: node.sort_order,
      slug: node.slug,
      node_type: node.node_type as Category['node_type'],
      parent_id: node.parent_id ? legacyIdByUuid.get(node.parent_id) ?? null : null,
      image: node.image_path,
      attributes,
    };
  });

  return CategoriesFileSchema.parse(categories);
}

export async function writeCategories(categories: Category[]): Promise<void> {
  const validated = CategoriesFileSchema.parse(categories);
  const supabase = await createClient();
  const payload = JSON.parse(JSON.stringify(validated));
  const { error } = await supabase.rpc('replace_taxonomy_snapshot', { p_nodes: payload });
  if (error) throw new Error(`Failed to save taxonomy snapshot: ${error.message}`);
}
