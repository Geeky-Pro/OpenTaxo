'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/auth/require-owner';
import { isCompatibleFilter } from '@/lib/domain/attribute-compatibility';
import { AttributeDefinitionInputSchema } from '@/lib/types/attribute-definition';
import { generateKey } from '@/lib/utils/slug';
import type { ActionResult } from '@/lib/types/action-result';

function validationMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? 'راجع بيانات تعريف الخاصية.';
}

export async function saveAttributeDefinition(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const raw = typeof input === 'object' && input !== null ? { ...(input as Record<string, unknown>) } : {};

  if (!raw.key || typeof raw.key !== 'string' || !raw.key.trim()) {
    const { data: existing } = await supabase.from('attributes').select('id, key');
    const existingKeys = (existing ?? [])
      .filter((row: { id: string }) => row.id !== raw.id)
      .map((row: { key: string }) => row.key);
    raw.key = generateKey(raw.name_en as string | null, raw.name_ar as string | null, existingKeys, 'attr');
  }

  const parsed = AttributeDefinitionInputSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: validationMessage(parsed.error) };

  const definition = parsed.data;
  if (!isCompatibleFilter(definition.data_type, definition.filter_type)) {
    return { success: false, error: 'نمط الفلترة غير متوافق مع نوع البيانات المحدد.' };
  }
  if (definition.measurement_dimension_id && definition.data_type !== 'number') {
    return { success: false, error: 'لا يمكن إسناد بُعد فيزيائي إلا إلى خاصية رقمية.' };
  }

  const aliases = definition.aliases.map((alias) => ({
    alias_text: alias.alias_text.trim(),
    language_code: alias.language_code,
  }));

  const { data, error } = await supabase.rpc('save_attribute_definition', {
    p_id: definition.id,
    p_key: definition.key,
    p_name_ar: definition.name_ar,
    p_name_en: definition.name_en,
    p_data_type: definition.data_type,
    p_filter_type: definition.filter_type,
    p_measurement_dimension_id: definition.measurement_dimension_id,
    p_sort_order: definition.sort_order,
    p_aliases: aliases,
  });

  if (error) {
    console.error('Failed to save central attribute definition:', error);
    if (error.code === '23505') {
      return { success: false, error: 'المفتاح أو الاسم البديل مستخدم بالفعل. اختر قيمة أخرى.' };
    }
    if (error.message.includes('active Product Types')) {
      return { success: false, error: 'افصل الخاصية عن أنواع المنتجات النشطة قبل تغيير نوع البيانات أو البعد الفيزيائي.' };
    }
    if (error.message.includes('value sets')) {
      return { success: false, error: 'افصل مجموعات القيم المرتبطة قبل تغيير نوع البيانات.' };
    }
    if (error.message.includes('not compatible')) {
      return { success: false, error: 'نمط الفلترة غير متوافق مع نوع البيانات المحدد.' };
    }
    return { success: false, error: error.message || 'تعذر حفظ تعريف الخاصية.' };
  }

  revalidatePath('/attributes');
  revalidatePath('/data-types');
  revalidatePath('/definitions');
  revalidatePath('/');
  revalidatePath('/categories');
  return { success: true, data };
}

export async function archiveAttributeDefinition(id: string): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return { success: false, error: 'معرّف الخاصية غير صالح.' };
  }

  const { error } = await supabase.rpc('archive_attribute_definition', { p_id: id });
  if (error) {
    console.error('Failed to archive central attribute definition:', error);
    if (error.message.includes('active Product Types')) {
      return { success: false, error: 'لا يمكن أرشفة الخاصية قبل إزالتها من جميع أنواع المنتجات النشطة.' };
    }
    if (error.message.includes('value sets')) {
      return { success: false, error: 'أرشف أو افصل مجموعات القيم المرتبطة بهذه الخاصية أولاً.' };
    }
    return { success: false, error: error.message || 'تعذر أرشفة الخاصية.' };
  }

  revalidatePath('/attributes');
  revalidatePath('/data-types');
  revalidatePath('/definitions');
  revalidatePath('/');
  revalidatePath('/categories');
  return { success: true, data: 'تمت أرشفة الخاصية مع الاحتفاظ بسجلها.' };
}
