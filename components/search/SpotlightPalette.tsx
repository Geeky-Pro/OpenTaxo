'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { Command } from 'cmdk';
import { Search, Folder, FolderTree, Tag, Package, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSearchData } from '@/app/actions/search-actions';
import { getCategoryPath } from '@/lib/utils/tree';
import type { Category } from '@/lib/types/category';
import type { Attribute } from '@/lib/types/attribute';

export function useSpotlight() {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((o) => !o);
  return { open, setOpen, toggle };
}

export default function SpotlightPalette() {
  const { open, setOpen } = useSpotlight();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [isPending, startTransition] = useTransition();
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    
    const onCustomOpen = () => setOpen(true);
    
    document.addEventListener('keydown', down);
    document.addEventListener('open-spotlight', onCustomOpen);
    
    return () => {
      document.removeEventListener('keydown', down);
      document.removeEventListener('open-spotlight', onCustomOpen);
    };
  }, [setOpen]);

  useEffect(() => {
    if (open && !dataLoaded) {
      startTransition(async () => {
        const { categories: fetchedCategories, attributes: fetchedAttributes } = await getSearchData();
        setCategories(fetchedCategories);
        setAttributes(fetchedAttributes);
        setDataLoaded(true);
      });
    }
  }, [open, dataLoaded]);

  const handleSelectCategory = (id: string) => {
    setOpen(false);
    router.push(`/categories/${id}`);
  };

  const handleSelectAttribute = (id: string) => {
    setOpen(false);
    router.push(`/attributes`);
  };

  const getNodeIconComponent = (type?: string) => {
    switch (type) {
      case 'department': return Layers;
      case 'subcategory': return FolderTree;
      case 'product_type': return Package;
      case 'category':
      default: return Folder;
    }
  };

  const getNodeColorClass = (type?: string) => {
    switch (type) {
      case 'department': return 'from-blue-500/10 to-blue-500/5 text-blue-500 border border-blue-500/20';
      case 'subcategory': return 'from-amber-500/10 to-amber-500/5 text-amber-500 border border-amber-500/20';
      case 'product_type': return 'from-emerald-500/10 to-emerald-500/5 text-emerald-500 border border-emerald-500/20';
      case 'category':
      default: return 'from-slate-500/10 to-slate-500/5 text-slate-500 border border-slate-500/20';
    }
  };

  const getNodeTypeLabel = (type?: string) => {
    switch (type) {
      case 'department': return 'قسم';
      case 'subcategory': return 'فئة فرعية';
      case 'product_type': return 'نوع منتج';
      case 'category':
      default: return 'فئة';
    }
  };

  // Add styles needed for cmdk dialog overlay/content directly if not set globally
  return (
    <Command.Dialog 
      open={open} 
      onOpenChange={setOpen} 
      label="البحث العام"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-background/40 backdrop-blur-md transition-all duration-300"
    >
      <div 
        className="relative z-50 w-full max-w-2xl bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        dir="rtl"
      >
        <div className="flex items-center px-4 border-b border-[--border]">
          <Search className="text-[--foreground-muted] ml-3" size={20} />
          <Command.Input 
            placeholder="ابحث عن تصنيف، نوع منتج، أو خاصية..."
            className="flex-1 py-4 bg-transparent outline-none placeholder:text-[--foreground-muted]" 
          />
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          {isPending && !dataLoaded && <Command.Loading><div className="p-4 text-center text-sm text-[--foreground-muted]">جاري التحميل...</div></Command.Loading>}
          
          {dataLoaded && (
            <Command.Empty className="py-6 text-center text-sm text-[--foreground-muted]">
              لا توجد نتائج مطابقة لبحثك.
            </Command.Empty>
          )}

          {dataLoaded && categories.length > 0 && (
            <Command.Group heading="التصنيفات والمنتجات" className="px-2 py-2 [&>[cmdk-group-heading]]:text-xs [&>[cmdk-group-heading]]:font-semibold [&>[cmdk-group-heading]]:text-[--foreground-muted] [&>[cmdk-group-heading]]:mb-2">
              {categories.map((cat) => {
                const path = getCategoryPath(cat.id, categories);
                const Icon = getNodeIconComponent(cat.node_type);
                const colorClass = getNodeColorClass(cat.node_type);
                return (
                  <Command.Item
                    key={cat.id}
                    value={`${cat.name_ar} ${cat.name_en || ''} ${getNodeTypeLabel(cat.node_type)}`}
                    onSelect={() => handleSelectCategory(cat.id)}
                    className="group flex flex-col p-3 rounded-xl hover:bg-muted/50 aria-selected:bg-muted/80 cursor-pointer transition-all duration-200 my-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br shadow-sm ${colorClass}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{cat.name_ar}</h4>
                        {cat.name_en && (
                          <p className="text-xs text-muted-foreground font-sans mt-0.5" dir="ltr">{cat.name_en}</p>
                        )}
                      </div>
                    </div>
                    {path && (
                      <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <span className="font-medium">{getNodeTypeLabel(cat.node_type)}</span>
                        <span>•</span>
                        <span>{path}</span>
                      </div>
                    )}
                  </Command.Item>
                );
              })}
            </Command.Group>
          )}

          {dataLoaded && attributes.length > 0 && (
            <Command.Group heading="مستودع الخصائص" className="px-2 py-2 border-t border-[--border] mt-2 [&>[cmdk-group-heading]]:text-xs [&>[cmdk-group-heading]]:font-semibold [&>[cmdk-group-heading]]:text-[--foreground-muted] [&>[cmdk-group-heading]]:mb-2">
              {attributes.map((attr) => (
                <Command.Item
                  key={attr.id}
                  value={`${attr.name_ar} ${attr.name_en || ''} ${attr.filter_type}`}
                  onSelect={() => handleSelectAttribute(attr.id)}
                  className="group flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 aria-selected:bg-muted/80 cursor-pointer transition-all duration-200 my-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-indigo-500 shadow-sm border border-indigo-500/20">
                      <Tag size={16} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{attr.name_ar}</h4>
                      {attr.name_en && (
                        <p className="text-xs text-muted-foreground font-sans mt-0.5" dir="ltr">{attr.name_en}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity">
                      خاصية
                    </span>
                    {attr.filter_type && (
                      <span className="text-[10px] bg-muted border border-border text-muted-foreground px-2 py-0.5 rounded-full">
                        {attr.filter_type}
                      </span>
                    )}
                    {attr.unit && (
                      <span className="text-[10px] bg-muted border border-border text-muted-foreground px-2 py-0.5 rounded-full">
                        {attr.unit}
                      </span>
                    )}
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
