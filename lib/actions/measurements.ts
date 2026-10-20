'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireOwner } from '@/lib/auth/require-owner';
import { generateKey } from '@/lib/utils/slug';
import type { ActionResult } from '@/lib/types/action-result';

const KeySchema = z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9_]{1,62}$/, 'استخدم مفتاحاً ثابتاً بصيغة snake_case.');
const DimensionSchema = z.object({
  id: z.string().uuid().nullable().default(null),
  key: KeySchema,
  name_ar: z.string().trim().min(1, 'اسم البُعد بالعربية مطلوب.').max(120),
  name_en: z.string().trim().max(120).nullable().default(null),
});
const UnitSchema = z.object({
  id: z.string().uuid().nullable().default(null),
  dimension_id: z.string().uuid(),
  key: KeySchema,
  name_ar: z.string().trim().min(1, 'اسم الوحدة بالعربية مطلوب.').max(120),
  name_en: z.string().trim().max(120).nullable().default(null),
  symbol: z.string().trim().max(40).nullable().default(null),
  to_base_multiplier: z.number().finite().positive('معامل التحويل يجب أن يكون أكبر من صفر.'),
  to_base_offset: z.number().finite(),
  make_base: z.boolean().default(false),
});
const ConversionRuleSchema = z.object({
  id: z.string().uuid().nullable().default(null),
  source_unit_id: z.string().uuid(),
  target_unit_id: z.string().uuid(),
  multiplier: z.number().finite().positive('معامل التحويل يجب أن يكون أكبر من صفر.'),
  offset_value: z.number().finite(),
  selling_unit_definition_id: z.string().uuid().nullable().default(null),
}).superRefine((rule, context) => {
  if (rule.source_unit_id === rule.target_unit_id) {
    context.addIssue({ code: 'custom', path: ['target_unit_id'], message: 'اختر وحدتين مختلفتين.' });
  }
});

function validationError(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? 'راجع البيانات المدخلة.';
}
function mapError(message: string, fallback: string) {
  const value = message.toLowerCase();
  if (value.includes('duplicate key') || value.includes('unique constraint')) return 'المفتاح أو قاعدة التحويل موجودة بالفعل.';
  if (value.includes('dimension') && (value.includes('match') || value.includes('different'))) return 'لا يمكن الربط بين أبعاد فيزيائية مختلفة.';
  if (value.includes('active product types')) return 'افصل هذا التعريف عن أنواع المنتجات النشطة أولاً.';
  if (value.includes('conversion rules')) return 'أرشف قواعد التحويل التي تستخدم هذه الوحدة أولاً.';
  if (value.includes('base unit')) return 'يجب اختيار وحدة أساس واحدة فقط، ويجب أن يكون معاملها 1 والإزاحة 0.';
  if (value.includes('same physical dimension')) return 'التحويل مسموح فقط بين وحدات البُعد الفيزيائي نفسه.';
  if (value.includes('physical conversion rule')) return 'المعامل والإزاحة لا يطابقان عوامل الوحدتين. استخدم القيم المحسوبة من الوحدات.';
  if (value.includes('row-level security') || value.includes('permission denied')) return 'ليس لديك صلاحية تنفيذ هذا الإجراء.';
  return fallback;
}

export async function saveMeasurementDimension(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const raw = typeof input === 'object' && input !== null ? { ...(input as Record<string, unknown>) } : {};

  if (!raw.key || typeof raw.key !== 'string' || !raw.key.trim()) {
    const { data: existing } = await supabase.from('measurement_dimensions').select('id, key');
    const existingKeys = (existing ?? [])
      .filter((row: { id: string }) => row.id !== raw.id)
      .map((row: { key: string }) => row.key);
    raw.key = generateKey(raw.name_en as string | null, raw.name_ar as string | null, existingKeys, 'dim');
  }

  const parsed = DimensionSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: validationError(parsed.error) };
  const row = parsed.data;
  const payload = { key: row.key, name_ar: row.name_ar, name_en: row.name_en || null, updated_at: new Date().toISOString() };
  const result = row.id
    ? await supabase.from('measurement_dimensions').update(payload).eq('id', row.id).eq('status', 'active').select('id').maybeSingle()
    : await supabase.from('measurement_dimensions').insert({ ...payload, status: 'active' }).select('id').single();
  if (result.error) {
    console.error('Failed to save measurement dimension:', result.error.message);
    return { success: false, error: mapError(result.error.message, 'تعذر حفظ البُعد الفيزيائي.') };
  }
  if (!result.data) return { success: false, error: 'البُعد غير موجود أو مؤرشف.' };
  revalidatePath('/measurements');
  revalidatePath('/attributes');
  revalidatePath('/definitions');
  revalidatePath('/unit-conversions');
  return { success: true, data: result.data.id };
}

