'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpLeft, Box, Folder, FolderTree, Layers, Search, SlidersHorizontal, Tags, Plus } from 'lucide-react';
import { QuickEditDrawer } from '@/components/drawer/QuickEditDrawer';
import type { Category } from '@/lib/types/category';
import { getAncestors } from '@/lib/utils/tree';

const typeLabels: Record<Category['node_type'], string> = { department: 'قسم رئيسي', category: 'فئة', subcategory: 'فئة فرعية', product_type: 'Product Type' };
const typeIcons = { department: Layers, category: Folder, subcategory: FolderTree, product_type: Box };

export function TaxonomyManagementClient({ categories }: { categories: Category[] }) {
  const [query, setQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return categories.filter((node) => {
      const matchesType = typeFilter === 'all' || node.node_type === typeFilter;
      const parent = categories.find((candidate) => candidate.id === node.parent_id);
      const haystack = [node.name_ar, node.name_en ?? '', node.slug, node.description ?? '', parent?.name_ar ?? ''].join(' ').toLocaleLowerCase();
      return matchesType && (!normalized || haystack.includes(normalized));
    });
  }, [categories, query, typeFilter]);
  const counts = useMemo(() => ({ all: categories.length, product_type: categories.filter((node) => node.node_type === 'product_type').length, department: categories.filter((node) => node.node_type === 'department').length }), [categories]);

  return <section className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">يمكنك فتح أي سجل للتعديل الشامل أو الانتقال إلى الشجرة لإدارة العلاقات.</p><button type="button" onClick={() => setIsCreateOpen(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"><Plus className="h-4 w-4" /> إضافة تصنيف</button></div>
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl border bg-background p-3"><p className="text-xs text-muted-foreground">كل العقد</p><p className="mt-1 text-xl font-bold">{counts.all}</p></div>
      <div className="rounded-xl border bg-background p-3"><p className="text-xs text-muted-foreground">Product Type</p><p className="mt-1 text-xl font-bold">{counts.product_type}</p></div>
      <div className="rounded-xl border bg-background p-3"><p className="text-xs text-muted-foreground">الأقسام الرئيسية</p><p className="mt-1 text-xl font-bold">{counts.department}</p></div>
    </div>
    <div className="flex flex-col gap-3 rounded-2xl border bg-background p-4 md:flex-row">
      <label className="relative flex-1"><span className="sr-only">البحث في التصنيفات</span><Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالاسم أو الرابط أو الوصف أو القسم الأب..." className="h-11 w-full rounded-lg border bg-background pe-10 ps-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></label>
      <label className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-muted-foreground" /><span className="sr-only">نوع العقدة</span><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-11 min-w-44 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"><option value="all">كل الأنواع</option><option value="department">قسم رئيسي</option><option value="category">فئة</option><option value="subcategory">فئة فرعية</option><option value="product_type">Product Type</option></select></label>
      <Link href="/tree" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-muted"><FolderTree className="h-4 w-4" /> عرض الشجرة</Link>
    </div>
    <div className="overflow-hidden rounded-2xl border bg-background">
      <div className="flex items-center justify-between border-b px-4 py-3"><h2 className="font-semibold">سجلات التصنيف</h2><span className="text-xs text-muted-foreground">عرض {filtered.length} من {categories.length}</span></div>
      {filtered.length ? <div className="divide-y">{filtered.map((node) => {
        const Icon = typeIcons[node.node_type];
        const ancestors = getAncestors(node.id, categories);
        const path = [...ancestors.map((ancestor) => ancestor.name_ar), node.name_ar].join(' / ');
        const parent = ancestors[ancestors.length - 1];
        return <article key={node.id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3"><span className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{node.name_ar}</h3><span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{typeLabels[node.node_type]}</span>{node.node_type === 'product_type' && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">{node.attributes.length} خصائص</span>}</div>{node.name_en && <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">{node.name_en}</p>}<p className="mt-1 truncate text-xs text-muted-foreground" title={path}>{path}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground"><span>الأب: {parent?.name_ar ?? '—'}</span><span>المستوى: {ancestors.length}</span>{typeof node.sort_order === 'number' && <span>الترتيب: {node.sort_order}</span>}</div>{node.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{node.description}</p>}</div></div>
          <div className="flex items-center gap-2 sm:shrink-0"><Link href={`/categories/${node.id}`} className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:border-primary/40 hover:bg-primary/5">{node.node_type === 'product_type' ? <><Tags className="h-4 w-4" /> إدارة الخصائص</> : <>التفاصيل</>}<ArrowUpLeft className="h-4 w-4" /></Link></div>
        </article>;
      })}</div> : <div className="px-4 py-14 text-center"><Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" /><p className="font-semibold">لا توجد نتائج مطابقة</p><p className="mt-1 text-sm text-muted-foreground">جرّب كلمة بحث أخرى أو غيّر نوع العقدة.</p></div>}
    </div>
    <QuickEditDrawer isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} parentIdForNew={null} categories={categories} />
  </section>;
}
