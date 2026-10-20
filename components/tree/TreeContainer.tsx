'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, FolderTree, X, Plus } from 'lucide-react';
import type { Category } from '@/lib/types/category';
import { buildTree, filterTree, CategoryTreeNode } from '@/lib/utils/tree';
import { TreeNodeItem } from './TreeNodeItem';
import { TreeBreadcrumbs } from './TreeBreadcrumbs';
import { QuickEditDrawer } from '../drawer/QuickEditDrawer';

interface TreeContainerProps {
  categories: Category[];
}

export function TreeContainer({ categories }: TreeContainerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isGloballyExpanded, setIsGloballyExpanded] = useState(false);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerCategory, setDrawerCategory] = useState<Category | null>(null);
  const [drawerParentId, setDrawerParentId] = useState<string | null>(null);

  const fullTree = useMemo(() => buildTree(categories), [categories]);

  const focusedTree = useMemo(() => {
    if (!focusedNodeId) return fullTree;
    
    let foundNode: CategoryTreeNode | null = null;
    const queue = [...fullTree];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.id === focusedNodeId) {
        foundNode = current;
        break;
      }
      if (current.children) {
        queue.push(...current.children);
      }
    }
    
    return foundNode ? foundNode.children : [];
  }, [fullTree, focusedNodeId]);

  const visibleTree = useMemo(() => {
    return filterTree(focusedTree, searchQuery);
  }, [focusedTree, searchQuery]);

  const handleEdit = (category: Category) => {
    setDrawerCategory(category);
    setDrawerParentId(null);
    setIsDrawerOpen(true);
  };

  const handleAddChild = (parentId: string) => {
    setDrawerCategory(null);
    setDrawerParentId(parentId);
    setIsDrawerOpen(true);
  };

  const handleAddRoot = () => {
    setDrawerCategory(null);
    setDrawerParentId(null);
    setIsDrawerOpen(true);
  };

  useEffect(() => {
    const handleOpenNewCategory = () => {
      handleAddRoot();
    };
    window.addEventListener('open-new-category', handleOpenNewCategory);
    return () => {
      window.removeEventListener('open-new-category', handleOpenNewCategory);
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-background rounded-xl border shadow-sm relative">
      <div className="p-4 border-b bg-card space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-primary" />
            شجرة التصنيفات
          </h2>
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={handleAddRoot}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              إضافة قسم رئيسي
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="تصفية الشجرة محلياً..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pr-9 pl-9 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-0.5 rounded-sm text-muted-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGloballyExpanded(true)}
              className="px-3 h-10 text-sm bg-secondary hover:bg-secondary/80 rounded-md font-medium transition-colors whitespace-nowrap"
            >
              توسيع الكل
            </button>
            <button
              onClick={() => setIsGloballyExpanded(false)}
              className="px-3 h-10 text-sm bg-secondary hover:bg-secondary/80 rounded-md font-medium transition-colors whitespace-nowrap"
            >
              طي الكل
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 bg-card/30">
        <TreeBreadcrumbs 
          focusedNodeId={focusedNodeId}
          categories={categories}
          onFocusChange={setFocusedNodeId}
        />

        <div className="flex flex-col space-y-1">
          {visibleTree.length > 0 ? (
            visibleTree.map(node => (
              <TreeNodeItem
                key={node.id}
                node={node}
                searchQuery={searchQuery}
                isGloballyExpanded={isGloballyExpanded}
                onFocusChange={setFocusedNodeId}
                onEdit={handleEdit}
                onAddChild={handleAddChild}
                level={0}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FolderTree className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-1">
                {searchQuery ? 'لا توجد نتائج' : 'الشجرة فارغة'}
              </h3>
              <p className="text-muted-foreground text-sm max-w-sm mb-4">
                {searchQuery 
                  ? 'لم يتم العثور على تصنيفات تطابق بحثك. جرب كلمات مفتاحية أخرى.'
                  : 'لم يتم إضافة أي تصنيفات بعد. يمكنك البدء بإضافة قسم رئيسي جديد.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleAddRoot}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  إضافة قسم رئيسي
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <QuickEditDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        category={drawerCategory}
        parentIdForNew={drawerParentId}
        categories={categories}
      />
    </div>
  );
}
