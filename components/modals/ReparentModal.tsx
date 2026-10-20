'use client';

import { useState, useTransition, useMemo } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import type { Category } from '@/lib/types/category';
import { reparentCategory } from '@/lib/actions/categories';
import { getForbiddenParentIds, buildTree, validateReparent } from '@/lib/utils/tree';
import { cn } from '@/lib/utils';

interface ReparentModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
  categories: Category[];
  onSuccess: () => void;
}

export function ReparentModal({ isOpen, onClose, category, categories, onSuccess }: ReparentModalProps) {
  const [newParentId, setNewParentId] = useState<string | null>(category.parent_id);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const forbiddenIds = useMemo(() => getForbiddenParentIds(category.id, categories), [category.id, categories]);

  // Flatten the tree sequentially for the dropdown with visual indentations
  const dropdownOptions = useMemo(() => {
    const tree = buildTree(categories);
    const options: { id: string; name: string; depth: number; disabled: boolean }[] = [];
    
    function traverse(nodes: any[], currentDepth: number) {
      for (const node of nodes) {
        options.push({
          id: node.id,
          name: node.name_ar,
          depth: currentDepth,
          disabled: forbiddenIds.has(node.id) || !validateReparent(category.id, node.id, categories).valid,
        });
        if (node.children) {
          traverse(node.children, currentDepth + 1);
        }
      }
    }
    
    traverse(tree, 0);
    return options;
  }, [categories, forbiddenIds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newParentId === category.parent_id) {
      onClose();
      return;
    }

    if (newParentId && forbiddenIds.has(newParentId)) {
      setError('لا يمكن نقل العنصر ليكون تحت أحد فروعه أو نفسه');
      return;
    }

    startTransition(async () => {
      const result = await reparentCategory(category.id, newParentId);
      if (result.success) {
        onSuccess();
      } else {
        setError(typeof result.error === 'string' ? result.error : 'خطأ أثناء تغيير التبعية');
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-card w-full max-w-md rounded-xl shadow-lg border p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">تغيير الأب (نقل التبعية)</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          نقل <span className="font-bold text-foreground">{category.name_ar}</span> إلى قسم أو تصنيف آخر.
        </p>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form id="reparent-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">الوجهة الجديدة</label>
            <select
              value={newParentId || ''}
              onChange={(e) => setNewParentId(e.target.value === '' ? null : e.target.value)}
              className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="" disabled={category.node_type !== 'department'}>-- كقسم رئيسي (بدون أب) --</option>
              {dropdownOptions.map(opt => (
                <option 
                  key={opt.id} 
                  value={opt.id} 
                  disabled={opt.disabled}
                >
                  {'\u00A0'.repeat(opt.depth * 4)}{opt.disabled ? '🚫 ' : ''}{opt.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-2">
              الخيارات المعطلة تخالف قواعد التدرج، أو تسبب دورة في الشجرة، أو تمثل نوع منتج نهائي.
            </p>
          </div>
        </form>

        <div className="flex justify-end gap-3 mt-2">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md hover:bg-secondary transition-colors text-sm font-medium"
          >
            إلغاء
          </button>
          <button 
            type="submit"
            form="reparent-form"
            disabled={isPending}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>
    </div>
  );
}
