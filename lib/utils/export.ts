import { readCategories } from '@/lib/data/categories';
import { readAttributes } from '@/lib/data/attributes';
import { getAncestors, getCategoryPath } from '@/lib/utils/tree';
import type { Category } from '@/lib/types/category';
import type { Attribute } from '@/lib/types/attribute';

export interface EnrichedCategoryExport {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  node_type: 'department' | 'category' | 'subcategory' | 'product_type';
  parent_id: string | null;
  path: string; // e.g., "الكهرباء والإنارة / الإضاءة / لمبات / لمبة LED"
  depth: number; // 0 for root, 1, 2, ...
  breadcrumbs: Array<{ id: string; name_ar: string; slug: string }>;
  image: string | null;
  attributes: Array<{
    attribute_id: string;
    name_ar: string;
    name_en?: string;
    data_type: 'number' | 'enum' | 'string' | 'boolean';
    filter_type: 'range' | 'checkbox' | 'select' | 'toggle' | 'color_swatch' | 'button_group';
    unit: string | null;
    role: 'identity' | 'variant' | 'descriptive' | 'commercial';
    group?: string;
    is_variant: boolean;
    allowed_values: string[];
  }>;
}

export async function generateEnrichedCatalog(): Promise<EnrichedCategoryExport[]> {
  const [categories, attributes] = await Promise.all([
    readCategories(),
    readAttributes(),
  ]);

  const attributeMap = new Map<string, Attribute>(attributes.map((a) => [a.id, a]));

  const enrichedCatalog: EnrichedCategoryExport[] = categories.map((category) => {
    const ancestors = getAncestors(category.id, categories);
    
    // Convert to required breadcrumb structure
    const breadcrumbs = ancestors.map((a) => ({
      id: a.id,
      name_ar: a.name_ar,
      slug: a.slug,
    }));

    const path = getCategoryPath(category.id, categories);
    const depth = ancestors.length;

    const enrichedAttributes = category.attributes.map((catAttr) => {
      const globalAttr = attributeMap.get(catAttr.attribute_id);
      
      return {
        attribute_id: catAttr.attribute_id,
        name_ar: globalAttr?.name_ar || 'غير معروف',
        name_en: globalAttr?.name_en,
        data_type: globalAttr?.data_type || 'string',
        filter_type: globalAttr?.filter_type || 'select',
        unit: globalAttr?.unit || null,
        role: catAttr.role,
        group: catAttr.group,
        is_variant: catAttr.is_variant,
        allowed_values: catAttr.allowed_values || [],
      };
    });

    return {
      id: category.id,
      name_ar: category.name_ar,
      name_en: category.name_en || null,
      slug: category.slug,
      node_type: category.node_type || 'category',
      parent_id: category.parent_id,
      path,
      depth,
      breadcrumbs,
      image: category.image || null,
      attributes: enrichedAttributes,
    };
  });

  return enrichedCatalog;
}
