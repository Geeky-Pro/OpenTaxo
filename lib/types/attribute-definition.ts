import { z } from 'zod';
import { DataTypeSchema, FilterTypeSchema } from '@/lib/types/attribute';

export const AttributeAliasInputSchema = z.object({
  alias_text: z.string().trim().min(1, 'اكتب الاسم البديل').max(200, 'الاسم البديل طويل جداً'),
  language_code: z.enum(['ar', 'en']).nullable().default(null),
});

export const AttributeDefinitionInputSchema = z.object({
  id: z.string().uuid().nullable().default(null),
  key: z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9_]{1,62}$/, 'المفتاح يجب أن يبدأ بحرف إنجليزي ويحتوي على حروف صغيرة وأرقام وشرطة سفلية فقط'),
  name_ar: z.string().trim().min(1, 'الاسم العربي مطلوب').max(120),
  name_en: z.string().trim().max(120).nullable().default(null),
  data_type: DataTypeSchema,
  filter_type: FilterTypeSchema,
  measurement_dimension_id: z.string().uuid().nullable().default(null),
  sort_order: z.number().int().min(0).max(100000).default(0),
  aliases: z.array(AttributeAliasInputSchema).max(100).default([]),
});

export type AttributeAliasInput = z.infer<typeof AttributeAliasInputSchema>;
export type AttributeDefinitionInput = z.infer<typeof AttributeDefinitionInputSchema>;

export type AttributeDefinition = {
  id: string;
  legacy_id: string | null;
  key: string;
  name_ar: string;
  name_en: string | null;
  data_type: z.infer<typeof DataTypeSchema>;
  filter_type: z.infer<typeof FilterTypeSchema> | null;
  measurement_dimension_id: string | null;
  dimension_name_ar: string | null;
  legacy_unit: string | null;
  status: 'active' | 'archived';
  sort_order: number;
  aliases: AttributeAliasInput[];
  usage_count: number;
  value_set_count: number;
};
