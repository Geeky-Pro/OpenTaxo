import { z } from 'zod';

export const FilterTypeSchema = z.enum([
  'range',
  'checkbox',
  'select',
  'toggle',
  'color_swatch',
  'button_group',
]);

export type FilterType = z.infer<typeof FilterTypeSchema>;

export const DataTypeSchema = z.enum(['number', 'enum', 'string', 'boolean']);

export type DataType = z.infer<typeof DataTypeSchema>;

export const AttributeSchema = z.object({
  data_type: DataTypeSchema.default('string'),
  id: z.string().min(1),
  database_id: z.string().uuid().optional(),
  measurement_dimension_id: z.string().uuid().optional(),
  name_ar: z.string().min(1),
  name_en: z.string().optional(),
  filter_type: FilterTypeSchema,
  unit: z.string().optional(),
});

export type Attribute = z.infer<typeof AttributeSchema>;

export const AttributesFileSchema = z.array(AttributeSchema);
