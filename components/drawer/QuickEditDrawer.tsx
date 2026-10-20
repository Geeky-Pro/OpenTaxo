'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types/category';
import { createCategory, updateCategory } from '@/lib/actions/categories';
import { getForbiddenParentIds } from '@/lib/utils/tree';
import { ReparentModal } from '../modals/ReparentModal';
import { DeleteCategoryModal } from '../modals/DeleteCategoryModal';
import { ImageUploadDropzone } from '../ui/ImageUploadDropzone';

function getDefaultNodeType(parentId: string | null, categories: Category[]): Category['node_type'] {
  if (!parentId) return 'department';
  const parent = categories.find((item) => item.id === parentId);
  if (!parent) return 'category';

  switch (parent.node_type) {
    case 'department':
      return 'category';
    case 'category':
      return 'subcategory';
    case 'subcategory':
    case 'product_type':
      return 'product_type';
  }
}
import Link from 'next/link';

interface QuickEditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  // If editing an existing category:
  category?: Category | null;
  // If creating a new child, this is the parent's ID
  parentIdForNew?: string | null;
  // The full list of categories for the modals to use
  categories: Category[];
}

export function QuickEditDrawer({ isOpen, onClose, category, parentIdForNew = null, categories }: QuickEditDrawerProps) {
  const isEditing = !!category;
  
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [nodeType, setNodeType] = useState<Category['node_type']>('category');
  const [parentId, setParentId] = useState<string | null>(category ? category.parent_id : parentIdForNew);
  const [image, setImage] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [showReparent, setShowReparent] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const forbiddenIds = useMemo(() => {
    return category ? getForbiddenParentIds(category.id, categories) : new Set<string>();
  }, [category, categories]);

  const validParentOptions = useMemo(() => {
    if (!categories?.length) return [];

    return categories
      .filter((cat) => {
        if (category && cat.id === category.id) return false;
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
  }, [categories, forbiddenIds, category, nodeType]);

  const handleNodeTypeChange = (newNodeType: Category['node_type']) => {
    setNodeType(newNodeType);
    if (newNodeType === 'department') {
      setParentId(null);
    } else if (categories?.length) {
      const currentParent = categories.find((c) => c.id === parentId);
      const isStillValid =
        currentParent &&
        ((newNodeType === 'category' && currentParent.node_type === 'department') ||
          (newNodeType === 'subcategory' && currentParent.node_type === 'category') ||
          (newNodeType === 'product_type' &&
            (currentParent.node_type === 'category' || currentParent.node_type === 'subcategory')));
      if (!isStillValid) {
        const firstValid = categories.find((c) => {
          if (category && c.id === category.id) return false;
          if (forbiddenIds.has(c.id)) return false;
          if (newNodeType === 'category') return c.node_type === 'department';
          if (newNodeType === 'subcategory') return c.node_type === 'category';
          if (newNodeType === 'product_type') return c.node_type === 'category' || c.node_type === 'subcategory';
          return false;
        });
        setParentId(firstValid?.id || null);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (isEditing && category) {
        setNameAr(category.name_ar);
        setNameEn(category.name_en || '');
        setDescription(category.description || '');
        setSlug(category.slug || '');
        setNodeType(category.node_type);
        setParentId(category.parent_id);
        setImage(category.image || null);
      } else {
        setNameAr('');
        setNameEn('');
        setDescription('');
        setSlug('');
        const defaultType = getDefaultNodeType(parentIdForNew, categories);
        setNodeType(defaultType);
        setParentId(parentIdForNew);
        setImage(null);
      }
    }
  }, [isOpen, isEditing, category, parentIdForNew, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nameAr.trim()) {
      setError('الاسم بالعربية مطلوب');
      return;
    }

    startTransition(async () => {
      const data = {
        name_ar: nameAr,
        name_en: nameEn || undefined,
        description: description.trim(),
        slug: slug || undefined,
        node_type: nodeType,
        parent_id: nodeType === 'department' ? null : parentId,
        attributes: isEditing ? category.attributes : [],
        image,
      };

      let result;
      if (isEditing && category) {
        result = await updateCategory(category.id, data);
      } else {
        result = await createCategory(data);
      }

      if (result.success) {
        onClose();
      } else {
        setError(typeof result.error === 'string' ? result.error : 'خطأ في البيانات المُدخلة');
      }
    });
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm transition-all"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-[110] w-full sm:w-[400px] bg-background border-l shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform translate-x-0">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {isEditing ? 'تعديل سريع' : (parentIdForNew === null ? 'إضافة قسم رئيسي' : 'إضافة فئة جديدة')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <form id="quick-edit-form" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">الاسم بالعربية <span className="text-destructive">*</span></label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={e => setNameAr(e.target.value)}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="مثال: إلكترونيات"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الاسم بالإنجليزية (اختياري)</label>
              <input
                type="text"
                dir="ltr"
                value={nameEn}
                onChange={e => setNameEn(e.target.value)}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="e.g. Electronics"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الوصف (اختياري)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full p-3 rounded-md border bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="وصف مختصر للتصنيف أو نوع المنتج"
              />
              <p className="text-xs text-muted-foreground">حتى 2000 حرف.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الرابط (Slug) - اختياري</label>
              <input
                type="text"
                dir="ltr"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="يُنشأ تلقائياً إذا تُرك فارغاً"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">نوع الفئة</label>
              <select
                value={nodeType}
                onChange={(e) => handleNodeTypeChange(e.target.value as Category['node_type'])}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="department">قسم رئيسي (Department)</option>
                <option value="category">تصنيف (Category)</option>
                <option value="subcategory">تصنيف فرعي (Subcategory)</option>
                <option value="product_type">نوع منتج نهائي (Product Type)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">العقدة الأب (الفئة الأصل)</label>
              {nodeType === 'department' ? (
                <div className="p-2.5 border border-dashed rounded-md bg-muted/40 text-xs text-muted-foreground">
                  القسم الرئيسي (Department) هو جذر الشجرة ولا يمتلك فئة أصل.
                </div>
              ) : (
                <select
                  value={parentId || ''}
                  onChange={(e) => setParentId(e.target.value === '' ? null : e.target.value)}
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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
              <p className="text-xs text-muted-foreground">
                {nodeType === 'category' && 'التصنيف يجب أن يتبع لقسم رئيسي (Department).'}
                {nodeType === 'subcategory' && 'التصنيف الفرعي يجب أن يتبع لتصنيف (Category).'}
                {nodeType === 'product_type' && 'نوع المنتج يمكن أن يتبع لتصنيف (Category) أو تصنيف فرعي (Subcategory).'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">صورة التصنيف (اختياري)</label>
              <ImageUploadDropzone 
                value={image} 
                onChange={setImage} 
                slug={slug || undefined}
              />
            </div>
          </form>

          {/* Quick Actions (only for editing) */}
          {isEditing && category && (
            <div className="mt-8 space-y-3 pt-6 border-t">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">إجراءات سريعة</h3>
              
              <button 
                type="button"
                onClick={() => setShowReparent(true)}
                className="w-full text-right p-3 rounded-md border hover:bg-secondary hover:text-foreground active:scale-[0.98] transition-all duration-200 text-sm"
              >
                نقل التبعية (تغيير الأب)
              </button>
              
              <Link 
                href={`/categories/${category.id}`}
                className="block w-full text-right p-3 rounded-md border border-primary/20 text-primary hover:bg-primary/5 active:scale-[0.98] transition-all duration-200 text-sm"
              >
                تعديل متقدم والمواصفات الكاملة
              </Link>
              
              <button 
                type="button"
                onClick={() => setShowDelete(true)}
                className="w-full text-right p-3 rounded-md border border-destructive/20 text-destructive hover:bg-destructive/10 active:scale-[0.98] transition-all duration-200 text-sm"
              >
                حذف الفئة
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md hover:bg-secondary transition-colors text-sm font-medium"
          >
            إلغاء
          </button>
          <button 
            type="submit"
            form="quick-edit-form"
            disabled={isPending}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all duration-200 text-sm font-medium flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>

      {isEditing && category && showReparent && (
        <ReparentModal
          isOpen={showReparent}
          onClose={() => setShowReparent(false)}
          category={category}
          categories={categories}
          onSuccess={() => {
            setShowReparent(false);
            onClose();
          }}
        />
      )}

      {isEditing && category && showDelete && (
        <DeleteCategoryModal
          isOpen={showDelete}
          onClose={() => setShowDelete(false)}
          category={category}
          categories={categories}
          onSuccess={() => {
            setShowDelete(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
