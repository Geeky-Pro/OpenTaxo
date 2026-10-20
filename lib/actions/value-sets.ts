'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireOwner } from '@/lib/auth/require-owner';
import { generateKey } from '@/lib/utils/slug';
import type { ActionResult } from '@/lib/types/action-result';

const KeySchema = z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9_]{1,62}$/, 'استخدم مفتاحاً ثابتاً بصيغة snake_case.');
const ValueKeySchema = z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9._-]{0,79}$/, 'مفتاح القيمة يقبل حروفاً صغيرة وأرقاماً وشرطة ونقطة فقط.');
const ValueSetSchema = z.object({
  id: z.string().uuid().nullable().default(null),
  key: KeySchema,
  name_ar: z.string().trim().min(1, 'اسم المجموعة بالعربية مطلوب.').max(120),
  name_en: z.string().trim().max(120).nullable().default(null),
  attribute_id: z.string().uuid().nullable().default(null),
  sort_order: z.number().int().min(0).max(100000).default(0),
});
const ValueSchema = z.object({
  id: z.string().uuid().nullable().default(null),
  value_set_id: z.string().uuid(),
  value_key: ValueKeySchema,
  label_ar: z.string().trim().min(1, 'اسم القيمة بالعربية مطلوب.').max(120),
  label_en: z.string().trim().max(120).nullable().default(null),
  raw_value: z.string().trim().max(200).nullable().default(null),
  sort_order: z.number().int().min(0).max(100000).default(0),
});

function validationError(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? 'راجع البيانات المدخلة.';
}

function mapDatabaseError(message: string, fallback: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('duplicate key') || normalized.includes('unique constraint')) return 'المفتاح مستخدم بالفعل. اختر مفتاحاً آخر.';
  if (normalized.includes('enum attribute')) return 'يمكن ربط مجموعة القيم بخاصية نشطة من نوع قائمة محددة (Enum) فقط.';
  if (normalized.includes('active product types')) return 'لا يمكن أرشفة مجموعة القيم وهي مستخدمة في نوع منتج نشط؛ افصل الارتباط أولاً.';
  if (normalized.includes('active value set')) return 'لا يمكن إضافة قيمة نشطة إلى مجموعة مؤرشفة.';
  if (normalized.includes('row-level security') || normalized.includes('permission denied')) return 'ليس لديك صلاحية تنفيذ هذا الإجراء.';
  return fallback;
}

export async function saveValueSet(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const raw = typeof input === 'object' && input !== null ? { ...(input as Record<string, unknown>) } : {};

  if (!raw.key || typeof raw.key !== 'string' || !raw.key.trim()) {
    const { data: existing } = await supabase.from('attribute_value_sets').select('id, key');
    const existingKeys = (existing ?? [])
      .filter((row: { id: string }) => row.id !== raw.id)
      .map((row: { key: string }) => row.key);
    raw.key = generateKey(raw.name_en as string | null, raw.name_ar as string | null, existingKeys, 'vset');
  }

  const parsed = ValueSetSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: validationError(parsed.error) };
  const valueSet = parsed.data;
  const payload = {
    key: valueSet.key,
    name_ar: valueSet.name_ar,
    name_en: valueSet.name_en || null,
    attribute_id: valueSet.attribute_id,
    sort_order: valueSet.sort_order,
    updated_at: new Date().toISOString(),
  };

  const result = valueSet.id
    ? await supabase.from('attribute_value_sets').update(payload).eq('id', valueSet.id).eq('status', 'active').select('id').maybeSingle()
    : await supabase.from('attribute_value_sets').insert({ ...payload, status: 'active' }).select('id').single();

  if (result.error) {
    console.error('Failed to save value set:', result.error.message);
    return { success: false, error: mapDatabaseError(result.error.message, 'تعذر حفظ مجموعة القيم.') };
  }
  if (!result.data) return { success: false, error: 'مجموعة القيم غير موجودة أو مؤرشفة.' };

  revalidatePath('/value-sets');
  revalidatePath('/definitions');
  revalidatePath('/categories');
  return { success: true, data: result.data.id };
}

export async function setValueSetArchived(id: string, archived: boolean): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { success: false, error: 'معرّف مجموعة القيم غير صالح.' };
  const result = await supabase.from('attribute_value_sets')
    .update({ status: archived ? 'archived' : 'active', archived_at: archived ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
    .eq('id', parsed.data)
    .select('id')
    .maybeSingle();
  if (result.error) {
    console.error('Failed to change value set status:', result.error.message);
    return { success: false, error: mapDatabaseError(result.error.message, 'تعذر تغيير حالة مجموعة القيم.') };
  }
  if (!result.data) return { success: false, error: 'مجموعة القيم غير موجودة.' };
  revalidatePath('/value-sets');
  revalidatePath('/definitions');
  revalidatePath('/categories');
  return { success: true, data: archived ? 'تمت أرشفة المجموعة مع الاحتفاظ بالقيم.' : 'تمت إعادة تنشيط المجموعة.' };
}

export async function saveAttributeValue(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const raw = typeof input === 'object' && input !== null ? { ...(input as Record<string, unknown>) } : {};

  if (!raw.value_key || typeof raw.value_key !== 'string' || !raw.value_key.trim()) {
    let existingKeys: string[] = [];
    if (typeof raw.value_set_id === 'string' && raw.value_set_id) {
      const { data: existing } = await supabase
        .from('attribute_values')
        .select('id, value_key')
        .eq('value_set_id', raw.value_set_id);
      existingKeys = (existing ?? [])
        .filter((row: { id: string }) => row.id !== raw.id)
        .map((row: { value_key: string }) => row.value_key);
    }
    raw.value_key = generateKey(raw.label_en as string | null, raw.label_ar as string | null, existingKeys, 'val');
  }

  const parsed = ValueSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: validationError(parsed.error) };
  const value = parsed.data;
  const payload = {
    value_set_id: value.value_set_id,
    value_key: value.value_key,
    label_ar: value.label_ar,
    label_en: value.label_en || null,
    raw_value: value.raw_value || null,
    sort_order: value.sort_order,
    updated_at: new Date().toISOString(),
  };
  const result = value.id
    ? await supabase.from('attribute_values').update(payload).eq('id', value.id).eq('status', 'active').select('id').maybeSingle()
    : await supabase.from('attribute_values').insert({ ...payload, status: 'active' }).select('id').single();

  if (result.error) {
    console.error('Failed to save attribute value:', result.error.message);
    return { success: false, error: mapDatabaseError(result.error.message, 'تعذر حفظ القيمة.') };
  }
  if (!result.data) return { success: false, error: 'القيمة غير موجودة أو مؤرشفة.' };
  revalidatePath('/value-sets');
  revalidatePath('/categories');
  return { success: true, data: result.data.id };
}

export async function setAttributeValueArchived(id: string, archived: boolean): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { success: false, error: 'معرّف القيمة غير صالح.' };
  const result = await supabase.from('attribute_values')
    .update({ status: archived ? 'archived' : 'active', archived_at: archived ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
    .eq('id', parsed.data)
    .select('id')
    .maybeSingle();
  if (result.error) {
    console.error('Failed to change attribute value status:', result.error.message);
    return { success: false, error: mapDatabaseError(result.error.message, 'تعذر تغيير حالة القيمة.') };
  }
  if (!result.data) return { success: false, error: 'القيمة غير موجودة.' };
  revalidatePath('/value-sets');
  revalidatePath('/categories');
  return { success: true, data: archived ? 'تمت أرشفة القيمة.' : 'تمت إعادة تنشيط القيمة.' };
}
