'use client';

import { useState, useEffect } from 'react';
import type { Category } from '@/lib/types/category';
import { StoreCategoryGrid } from './StoreCategoryGrid';
import { QuickEditDrawer } from '../drawer/QuickEditDrawer';

interface BrowseClientProps {
  categories: Category[];
  allCategories: Category[];
  parentId: string | null;
}

export function BrowseClient({ categories, allCategories, parentId }: BrowseClientProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerParentId, setDrawerParentId] = useState<string | null>(parentId);

  useEffect(() => {
    // When parentId prop changes (navigating between categories), update the default
    setDrawerParentId(parentId);
  }, [parentId]);

  useEffect(() => {
    const handleOpenNewCategory = () => {
      // If triggered from global nav, we default to adding at the current viewed level
      setDrawerParentId(parentId);
      setIsDrawerOpen(true);
    };
    window.addEventListener('open-new-category', handleOpenNewCategory);
    return () => {
      window.removeEventListener('open-new-category', handleOpenNewCategory);
    };
  }, [parentId]);

  return (
    <>
      <StoreCategoryGrid 
        categories={categories} 
        allCategories={allCategories} 
        onAddClick={() => {
          setDrawerParentId(parentId);
          setIsDrawerOpen(true);
        }}
      />
      <QuickEditDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        parentIdForNew={drawerParentId}
        categories={allCategories}
      />
    </>
  );
}
