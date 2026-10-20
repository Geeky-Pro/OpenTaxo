import { z } from 'zod';
import { normalizeSlug } from '@/lib/utils/slug';

export const AttributeRoleSchema = z.enum(['identity', 'variant', 'descriptive', 'commercial']);

export const CategoryAttributeSchema = z.object({
  attribute_id: z.string().min(1),
  role: AttributeRoleSchema.default('descriptive'),
  group: z.string().optional(),
  is_variant: z.boolean().default(false),
  is_required: z.boolean().default(false),
  is_filterable: z.boolean().default(false),
  min_value: z.number().finite().optional(),
  max_value: z.number().finite().optional(),
  unit_id: z.string().uuid().optional(),
  value_set_id: z.string().uuid().optional(),
  allowed_values: z.array(z.string()).optional(),
});

export const ProductTypeBindingSchema = CategoryAttributeSchema.superRefine((binding, context) => {
  if (binding.min_value !== undefined && binding.max_value !== undefined && binding.min_value > binding.max_value) {
    context.addIssue({ code: 'custom', path: ['max_value'], message: 'الحد الأعلى يجب أن يكون أكبر من أو يساوي الحد الأدنى' });
  }
});

export type CategoryAttribute = z.infer<typeof CategoryAttributeSchema>;

export const NodeTypeSchema = z.enum(['department', 'category', 'subcategory', 'product_type']);

const SlugSchema = z.string()
  .trim()
  .min(1, 'الرابط مطلوب')
  .transform(normalizeSlug)
  .pipe(z.string().min(1, 'الرابط يجب أن يحتوي على أحرف أو أرقام لاتينية'));

export const CategorySchema = z.object({
  id: z.string(),
  database_id: z.string().uuid().optional(),
  name_ar: z.string().min(1, 'الاسم بالعربية مطلوب'),
  name_en: z.string().optional().nullable(),
  description: z.string().max(2000, 'الوصف لا يمكن أن يتجاوز 2000 حرف').optional(),
  sort_order: z.number().int().optional(),
  slug: SlugSchema,
  node_type: NodeTypeSchema.default('category'),
  parent_id: z.string().nullable().optional().default(null),
  image: z.string().nullable().optional().default(null),
  attributes: z.array(ProductTypeBindingSchema).default([]),
});

export type Category = z.infer<typeof CategorySchema>;

export const CategoriesFileSchema = z.array(CategorySchema);