export async function setMeasurementDimensionArchived(id: string, archived: boolean): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { success: false, error: 'معرّف البُعد غير صالح.' };
  const result = await supabase.from('measurement_dimensions')
    .update({ status: archived ? 'archived' : 'active', updated_at: new Date().toISOString() })
    .eq('id', parsed.data).select('id').maybeSingle();
  if (result.error) {
    console.error('Failed to change dimension status:', result.error.message);
    return { success: false, error: mapError(result.error.message, 'تعذر تغيير حالة البُعد. قد يكون مرتبطاً بوحدات أو خصائص نشطة.') };
  }
  if (!result.data) return { success: false, error: 'البُعد غير موجود.' };
  revalidatePath('/measurements');
  revalidatePath('/attributes');
  revalidatePath('/definitions');
  return { success: true, data: archived ? 'تمت أرشفة البُعد.' : 'تمت إعادة تنشيط البُعد.' };
}

export async function saveMeasurementUnit(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const raw = typeof input === 'object' && input !== null ? { ...(input as Record<string, unknown>) } : {};

  if (!raw.key || typeof raw.key !== 'string' || !raw.key.trim()) {
    const { data: existing } = await supabase.from('measurement_units').select('id, key');
    const existingKeys = (existing ?? [])
      .filter((row: { id: string }) => row.id !== raw.id)
      .map((row: { key: string }) => row.key);
    const primary = (raw.name_en as string | null) || (raw.symbol as string | null);
    raw.key = generateKey(primary, raw.name_ar as string | null, existingKeys, 'unit');
  }

  const parsed = UnitSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: validationError(parsed.error) };
  const unit = parsed.data;
  const { data, error } = await supabase.rpc('save_measurement_unit', {
    p_id: unit.id,
    p_dimension_id: unit.dimension_id,
    p_key: unit.key,
    p_name_ar: unit.name_ar,
    p_name_en: unit.name_en || null,
    p_symbol: unit.symbol || null,
    p_to_base_multiplier: unit.to_base_multiplier,
    p_to_base_offset: unit.to_base_offset,
    p_make_base: unit.make_base,
  });
  if (error) {
    console.error('Failed to save measurement unit:', error.message);
    return { success: false, error: mapError(error.message, 'تعذر حفظ وحدة القياس.') };
  }
  revalidatePath('/measurements');
  revalidatePath('/unit-conversions');
  revalidatePath('/attributes');
  revalidatePath('/categories');
  return { success: true, data };
}

export async function setMeasurementUnitArchived(id: string, archived: boolean): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { success: false, error: 'معرّف الوحدة غير صالح.' };
  const result = await supabase.from('measurement_units')
    .update({ status: archived ? 'archived' : 'active', updated_at: new Date().toISOString() })
    .eq('id', parsed.data).select('id').maybeSingle();
  if (result.error) {
    console.error('Failed to change unit status:', result.error.message);
    return { success: false, error: mapError(result.error.message, 'تعذر تغيير حالة الوحدة. تحقق من قواعد التحويل وارتباطات Product Type.') };
  }
  if (!result.data) return { success: false, error: 'الوحدة غير موجودة.' };
  revalidatePath('/measurements');
  revalidatePath('/unit-conversions');
  revalidatePath('/categories');
  return { success: true, data: archived ? 'تمت أرشفة الوحدة.' : 'تمت إعادة تنشيط الوحدة.' };
}

