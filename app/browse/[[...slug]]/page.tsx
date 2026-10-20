import { notFound } from 'next/navigation';
import Link from 'next/link';
import { readCategories } from '@/lib/data/categories';
import { readAttributes } from '@/lib/data/attributes';
import { buildTree, getCategoryPath, getAncestors } from '@/lib/utils/tree';
import { BrowseClient } from '@/components/browse/BrowseClient';
import { ProductBlueprint } from '@/components/browse/ProductBlueprint';
import { ChevronLeft, Home } from 'lucide-react';
import { Metadata } from 'next';
import type { Category } from '@/lib/types/category';

function findCategoryBySlugPath(slugPath: string[] | undefined, categories: Category[]): Category | null {
  if (!slugPath?.length) return null;
  const requestedPath = slugPath.join('/');
  return categories.find((category) => getCategoryPath(category.id, categories, '/', 'slug') === requestedPath) ?? null;
}

interface BrowsePageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export async function generateMetadata({ params }: BrowsePageProps): Promise<Metadata> {
  const categories = await readCategories();
  const resolvedParams = await params;
  if (!resolvedParams.slug || resolvedParams.slug.length === 0) {
    return { title: 'المتجر | جميع الأقسام' };
  }
  const target = findCategoryBySlugPath(resolvedParams.slug, categories);
  return { title: target ? `${target.name_ar} | المتجر` : 'المتجر' };
}

export default async function BrowsePage({ params }: BrowsePageProps) {
  const categories = await readCategories();
  const globalAttributes = await readAttributes();
  const resolvedParams = await params;
  
  const isRoot = !resolvedParams.slug || resolvedParams.slug.length === 0;
  
  let currentNode = null;
  let children: typeof categories = [];
  let ancestors: typeof categories = [];

  if (isRoot) {
    // Show root departments
    children = categories.filter(c => c.parent_id === null);
  } else {
    currentNode = findCategoryBySlugPath(resolvedParams.slug, categories);

    if (!currentNode) {
      notFound();
    }
    
    children = categories.filter(c => c.parent_id === currentNode!.id);
    ancestors = getAncestors(currentNode.id, categories);
  }

  const hasChildren = children.length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-muted/20 pb-20 sm:pb-6 relative">
      
      {/* Breadcrumbs Header */}
      <div className="bg-background/80 backdrop-blur-xl border-b sticky top-0 sm:top-[64px] z-40 shadow-sm w-full transition-all">
        <div className="container mx-auto px-4 py-3 flex items-center overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link href="/browse" className="text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-full">
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">الرئيسية</span>
          </Link>
          
          {!isRoot && ancestors.map((anc) => (
            <div key={anc.id} className="flex items-center">
              <ChevronLeft className="w-4 h-4 mx-2 text-muted-foreground/40" />
              <Link 
                href={`/browse/${getCategoryPath(anc.id, categories, '/', 'slug')}`}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors bg-secondary/30 hover:bg-secondary/80 px-3 py-1.5 rounded-full"
              >
                {anc.name_ar}
              </Link>
            </div>
          ))}

          {!isRoot && currentNode && (
            <div className="flex items-center">
              <ChevronLeft className="w-4 h-4 mx-2 text-muted-foreground/40" />
              <div className="bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                <span className="text-sm font-bold text-primary">
                  {currentNode.name_ar}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8 text-center sm:text-right">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isRoot ? 'تصفح جميع الأقسام' : currentNode?.name_ar}
          </h1>
          {!isRoot && (
            <p className="text-muted-foreground">
              {hasChildren
                ? `يحتوي على ${children.length} قسم فرعي`
                : currentNode?.node_type === 'product_type'
                  ? 'بطاقة مواصفات المنتج النهائي'
                  : 'لا توجد تصنيفات فرعية بعد'}
            </p>
          )}
        </div>

        {/* Content */}
        {hasChildren ? (
          <BrowseClient
            categories={children}
            allCategories={categories}
            parentId={currentNode?.id || null}
          />
        ) : currentNode?.node_type === 'product_type' ? (
          <ProductBlueprint category={currentNode} globalAttributes={globalAttributes} />
        ) : currentNode ? (
          <BrowseClient
            categories={[]}
            allCategories={categories}
            parentId={currentNode.id}
          />
        ) : null}
      </div>
    </div>
  );
}
