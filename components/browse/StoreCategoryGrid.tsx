import Link from 'next/link';
import Image from 'next/image';
import { Layers, FolderTree, Box, Folder } from 'lucide-react';
import type { Category } from '@/lib/types/category';
import { getCategoryPath } from '@/lib/utils/tree';

interface StoreCategoryGridProps {
  categories: Category[];
  allCategories: Category[];
  onAddClick?: () => void;
}

export function StoreCategoryGrid({ categories, allCategories, onAddClick }: StoreCategoryGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
      {categories.map((category) => {
        // Construct the full URL path
        const fullSlugPath = getCategoryPath(category.id, allCategories, '/', 'slug');
        
        return (
          <Link 
            key={category.id} 
            href={`/browse/${fullSlugPath}`}
            className="group flex flex-col items-center p-2 rounded-xl hover:bg-[var(--color-card)] hover:shadow-sm transition-all duration-300"
          >
            {/* Prominent Image with Decorative Offset Circle */}
            <div className="w-28 h-28 flex items-center justify-center relative mb-3 group-hover:-translate-y-1 transition-transform duration-300">
              {/* Decorative Circle */}
              <div className="absolute w-20 h-20 rounded-full bg-primary/10 dark:bg-primary/5 top-1 right-1 z-0 group-hover:scale-110 transition-transform duration-300" />
              
              {category.image ? (
                <Image
                  src={category.image}
                  alt={category.name_ar}
                  fill
                  priority={true}
                  className="object-contain relative z-10 drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300 p-1"
                  sizes="112px"
                />
              ) : (
                <div className="bg-background/80 backdrop-blur-sm rounded-[1.5rem] p-4 shadow-sm border border-border/50 group-hover:border-primary/20 transition-all relative z-10 group-hover:scale-110 duration-300">
                  {category.node_type === 'department' ? <Layers className="w-8 h-8 text-primary/70" strokeWidth={1.5} />
                  : category.node_type === 'subcategory' ? <FolderTree className="w-8 h-8 text-primary/70" strokeWidth={1.5} />
                  : category.node_type === 'product_type' ? <Box className="w-8 h-8 text-primary/70" strokeWidth={1.5} />
                  : <Folder className="w-8 h-8 text-primary/70" strokeWidth={1.5} />}
                </div>
              )}
            </div>
            
            <h3 className="font-bold text-sm text-foreground text-center line-clamp-1 group-hover:text-primary transition-colors">
              {category.name_ar}
            </h3>
            {category.name_en && (
              <span className="text-[10px] text-muted-foreground font-sans mt-0.5" dir="ltr">
                {category.name_en}
              </span>
            )}
          </Link>
        );
      })}

      {/* Add New Card */}
      {onAddClick && (
        <button 
          onClick={onAddClick}
          className="group flex flex-col items-center p-2 rounded-xl hover:bg-[var(--color-card)] hover:shadow-sm transition-all duration-300"
        >
          <div className="w-28 h-28 rounded-[2rem] bg-primary/5 text-primary flex items-center justify-center relative mb-3 ring-4 ring-transparent group-hover:ring-primary/10 transition-all duration-300 border-2 border-dashed border-primary/20 group-hover:border-primary/40 group-active:scale-95">
            <div className="bg-background rounded-xl p-2 shadow-sm group-hover:shadow-md transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </div>
          </div>
          <h3 className="font-bold text-sm text-primary text-center transition-colors">
            إضافة قسم
          </h3>
        </button>
      )}
    </div>
  );
}
