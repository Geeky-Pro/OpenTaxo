'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { ArrowRight, Save, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AttributeBindingSection from './AttributeBindingSection';
import { ImageUploadDropzone } from '../ui/ImageUploadDropzone';
import { saveCategoryFullDetails } from '@/lib/actions/category-details';
import { getForbiddenParentIds } from '@/lib/utils/tree';
import type { CategoryWithEnrichedAttributes } from '@/lib/actions/category-details';
import type { Attribute } from '@/lib/types/attribute';
import type { ProductTypeEditorOptions } from '@/lib/data/product-type-editor';
import type { Category } from '@/lib/types/category';

type EnrichedCategoryAttribute = CategoryWithEnrichedAttributes['enriched_attributes'][number];

interface CategoryDetailClientProps {
  initialCategory: CategoryWithEnrichedAttributes;
  globalAttributes: Attribute[];
  productTypeEditorOptions: ProductTypeEditorOptions;
  ancestors: Category[];
  allCategories?: Category[];
}

const NODE_TYPES = [
  { value: 'department', label: 'قسم (Department)' },
  { value: 'category', label: 'فئة رئيسية (Category)' },
  { value: 'subcategory', label: 'فئة فرعية (Subcategory)' },
  { value: 'product_type', label: 'نوع منتج (Product Type)' },
];

