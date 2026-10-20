import { readCategories } from '@/lib/data/categories';
import { TaxonomyManagementClient } from '@/components/taxonomy/TaxonomyManagementClient';

export const dynamic = 'force-dynamic';

export default async function TaxonomyManagementPage() {
  const categories = await readCategories();
  return <main className="mx-auto min-h-screen max-w-7xl space-y-6 px-4 py-8 pb-24 md:px-8"><div><p className="text-sm font-medium text-primary">إدارة الكتالوج</p><h1 className="mt-1 text-2xl font-bold md:text-3xl">جميع التصنيفات وأنواع المنتجات</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">قائمة موحدة لكل عقد الشجرة. افتح أي سجل لمراجعة بياناته، أما Product Type فيتيح لك إدارة الخصائص المرتبطة به.</p></div><TaxonomyManagementClient categories={categories} /></main>;
}
