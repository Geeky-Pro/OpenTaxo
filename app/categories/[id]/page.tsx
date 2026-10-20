import { notFound } from 'next/navigation';
import { getCategoryWithAttributes } from '@/lib/actions/category-details';
import { readAttributes } from '@/lib/data/attributes';
import { readCategories } from '@/lib/data/categories';
import { readProductTypeEditorOptions } from '@/lib/data/product-type-editor';
import { getAncestors } from '@/lib/utils/tree';
import CategoryDetailClient from '@/components/category-details/CategoryDetailClient';

export default async function CategoryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const categoryWithAttributes = await getCategoryWithAttributes(id);
  
  if (!categoryWithAttributes) {
    notFound();
  }
  
  const [allGlobalAttributes, productTypeEditorOptions] = await Promise.all([
    readAttributes(),
    readProductTypeEditorOptions(),
  ]);
  const allCategories = await readCategories();
  const ancestors = getAncestors(id, allCategories);
  
  return (
    <div className="min-h-screen bg-[--background] pb-24 md:pb-8 pt-14 md:pt-14">
      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <CategoryDetailClient 
          initialCategory={categoryWithAttributes} 
          globalAttributes={allGlobalAttributes}
          productTypeEditorOptions={productTypeEditorOptions}
          ancestors={ancestors}
          allCategories={allCategories}
        />
      </main>
    </div>
  );
}
