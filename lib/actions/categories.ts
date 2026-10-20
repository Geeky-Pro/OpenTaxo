'use server';

import { z } from 'zod';
import { requireOwner } from '@/lib/auth/require-owner';
import { revalidatePath } from 'next/cache';
import { readCategories, writeCategories } from '@/lib/data/categories';
import { CategorySchema } from '@/lib/types/category';
import type { Category } from '@/lib/types/category';
import type { ActionResult } from '@/lib/types/action-result';
import { generateId } from '@/lib/utils/id';
import { generateSlug, normalizeSlug } from '@/lib/utils/slug';
import { validateNodePlacement, validateReparent } from '@/lib/utils/tree';

const CategoryInputSchema = CategorySchema.omit({ id: true }).extend({
  slug: z.string().optional(),
  parent_id: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
});

function formatCategoryActionError(error: unknown, fallbackMessage: string): string {
  if (!error) return fallbackMessage;

  const rawMessage = error instanceof Error ? error.message : String(error);
  const message = rawMessage.toLowerCase();

  if (message.includes('root taxonomy nodes must have node_type department')) {
    return 'العقدة الرئيسية في الشجرة يجب أن تكون قسماً رئيسياً (Department).';
  }
  if (
    message.includes('taxonomy parent must exist and be active') ||
    (message.includes('parent node') && message.includes('does not exist'))
  ) {
    return 'التصنيف الأصل المحدد غير موجود أو مؤرشف.';
  }
  if (message.includes('invalid taxonomy hierarchy')) {
    return 'هيكل التبعية غير صالح: لا يمكن وضع هذا النوع من التصنيفات تحت التصنيف الأصل المختار.';
  }
  if (message.includes('changing this node type would invalidate')) {
    return 'لا يمكن تغيير نوع التصنيف لأنه سيؤدي إلى إبطال تصنيفات فرعية تابعة له.';
  }
  if (message.includes('only product_type taxonomy nodes may have an active product type schema')) {
    return 'فقط أنواع المنتجات (Product Type) يمكنها امتلاك سمات ومواصفات.';
  }
  if (message.includes('attributes can only be assigned to product type')) {
    return 'لا يمكن إسناد الخصائص إلا لنوع المنتج (Product Type).';
  }
  if (message.includes('duplicate') && (message.includes('slug') || message.includes('unique'))) {
    return 'الاسم اللطيف (Slug) مستخدم بالفعل، يرجى اختيار اسم مختلف.';
  }
  if (
    message.includes('cannot reparent') ||
    message.includes('descendant') ||
    message.includes('نقل غير صالحة')
  ) {
    return 'لا يمكن نقل التصنيف ليكون تابعاً لنفسه أو لأحد فروع تصنيفاته.';
  }
  if (message.includes('unit') || message.includes('dimension')) {
    return 'وحدة القياس لا تتوافق مع بُعد قياس السمة.';
  }
  if (message.includes('value set') || message.includes('value_set')) {
    return 'مجموعة القيم لا تتوافق مع السمة أو نوع بياناتها.';
  }

  if (error instanceof Error && error.message && !error.message.includes('Failed to save taxonomy snapshot')) {
    return error.message;
  }

  return fallbackMessage;
}

function revalidateTaxonomyPaths(categoryId?: string) {
  revalidatePath('/');
  revalidatePath('/taxonomy');
  revalidatePath('/tree');
  revalidatePath('/browse');
  revalidatePath('/browse', 'layout');
  if (categoryId) {
    revalidatePath(`/categories/${categoryId}`);
  }
}

