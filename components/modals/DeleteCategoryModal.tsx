'use client';

import { useTransition, useMemo, useState } from 'react';
import { X, Trash2, AlertTriangle, FolderTree, Link2 } from 'lucide-react';
import type { Category } from '@/lib/types/category';
import { deleteCategory } from '@/lib/actions/categories';

interface DeleteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
  categories: Category[];
  onSuccess: () => void;
}

export function DeleteCategoryModal({ isOpen, onClose, category, categories, onSuccess }: DeleteCategoryModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const childCount = useMemo(
    () => categories.filter((item) => item.parent_id === category.id).length,
    [category.id, categories],
  );
  const linkedAttributeCount = category.attributes?.length ?? 0;
  const deletionBlocked = childCount > 0 || linkedAttributeCount > 0;

  const handleDelete = () => {
    if (deletionBlocked) {
      setError('لا يمكن حذف التصنيف قبل نقل التصنيفات الفرعية أو إزالة ارتباطات الخصائص.');
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deleteCategory(category.id);
      if (result.success) {
        onSuccess();
      } else {
        setError(typeof result.error === 'string' ? result.error : 'خطأ أثناء الحذف');
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-category-title">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card w-full max-w-md rounded-xl shadow-lg border p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h2 id="delete-category-title" className="text-lg font-bold text-destructive flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            تأكيد حذف التصنيف
          </h2>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg space-y-3">
          <p className="font-semibold text-foreground">
            هل أنت متأكد من حذف «{category.name_ar}»؟
          </p>
          <p className="text-sm text-muted-foreground">
            سيتم أرشفة هذا التصنيف فقط. لن تُحذف التصنيفات الفرعية تلقائياً.
          </p>

          {childCount > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-background p-3 text-sm">
              <FolderTree className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
              <span>يحتوي على {childCount} تصنيف فرعي. انقل هذه التصنيفات إلى أب آخر أو احذفها أولاً.</span>
            </div>
          )}

          {linkedAttributeCount > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-background p-3 text-sm">
              <Link2 className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
              <span>مرتبط بـ {linkedAttributeCount} خاصية. أزل ارتباطات الخصائص أولاً لحماية إعدادات نوع المنتج.</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {deletionBlocked
              ? 'الحذف معطّل حتى تُعالج الارتباطات الموضحة أعلاه.'
              : 'يمكنك إلغاء العملية الآن؛ وعند التأكيد سيُؤرشف التصنيف ولن يظهر ضمن التصنيفات النشطة.'}
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border hover:bg-secondary transition-colors text-sm font-medium"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending || deletionBlocked}
            className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors text-sm font-medium flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {isPending ? 'جاري الأرشفة...' : 'تأكيد الأرشفة'}
          </button>
        </div>
      </div>
    </div>
  );
}
