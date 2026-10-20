'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireOwner } from '@/lib/auth/require-owner';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/types/action-result';

const BindingInputSchema = z.object({
  attribute_id: z.string().min(1),
  role: z.enum(['identity', 'variant', 'descriptive', 'commercial']).default('descriptive'),
  group: z.string().trim().max(120).optional(),
  is_variant: z.boolean().default(false),
  is_required: z.boolean().default(false),
  is_filterable: z.boolean().default(false),
  min_value: z.number().finite().optional(),
  max_value: z.number().finite().optional(),
  unit_id: z.string().uuid().optional(),
  value_set_id: z.string().uuid().optional(),
  allowed_values: z.array(z.string().trim().min(1).max(200)).max(200).optional(),
}).superRefine((binding, context) => {
  if (binding.min_value !== undefined && binding.max_value !== undefined && binding.min_value > binding.max_value) {
    context.addIssue({ code: 'custom', path: ['max_value'], message: 'الحد الأعلى يجب أن يكون أكبر من أو يساوي الحد الأدنى' });
  }
});

const SaveBindingsSchema = z.array(BindingInputSchema).max(250).superRefine((bindings, context) => {
  const seen = new Set<string>();
  bindings.forEach((binding, index) => {
    if (seen.has(binding.attribute_id)) {
      context.addIssue({ code: 'custom', path: [index, 'attribute_id'], message: 'لا يمكن ربط السمة نفسها أكثر من مرة' });
    }
    seen.add(binding.attribute_id);
  });
});

export async function saveProductTypeAttributeAssignments(
  taxonomyNodeId: string,
  routeId: string,
  input: unknown,
): Promise<ActionResult> {
  await requireOwner();

  const nodeIdResult = z.string().uuid().safeParse(taxonomyNodeId);
  const routeIdResult = z.string().min(1).max(120).regex(/^[a-zA-Z0-9_-]+$/).safeParse(routeId);
  const parsed = SaveBindingsSchema.safeParse(input);
  if (!nodeIdResult.success || !routeIdResult.success || !parsed.success) {
    return { success: false, error: 'بيانات الخصائص غير صالحة. تحقق من القيم والحدود ومن عدم تكرار السمات.' };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc('replace_product_type_attribute_assignments', {
      p_taxonomy_node_id: nodeIdResult.data,
      p_bindings: JSON.parse(JSON.stringify(parsed.data)),
    });

    if (error) {
      console.error('Failed to save Product Type attribute assignments:', error.message);
      const message = error.message.toLowerCase();
      const friendlyError = message.includes('unit') || message.includes('dimension')
        ? 'وحدة القياس لا تتوافق مع بُعد قياس السمة.'
        : message.includes('value set') || message.includes('value_set')
          ? 'مجموعة القيم لا تتوافق مع السمة أو نوع بياناتها.'
          : message.includes('product type')
            ? 'يمكن إسناد الخصائص إلى نوع المنتج (Product Type) فقط.'
            : message.includes('invalid taxonomy hierarchy')
              ? 'هيكل التبعية لنوع المنتج غير صالح في قاعدة البيانات.'
              : message.includes('bounds') || message.includes('min_value') || message.includes('max_value')
                ? 'الحد الأعلى للقيمة يجب أن يكون أكبر من أو يساوي الحد الأدنى.'
                : 'تعذر حفظ خصائص نوع المنتج. تحقق من أنواع البيانات والحدود والوحدات ثم حاول مجددًا.';
      return { success: false, error: friendlyError };
    }

    revalidatePath(`/categories/${routeId}`);
    revalidatePath('/');
    revalidatePath('/taxonomy');
    revalidatePath('/tree');
    revalidatePath('/browse');
    revalidatePath('/browse', 'layout');
    return { success: true, data: 'تم حفظ خصائص نوع المنتج.' };
  } catch (error) {
    console.error('Unexpected Product Type assignment error:', error);
    return { success: false, error: 'حدث خطأ غير متوقع أثناء حفظ خصائص نوع المنتج.' };
  }
}