export async function createCategory(data: unknown): Promise<ActionResult<Category>> {
  await requireOwner();
  try {
    const validated = CategoryInputSchema.parse(data);
    const categories = await readCategories();
    const placement = validateNodePlacement(validated.node_type, validated.parent_id ?? null, categories);
    if (!placement.valid) {
      return { success: false, error: placement.error || 'موضع التصنيف غير صالح' };
    }

    const existingSlugs = categories.map((c) => c.slug);
    
    // Auto-generate slug if missing
    let slug = validated.slug ? normalizeSlug(validated.slug) : undefined;
    if (!slug) {
      slug = generateSlug(validated.name_en || validated.name_ar, existingSlugs);
    }
    
    // Ensure slug is unique
    let finalSlug = slug;
    let counter = 1;
    while (existingSlugs.includes(finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const newCategory: Category = {
      ...validated,
      id: `cat_${generateId()}`,
      slug: finalSlug,
      parent_id: validated.parent_id ?? null,
      image: validated.image ?? null,
      attributes: validated.attributes || [],
    };

    categories.push(newCategory);
    await writeCategories(categories);
    
    revalidateTaxonomyPaths();
    return { success: true, data: newCategory };
  } catch (error: any) {
    if (error.name === 'ZodError') {
      const fieldErrors = error.flatten().fieldErrors;
      const errorMsg = Object.entries(fieldErrors)
        .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
        .join(' | ');
      return { success: false, error: errorMsg || 'خطأ في التحقق من صحة البيانات' };
    }
    return { success: false, error: formatCategoryActionError(error, 'حدث خطأ أثناء الإنشاء') };
  }
}

export async function updateCategory(id: string, data: unknown): Promise<ActionResult<Category>> {
  await requireOwner();
  try {
    const validated = CategoryInputSchema.parse(data);
    const categories = await readCategories();
    
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) {
      return { success: false, error: 'الفئة غير موجودة' };
    }
    const target = categories[index];
    if (!target) return { success: false, error: 'الفئة غير موجودة' };

    const nextParentId = validated.parent_id !== undefined ? validated.parent_id : target.parent_id;
    const nextNodeType = validated.node_type;
    if (nextParentId !== target.parent_id || nextNodeType !== target.node_type) {
      const placement = validateNodePlacement(nextNodeType, nextParentId ?? null, categories);
      if (!placement.valid) {
        return { success: false, error: placement.error || 'موضع التصنيف غير صالح' };
      }
    }

    const existingSlugs = categories.filter(c => c.id !== id).map(c => c.slug);

    // Check slug uniqueness
    let slug = validated.slug ? normalizeSlug(validated.slug) : undefined;
    if (!slug) {
      slug = generateSlug(validated.name_en || validated.name_ar, existingSlugs);
    }
    if (existingSlugs.includes(slug)) {
      slug = `${slug}-${generateId().substring(0,4)}`;
    }

    const updated: Category = {
      ...target,
      ...validated,
      slug,
      parent_id: validated.parent_id !== undefined ? validated.parent_id : target.parent_id,
      image: validated.image !== undefined ? validated.image : target.image,
      id, // ensure ID doesn't change
    };

    categories[index] = updated;
    await writeCategories(categories);
    
    revalidateTaxonomyPaths(id);
    return { success: true, data: updated };
  } catch (error: any) {
    if (error.name === 'ZodError') {
      const fieldErrors = error.flatten().fieldErrors;
      const errorMsg = Object.entries(fieldErrors)
        .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
        .join(' | ');
      return { success: false, error: errorMsg || 'خطأ في التحقق من صحة البيانات' };
    }
    return { success: false, error: formatCategoryActionError(error, 'حدث خطأ أثناء تحديث التصنيف') };
  }
}

export async function reparentCategory(categoryId: string, newParentId: string | null): Promise<ActionResult> {
  await requireOwner();
  try {
    const categories = await readCategories();
    
    const validation = validateReparent(categoryId, newParentId, categories);
    if (!validation.valid) {
      return { success: false, error: validation.error || 'عملية النقل غير صالحة' };
    }

    const index = categories.findIndex((c) => c.id === categoryId);
    if (index === -1) {
      return { success: false, error: 'الفئة غير موجودة' };
    }

    const target = categories[index];
    if (!target) return { success: false, error: 'الفئة غير موجودة' };

    target.parent_id = newParentId;
    await writeCategories(categories);
    
    revalidateTaxonomyPaths(categoryId);
    return { success: true, data: null };
  } catch (error: any) {
    return { success: false, error: formatCategoryActionError(error, 'حدث خطأ أثناء نقل الفئة') };
  }
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  await requireOwner();
  try {
    const categories = await readCategories();

    const target = categories.find((category) => category.id === categoryId);
    if (!target) {
      return { success: false, error: 'التصنيف غير موجود أو مؤرشف بالفعل' };
    }

    const children = categories.filter((category) => category.parent_id === categoryId);
    if (children.length > 0) {
      return {
        success: false,
        error: `لا يمكن حذف «${target.name_ar}» لأنه يحتوي على ${children.length} تصنيف فرعي. انقل التصنيفات الفرعية أو احذفها أولاً.`,
      };
    }

    const linkedAttributeCount = target.attributes?.length ?? 0;
    if (linkedAttributeCount > 0) {
      return {
        success: false,
        error: `لا يمكن حذف «${target.name_ar}» لأنه مرتبط بـ ${linkedAttributeCount} خاصية. أزل ارتباطات الخصائص أولاً.`,
      };
    }

    // writeCategories archives omitted nodes in the database; it does not hard-delete them.
    // Only archive the requested node after confirming it has no children or attribute bindings.
    await writeCategories(categories.filter((category) => category.id !== categoryId));

    revalidateTaxonomyPaths(categoryId);
    return { success: true, data: null };
  } catch (error: any) {
    return { success: false, error: formatCategoryActionError(error, 'حدث خطأ أثناء أرشفة التصنيف') };
  }
}
