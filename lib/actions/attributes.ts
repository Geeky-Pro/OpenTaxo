'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/auth/require-owner';
import { readAttributes, writeAttributes } from '@/lib/data/attributes';
import { readCategories } from '@/lib/data/categories';
import { writeTaxonomyAndAttributes } from '@/lib/data/snapshot';
import { AttributeSchema, type Attribute } from '@/lib/types/attribute';
import { generateId } from '@/lib/utils/id';
import type { ActionResult } from '@/lib/types/action-result';

export async function createAttribute(
  data: Omit<Attribute, 'id'>
): Promise<ActionResult> {
  await requireOwner();
  try {
    // Validate incoming data
    const validatedData = AttributeSchema.omit({ id: true }).parse(data);

    const attributes = await readAttributes();
    
    const newAttribute: Attribute = {
      ...validatedData,
      id: generateId(),
    };

    attributes.push(newAttribute);
    await writeAttributes(attributes);

    revalidatePath('/attributes');
    revalidatePath('/');
    return { success: true, data: '' };
  } catch (error) {
    console.error('Failed to create attribute:', error);
    return { success: false, error: 'حدث خطأ أثناء إضافة السمة' };
  }
}

export async function updateAttribute(
  id: string,
  data: Omit<Attribute, 'id'>
): Promise<ActionResult> {
  await requireOwner();
  try {
    const validatedData = AttributeSchema.omit({ id: true }).parse(data);

    const attributes = await readAttributes();
    const index = attributes.findIndex((a) => a.id === id);

    if (index === -1) {
      return { success: false, error: 'السمة غير موجودة' };
    }

    attributes[index] = { ...validatedData, id };
    await writeAttributes(attributes);

    revalidatePath('/attributes');
    revalidatePath('/');
    return { success: true, data: '' };
  } catch (error) {
    console.error('Failed to update attribute:', error);
    return { success: false, error: 'حدث خطأ أثناء تحديث السمة' };
  }
}

export async function deleteAttribute(id: string): Promise<ActionResult> {
  await requireOwner();
  try {
    // 1. Read Categories and perform cascade cleanup
    const categories = await readCategories();
    let categoriesModified = false;

    for (const category of categories) {
      const initialLength = category.attributes.length;
      // Filter out the deleted attribute
      category.attributes = category.attributes.filter(
        (attr) => attr.attribute_id !== id
      );

      if (category.attributes.length !== initialLength) {
        categoriesModified = true;
      }
    }

    // 2. Delete from attributes and update bindings in one database transaction.
    const attributes = await readAttributes();
    const filteredAttributes = attributes.filter((a) => a.id !== id);

    if (attributes.length === filteredAttributes.length) {
      return { success: false, error: 'السمة غير موجودة' };
    }

    if (categoriesModified) {
      await writeTaxonomyAndAttributes(categories, filteredAttributes);
    } else {
      await writeAttributes(filteredAttributes);
    }

    // 3. Revalidate paths
    revalidatePath('/attributes');
    revalidatePath('/');
    
    return { success: true, data: '' };
  } catch (error) {
    console.error('Failed to delete attribute:', error);
    return { success: false, error: 'حدث خطأ أثناء حذف السمة' };
  }
}