export async function setMeasurementUnitAsBase(id: string): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { success: false, error: 'معرّف الوحدة غير صالح.' };
  const { data: unit, error: readError } = await supabase.from('measurement_units')
    .select('id, dimension_id, key, name_ar, name_en, symbol, to_base_multiplier, to_base_offset')
    .eq('id', parsed.data).eq('status', 'active').maybeSingle();
  if (readError || !unit) return { success: false, error: 'الوحدة غير موجودة أو مؤرشفة.' };
  const { error } = await supabase.rpc('save_measurement_unit', {
    p_id: unit.id,
    p_dimension_id: unit.dimension_id,
    p_key: unit.key,
    p_name_ar: unit.name_ar,
    p_name_en: unit.name_en,
    p_symbol: unit.symbol,
    p_to_base_multiplier: Number(unit.to_base_multiplier),
    p_to_base_offset: Number(unit.to_base_offset),
    p_make_base: true,
  });
  if (error) {
    console.error('Failed to change base unit:', error.message);
    return { success: false, error: mapError(error.message, 'تعذر تغيير وحدة الأساس.') };
  }
  revalidatePath('/measurements');
  revalidatePath('/unit-conversions');
  revalidatePath('/categories');
  return { success: true, data: 'تم تغيير وحدة الأساس وإعادة حساب معاملات الوحدات المرتبطة.' };
}

export async function saveUnitConversionRule(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const parsed = ConversionRuleSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: validationError(parsed.error) };
  const rule = parsed.data;
  const payload = {
    source_unit_id: rule.source_unit_id,
    target_unit_id: rule.target_unit_id,
    multiplier: rule.multiplier,
    offset_value: rule.offset_value,
    selling_unit_definition_id: rule.selling_unit_definition_id,
    status: 'active',
    updated_at: new Date().toISOString(),
  };
  const result = rule.id
    ? await supabase.from('unit_conversion_rules').update(payload).eq('id', rule.id).select('id').maybeSingle()
    : await supabase.from('unit_conversion_rules').insert(payload).select('id').single();
  if (result.error) {
    console.error('Failed to save unit conversion rule:', result.error.message);
    return { success: false, error: mapError(result.error.message, 'تعذر حفظ قاعدة التحويل.') };
  }
  if (!result.data) return { success: false, error: 'قاعدة التحويل غير موجودة.' };
  revalidatePath('/unit-conversions');
  revalidatePath('/measurements');
  return { success: true, data: result.data.id };
}

export async function setUnitConversionRuleArchived(id: string, archived: boolean): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { success: false, error: 'معرّف قاعدة التحويل غير صالح.' };
  const result = await supabase.from('unit_conversion_rules')
    .update({ status: archived ? 'archived' : 'active', updated_at: new Date().toISOString() })
    .eq('id', parsed.data).select('id').maybeSingle();
  if (result.error) {
    console.error('Failed to change conversion rule status:', result.error.message);
    return { success: false, error: mapError(result.error.message, 'تعذر تغيير حالة قاعدة التحويل.') };
  }
  if (!result.data) return { success: false, error: 'قاعدة التحويل غير موجودة.' };
  revalidatePath('/unit-conversions');
  revalidatePath('/measurements');
  return { success: true, data: archived ? 'تمت أرشفة قاعدة التحويل.' : 'تمت إعادة تنشيط قاعدة التحويل.' };
}

export async function convertMeasurementValue(input: unknown): Promise<ActionResult<{ value: number }>> {
  const { supabase } = await requireOwner();
  const parsed = z.object({
    value: z.number().finite(),
    source_unit_id: z.string().uuid(),
    target_unit_id: z.string().uuid(),
  }).safeParse(input);
  if (!parsed.success) return { success: false, error: validationError(parsed.error) };
  const { data, error } = await supabase.rpc('convert_measurement_value', {
    p_value: parsed.data.value,
    p_source_unit_id: parsed.data.source_unit_id,
    p_target_unit_id: parsed.data.target_unit_id,
  });
  if (error) {
    console.error('Failed to convert measurement value:', error.message);
    return { success: false, error: mapError(error.message, 'تعذر تحويل القيمة. تأكد من أن الوحدتين تنتميان إلى البُعد نفسه.') };
  }
  return { success: true, data: { value: Number(data) } };
}