export default function CategoryDetailClient({
  initialCategory,
  globalAttributes,
  productTypeEditorOptions,
  ancestors,
  allCategories,
}: CategoryDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | Record<string, string[]> | null>(null);

  // Form State
  const [nameAr, setNameAr] = useState(initialCategory.name_ar);
  const [nameEn, setNameEn] = useState(initialCategory.name_en || '');
  const [description, setDescription] = useState(initialCategory.description || '');
  const [slug, setSlug] = useState(initialCategory.slug);
  const [nodeType, setNodeType] = useState<Category['node_type']>(initialCategory.node_type || 'category');
  const [parentId, setParentId] = useState<string | null>(initialCategory.parent_id);
  const [image, setImage] = useState<string | null>(initialCategory.image || null);
  const [boundAttributes, setBoundAttributes] = useState<EnrichedCategoryAttribute[]>(initialCategory.enriched_attributes);

  const forbiddenIds = useMemo(() => {
    return allCategories ? getForbiddenParentIds(initialCategory.id, allCategories) : new Set<string>();
  }, [allCategories, initialCategory.id]);

  const validParentOptions = useMemo(() => {
    if (!allCategories?.length) return [];

    return allCategories
      .filter((cat) => {
        if (cat.id === initialCategory.id) return false;
        if (forbiddenIds.has(cat.id)) return false;
        if (nodeType === 'category') {
          return cat.node_type === 'department';
        }
        if (nodeType === 'subcategory') {
          return cat.node_type === 'category';
        }
        if (nodeType === 'product_type') {
          return cat.node_type === 'category' || cat.node_type === 'subcategory';
        }
        return false;
      })
      .map((cat) => {
        const typeLabels: Record<string, string> = {
          department: 'قسم رئيسي',
          category: 'تصنيف',
          subcategory: 'تصنيف فرعي',
          product_type: 'نوع منتج',
        };
        return {
          id: cat.id,
          name_ar: cat.name_ar,
          typeLabel: typeLabels[cat.node_type] || cat.node_type,
        };
      });
  }, [allCategories, forbiddenIds, initialCategory.id, nodeType]);

  const handleNodeTypeChange = (newNodeType: Category['node_type']) => {
    setNodeType(newNodeType);
    if (newNodeType === 'department') {
      setParentId(null);
    } else if (allCategories?.length) {
      const currentParent = allCategories.find((c) => c.id === parentId);
      const isStillValid =
        currentParent &&
        ((newNodeType === 'category' && currentParent.node_type === 'department') ||
          (newNodeType === 'subcategory' && currentParent.node_type === 'category') ||
          (newNodeType === 'product_type' &&
            (currentParent.node_type === 'category' || currentParent.node_type === 'subcategory')));
      if (!isStillValid) {
        const firstValid = allCategories.find((c) => {
          if (c.id === initialCategory.id || forbiddenIds.has(c.id)) return false;
          if (newNodeType === 'category') return c.node_type === 'department';
          if (newNodeType === 'subcategory') return c.node_type === 'category';
          if (newNodeType === 'product_type') return c.node_type === 'category' || c.node_type === 'subcategory';
          return false;
        });
        setParentId(firstValid?.id || null);
      }
    }
  };

  const handleAddAttribute = (attributeId: string) => {
    const globalAttr = globalAttributes.find(a => a.id === attributeId);
    if (!globalAttr) return;

    const newAttr: EnrichedCategoryAttribute = {
      attribute_id: attributeId,
      role: 'descriptive',
      is_variant: false,
      is_required: false,
      is_filterable: false,
      group: '',
      global: globalAttr,
    };
    setBoundAttributes([...boundAttributes, newAttr]);
  };

  const handleUpdateAttribute = (index: number, updated: EnrichedCategoryAttribute) => {
    const next = [...boundAttributes];
    next[index] = updated;
    setBoundAttributes(next);
  };

  const handleRemoveAttribute = (index: number) => {
    setBoundAttributes(boundAttributes.filter((_, i) => i !== index));
  };

  const handleMoveAttribute = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= boundAttributes.length) return;
    const next = [...boundAttributes];
    const [moving] = next.splice(index, 1);
    if (!moving) return;
    next.splice(targetIndex, 0, moving);
    setBoundAttributes(next);
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      // Strip 'global' before saving to match Category schema
      const attributesToSave = nodeType === 'product_type'
        ? boundAttributes.map(({ global, ...rest }) => rest)
        : [];
      
      const categoryData = {
        id: initialCategory.id,
        parent_id: nodeType === 'department' ? null : parentId,
        name_ar: nameAr,
        name_en: nameEn || undefined,
        description: description.trim(),
        sort_order: initialCategory.sort_order,
        slug: slug,
        node_type: nodeType,
        image: image || undefined,
        attributes: attributesToSave,
      };

      const result = await saveCategoryFullDetails(initialCategory.id, categoryData);
      
      if (!result.success) {
        setError(result.error);
      } else {
        // Success - navigate back or show success message
        router.push('/');
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[--border] pb-4">
        <div>
          <nav className="flex items-center gap-2 text-sm text-[--foreground-muted] mb-2" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[--primary] transition-colors">الرئيسية</Link>
            {ancestors.map((ancestor) => (
              <React.Fragment key={ancestor.id}>
                <span className="text-[--border]">/</span>
                <Link href={`/categories/${ancestor.id}`} className="hover:text-[--primary] transition-colors">
                  {ancestor.name_ar}
                </Link>
              </React.Fragment>
            ))}
            <span className="text-[--border]">/</span>
            <span className="text-[--foreground] font-medium">{initialCategory.name_ar}</span>
          </nav>
          <h1 className="text-2xl font-bold text-[--foreground] flex items-center gap-2">
            {initialCategory.name_ar}
            <span className="text-xs bg-[--primary] text-[--primary-foreground] px-2 py-1 rounded-full font-medium">
              {NODE_TYPES.find(n => n.value === nodeType)?.label || nodeType}
            </span>
          </h1>
          <p className="text-sm text-[--foreground-muted] mt-1">إدارة بيانات العقدة في شجرة التصنيف والخصائص المرتبطة</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href="/" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-[--border] bg-[--background-elevated] hover:bg-[--accent] text-[--foreground] rounded-md transition-colors font-medium">
            <ArrowRight size={18} />
            العودة للشجرة
          </Link>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[--primary] text-[--primary-foreground] rounded-md transition-colors font-medium disabled:opacity-50"
          >
            <Save size={18} />
            {isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[--destructive]/10 border border-[--destructive]/20 text-[--destructive] rounded-md">
          {typeof error === 'string' ? error : 'حدث خطأ في المدخلات. يرجى التحقق من البيانات.'}
        </div>
      )}

      {/* Node metadata */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold border-b border-[--border] pb-2">معلومات العقدة في الشجرة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 rounded-lg border border-[--border] bg-[--background-elevated] p-4">
          <div className="space-y-1"><p className="text-xs text-[--foreground-muted]">المعرّف الثابت (UUID)</p><p dir="ltr" className="break-all text-sm font-mono">{initialCategory.database_id ?? initialCategory.id}</p></div>
          <div className="space-y-1">
            <p className="text-xs text-[--foreground-muted]">العقدة الأب الحالية</p>
            <p className="text-sm font-medium">
              {nodeType === 'department' || !parentId
                ? 'عقدة جذرية (قسم رئيسي)'
                : allCategories?.find((c) => c.id === parentId)?.name_ar || ancestors[ancestors.length - 1]?.name_ar || 'غير محدد'}
            </p>
          </div>
          <div className="space-y-1"><p className="text-xs text-[--foreground-muted]">المستوى (يُحتسب تلقائياً)</p><p className="text-sm">{ancestors.length} — يبدأ الجذر من 0</p></div>
          <div className="space-y-1 sm:col-span-2"><p className="text-xs text-[--foreground-muted]">المسار الكامل</p><p className="text-sm leading-6">{[...ancestors.map((node) => node.name_ar), initialCategory.name_ar].join(' / ')}</p></div>
          <div className="space-y-1"><p className="text-xs text-[--foreground-muted]">الحالة</p><p className="text-sm">نشط</p></div>
          <div className="space-y-1"><p className="text-xs text-[--foreground-muted]">ترتيب العرض</p><p className="text-sm">{initialCategory.sort_order ?? 'يُحدّد من ترتيب الشجرة'}</p></div>
        </div>
      </section>

      {/* Sections */}
      <div className="space-y-8">
        {/* General Info & Media */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-[--border] pb-2">معلومات الفئة والصورة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[--background-elevated] p-6 rounded-lg border border-[--border]">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[--foreground]">اسم الفئة (عربي) *</label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full p-2 border border-[--border] rounded-md bg-[--background] text-[--foreground]"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[--foreground]">اسم الفئة (إنجليزي)</label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full p-2 border border-[--border] rounded-md bg-[--background] text-[--foreground] text-left"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[--foreground]">الوصف</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="وصف مختصر يوضح نطاق هذه العقدة وما يميزها..."
                  className="w-full p-2 border border-[--border] rounded-md bg-[--background] text-[--foreground] resize-y"
                />
                <p className="text-xs text-[--foreground-muted]">اختياري، بحد أقصى 2000 حرف.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[--foreground]">الرابط (Slug)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full p-2 border border-[--border] rounded-md bg-[--background] text-[--foreground] text-left"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[--foreground]">نوع الفئة (Node Type)</label>
                <select
                  value={nodeType}
                  onChange={(e) => handleNodeTypeChange(e.target.value as Category['node_type'])}
                  className="w-full p-2 border border-[--border] rounded-md bg-[--background] text-[--foreground]"
                >
                  {NODE_TYPES.map(n => (
                    <option key={n.value} value={n.value}>{n.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[--foreground]">العقدة الأب (الفئة الأصل)</label>
                {nodeType === 'department' ? (
                  <div className="p-2.5 border border-dashed border-[--border] rounded-md bg-[--background-muted] text-xs text-[--foreground-muted]">
                    القسم الرئيسي (Department) هو جذر الشجرة ولا يمتلك فئة أصل.
                  </div>
                ) : (
                  <select
                    value={parentId || ''}
                    onChange={(e) => setParentId(e.target.value === '' ? null : e.target.value)}
                    className="w-full p-2 border border-[--border] rounded-md bg-[--background] text-[--foreground]"
                    required
                  >
                    <option value="" disabled>-- اختر الفئة الأصل --</option>
                    {validParentOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name_ar} ({opt.typeLabel})
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-[--foreground-muted]">
                  {nodeType === 'category' && 'التصنيف يجب أن يتبع لقسم رئيسي (Department).'}
                  {nodeType === 'subcategory' && 'التصنيف الفرعي يجب أن يتبع لتصنيف (Category).'}
                  {nodeType === 'product_type' && 'نوع المنتج يمكن أن يتبع لتصنيف (Category) أو تصنيف فرعي (Subcategory).'}
                </p>
              </div>
            </div>

            {/* Media / Image */}
            <div className="space-y-2 h-full flex flex-col">
              <label className="text-sm font-medium text-[--foreground]">صورة الفئة (Image URL)</label>
              <div className="flex-1 flex items-start">
                <ImageUploadDropzone 
                  value={image} 
                  onChange={setImage} 
                  slug={slug || undefined}
                />
              </div>
              <p className="text-xs text-[--foreground-muted] mt-2">
                يتم رفع وتخزين الصور تلقائياً وبشكل دائم في Supabase Storage (صيغ مدعومة: WebP, PNG, JPG بحد أقصى 5 ميجابايت).
              </p>
            </div>
          </div>
        </section>

        {/* Product Type is the schema boundary for attribute bindings. */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-[--border] pb-2">ربط الخصائص والمواصفات</h2>
          {nodeType === 'product_type' ? (
            <AttributeBindingSection
              boundAttributes={boundAttributes}
              globalAttributes={globalAttributes}
              taxonomyNodeId={initialCategory.database_id ?? ''}
              routeId={initialCategory.id}
              options={productTypeEditorOptions}
              onAdd={handleAddAttribute}
              onUpdate={handleUpdateAttribute}
              onRemove={handleRemoveAttribute}
              onMove={handleMoveAttribute}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-[--border] p-5 text-sm leading-7 text-[--foreground-muted]">
              تُربط السمات بنوع المنتج فقط. غيّر نوع هذه العقدة إلى «نوع منتج (Product Type)» لإدارة مخطط السمات.
              إذا حُفظت العقدة بنوع آخر، فستُزال روابط السمات الخاصة بها.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
