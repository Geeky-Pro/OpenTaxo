'use server';

import { requireOwner } from '@/lib/auth/require-owner';
import { readCategories } from '@/lib/data/categories';
import { readAttributes } from '@/lib/data/attributes';
import type { Category } from '@/lib/types/category';
import type { Attribute } from '@/lib/types/attribute';

export async function getSearchData(): Promise<{ categories: Category[], attributes: Attribute[] }> {
  await requireOwner();
  const [categories, attributes] = await Promise.all([
    readCategories(),
    readAttributes(),
  ]);
  
  return { categories, attributes };
}
