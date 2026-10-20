'use client';

import { ChevronLeft, Home } from 'lucide-react';
import type { Category } from '@/lib/types/category';
import { getAncestors } from '@/lib/utils/tree';

interface TreeBreadcrumbsProps {
  focusedNodeId: string | null;
  categories: Category[];
  onFocusChange: (id: string | null) => void;
}

export function TreeBreadcrumbs({ focusedNodeId, categories, onFocusChange }: TreeBreadcrumbsProps) {
  if (!focusedNodeId) return null;

  const target = categories.find((c) => c.id === focusedNodeId);
  const ancestors = getAncestors(focusedNodeId, categories);

  return (
    <div className="flex flex-wrap items-center gap-1 mb-4 p-3 bg-secondary/50 rounded-lg text-sm text-muted-foreground border">
      <button
        onClick={() => onFocusChange(null)}
        className="flex items-center gap-1 hover:text-foreground transition-colors p-1 rounded hover:bg-secondary"
      >
        <Home className="w-4 h-4" />
        <span>الشجرة الكاملة</span>
      </button>

      {ancestors.map((ancestor) => (
        <div key={ancestor.id} className="flex items-center gap-1">
          <ChevronLeft className="w-4 h-4 opacity-50" />
          <button
            onClick={() => onFocusChange(ancestor.id)}
            className="hover:text-foreground transition-colors p-1 rounded hover:bg-secondary truncate max-w-[100px] sm:max-w-[150px]"
          >
            {ancestor.name_ar}
          </button>
        </div>
      ))}

      {target && (
        <div className="flex items-center gap-1">
          <ChevronLeft className="w-4 h-4 opacity-50" />
          <span className="font-medium text-foreground p-1 truncate max-w-[120px] sm:max-w-[200px]">
            {target.name_ar}
          </span>
        </div>
      )}
    </div>
  );
}
