'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/auth/require-owner';
import { readCategories, writeCategories } from '@/lib/data/categories';
import { readAttributes } from '@/lib/data/attributes';
import { CategorySchema } from '@/lib/types/category';
import { getForbiddenParentIds, validateNodePlacement } from '@/lib/utils/tree';
import type { Category } from '@/lib/types/category';
import type { Attribute } from '@/lib/types/attribute';
import type { ActionResult } from '@/lib/types/action-result';

export type CategoryWithEnrichedAttributes = Category & {
  enriched_attributes: Array<
    Category['attributes'][number] & {
      global: Attribute | null;
    }
  >;
};

export async function getCategoryWithAttributes(id: string): Promise<CategoryWithEnrichedAttributes | null> {
  await requireOwner();
  const categories = await readCategories();
  const category = categories.find((c) => c.id === id);

  if (!category) {
    return null;
  }

  const attributes = await readAttributes();
  
  const enriched_attributes = category.attributes.map((catAttr) => {
    const globalAttr = attributes.find((a) => a.id === catAttr.attribute_id) || null;
    return {
      ...catAttr,
      global: globalAttr,
    };
  });

  return {
    ...category,
    enriched_attributes,
  };
}

export async function saveCategoryFullDetails(id: string, data: unknown): Promise<ActionResult<Category>> {
  await requireOwner();
  const parsed = CategorySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const categories = await readCategories();
  const idx = categories.findIndex((c) => c.id === id);

  if (idx === -1) {
    return { success: false, error: 'Category not found' };
  }

  const current = categories[idx];
  if (!current) {
    return { success: false, error: 'التصنيف غير موجود' };
  }

  const nextParentId = parsed.data.parent_id ?? null;
  const nextNodeType = parsed.data.node_type;

  if (nextParentId !== current.parent_id || nextNodeType !== current.node_type) {
    const forbiddenParentIds = getForbiddenParentIds(id, categories);
    if (nextParentId && forbiddenParentIds.has(nextParentId)) {
      return { success: false, error: 'لا يمكن نقل التصنيف إلى نفسه أو إلى أحد فروعه' };
    }

    const placement = validateNodePlacement(nextNodeType, nextParentId, categories);
    if (!placement.valid) {
      return { success: false, error: placement.error || 'موضع التصنيف غير صالح' };
    }
  }

  // The parsed slug is canonicalized by CategorySchema before uniqueness checks.
  if (categories.some((c) => c.id !== id && c.slug === parsed.data.slug)) {
    return { success: false, error: 'الرابط مستخدم بالفعل في تصنيف آخر.' };
  }

  categories[idx] = parsed.data;

  try {
    await writeCategories(categories);
    revalidatePath(`/categories/${id}`);
    revalidatePath('/');
    revalidatePath('/taxonomy');
    revalidatePath('/tree');
    revalidatePath('/browse');
    revalidatePath('/browse', 'layout');
    return { success: true, data: categories[idx] };
  } catch (error) {
    console.error('Failed to save category:', error);
    const rawMessage = error instanceof Error ? error.message.toLowerCase() : '';
    const friendlyError = rawMessage.includes('invalid taxonomy hierarchy')
      ? 'هيكل التبعية غير صالح: لا يمكن وضع هذا النوع من التصنيفات تحت التصنيف الأصل المختار.'
      : rawMessage.includes('duplicate') && rawMessage.includes('slug')
        ? 'الاسم اللطيف (Slug) مستخدم بالفعل، يرجى اختيار اسم مختلف.'
        : rawMessage.includes('root taxonomy nodes must have node_type department')
          ? 'العقدة الرئيسية في الشجرة يجب أن تكون قسماً رئيسياً (Department).'
          : 'تعذر حفظ بيانات التصنيف في قاعدة البيانات.';
    return { success: false, error: friendlyError };
  }
}
