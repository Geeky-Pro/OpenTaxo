'use client';

import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronLeft, 
  Maximize2, 
  Settings2,
  FolderTree,
  Folder,
  Layers,
  Box,
  Plus
} from 'lucide-react';
import type { CategoryTreeNode } from '@/lib/utils/tree';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types/category';

interface TreeNodeItemProps {
  node: CategoryTreeNode;
  searchQuery: string;
  isGloballyExpanded: boolean;
  onFocusChange: (id: string) => void;
  onEdit: (node: Category) => void;
  onAddChild: (parentId: string) => void;
  level?: number;
}

export function TreeNodeItem({ 
  node, 
  searchQuery, 
  isGloballyExpanded,
  onFocusChange,
  onEdit,
  onAddChild,
  level = 0 
}: TreeNodeItemProps) {
  const defaultExpanded = searchQuery.length > 0 ? true : isGloballyExpanded;
  const [isExpandedLocal, setIsExpandedLocal] = useState<boolean | null>(null);

  const isExpanded = isExpandedLocal !== null ? isExpandedLocal : defaultExpanded;
  const hasChildren = node.children && node.children.length > 0;

  const toggleExpand = () => setIsExpandedLocal(!isExpanded);

  const typeConfig = {
    department: { icon: FolderTree, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', label: 'قسم رئيسي' },
    category: { icon: Folder, color: 'text-slate-500 bg-slate-500/10 border-slate-500/20', label: 'تصنيف' },
    subcategory: { icon: Layers, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', label: 'فرعي' },
    product_type: { icon: Box, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', label: 'نوع منتج' },
  };

  const config = typeConfig[node.node_type] || typeConfig.category;
  const Icon = config.icon;

  return (
    <div className="flex flex-col">
      <div 
        className={cn(
          "group flex items-center gap-2 py-2 pr-2 pl-3 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border/50",
          level > 0 && "relative before:absolute before:-right-3 before:top-1/2 before:w-3 before:h-px before:bg-border/50"
        )}
      >
        <div className="w-6 flex items-center justify-center shrink-0">
          {hasChildren ? (
            <button
              onClick={toggleExpand}
              className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              aria-label={isExpanded ? "طي" : "توسيع"}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-4 h-4" />
          )}
        </div>

        <div className="flex flex-1 items-center gap-3 min-w-0">
          <div className={cn("flex items-center justify-center w-8 h-8 rounded-md shrink-0 border", config.color)}>
            <Icon className="w-4 h-4" />
          </div>
          
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate">{node.name_ar}</span>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border whitespace-nowrap hidden sm:inline-flex", config.color)}>
                {config.label}
              </span>
            </div>
            {node.name_en && (
              <span className="text-xs text-muted-foreground truncate font-sans" dir="ltr">{node.name_en}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground mr-4">
            {hasChildren && <span className="bg-secondary px-1.5 py-0.5 rounded">{node.children.length} فروع</span>}
            {node.attributes && node.attributes.length > 0 && <span className="bg-secondary px-1.5 py-0.5 rounded">{node.attributes.length} خصائص</span>}
          </div>

          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity focus-within:opacity-100">
            {node.node_type !== 'product_type' && (
              <button
                onClick={() => onAddChild(node.id)}
                className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
                title="إضافة فرع جديد"
                aria-label={`إضافة فرع تحت ${node.name_ar}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            )}

            {hasChildren && (
              <button
                onClick={() => onFocusChange(node.id)}
                className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
                title="تركيز (Focus Mode)"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
            
            <button 
              onClick={() => onEdit(node)}
              className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md" 
              title="تعديل"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="flex flex-col relative mr-4 pr-3 mt-1 space-y-1">
          <div className="absolute right-0 top-0 bottom-4 w-px bg-border/50" />
          {node.children.map(child => (
            <TreeNodeItem
              key={child.id}
              node={child}
              searchQuery={searchQuery}
              isGloballyExpanded={isGloballyExpanded}
              onFocusChange={onFocusChange}
              onEdit={onEdit}
              onAddChild={onAddChild}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
