import { AttributesFileSchema } from '@/lib/types/attribute';
import type { Attribute } from '@/lib/types/attribute';
import { CategoriesFileSchema } from '@/lib/types/category';
import type { Category } from '@/lib/types/category';
import { createClient } from '@/lib/supabase/server';

export async function writeTaxonomyAndAttributes(
  categories: Category[],
  attributes: Attribute[],
): Promise<void> {
  const validatedCategories = CategoriesFileSchema.parse(categories);
  const validatedAttributes = AttributesFileSchema.parse(attributes);
  const supabase = await createClient();

  const p_nodes = JSON.parse(JSON.stringify(validatedCategories));
  const p_attributes = JSON.parse(JSON.stringify(validatedAttributes));
  const { error } = await supabase.rpc('replace_taxonomy_and_attribute_snapshots', {
    p_nodes,
    p_attributes,
  });

  if (error) throw new Error(`Failed to save catalog snapshot: ${error.message}`);
}
