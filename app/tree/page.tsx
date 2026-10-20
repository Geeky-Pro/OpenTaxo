import { readCategories } from '@/lib/data/categories';
import { TreeContainer } from '@/components/tree/TreeContainer';

export const dynamic = 'force-dynamic';

export default async function TaxonomyTreePage() {
  const categories = await readCategories();
  return <div className="min-h-[calc(100vh-4rem)] mx-auto max-w-7xl p-2 md:p-4 lg:p-6"><TreeContainer categories={categories} /></div>;
}
