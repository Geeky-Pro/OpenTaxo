import { Category } from '@/lib/types/category';
import { Attribute } from '@/lib/types/attribute';
import { Shield, LayoutGrid, Tags, ShoppingCart, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface ProductBlueprintProps {
  category: Category;
  globalAttributes: Attribute[];
}

export function ProductBlueprint({ category, globalAttributes }: ProductBlueprintProps) {
  // Resolve attributes
  const resolvedAttributes = category.attributes.map(boundAttr => {
    const globalDef = globalAttributes.find(a => a.id === boundAttr.attribute_id);
    return {
      ...boundAttr,
      ...globalDef,
    };
  }).filter(a => a.name_ar); // Filter out any broken links

  const identityAttrs = resolvedAttributes.filter(a => a.role === 'identity');
  const variantAttrs = resolvedAttributes.filter(a => a.role === 'variant');
  const descriptiveAttrs = resolvedAttributes.filter(a => a.role === 'descriptive');
  const commercialAttrs = resolvedAttributes.filter(a => a.role === 'commercial');

  const AttributeGroup = ({ title, icon: Icon, attrs, colorClass }: { title: string, icon: any, attrs: any[], colorClass: string }) => {
    if (attrs.length === 0) return null;
    return (
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className={`px-4 py-3 border-b flex items-center gap-2 font-semibold ${colorClass}`}>
          <Icon className="w-5 h-5" />
          {title}
        </div>
        <div className="divide-y">
          {attrs.map((attr, i) => (
            <div key={i} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-medium text-sm flex items-center gap-2">
                  {attr.name_ar}
                  {attr.is_variant && <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">مُتغير</span>}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                  {attr.name_en || attr.attribute_id}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1 mt-2 sm:mt-0 max-w-sm justify-start sm:justify-end">
                {attr.allowed_values && attr.allowed_values.length > 0 ? (
                  attr.allowed_values.map((val: string, idx: number) => (
                    <span key={idx} className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-md border">
                      {val} {attr.unit && <span className="text-muted-foreground ml-1">{attr.unit}</span>}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">نص حر / أي قيمة</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 p-4 rounded-xl border border-blue-100 dark:border-blue-900">
        <div>
          <h2 className="font-bold">مخطط مواصفات المنتج (Blueprint)</h2>
          <p className="text-sm opacity-80 mt-1">هذا القسم نهائي (Product Type) وتُستخدم هذه الخصائص لبناء صفحات المنتجات المنتمية له.</p>
        </div>
        <Link 
          href={`/categories/${category.id}`}
          className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-800 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors shadow-sm"
        >
          <ExternalLink className="w-4 h-4" />
          تعديل
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <AttributeGroup title="الخصائص التعريفية" icon={Shield} attrs={identityAttrs} colorClass="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400" />
          <AttributeGroup title="خصائص المتغيرات" icon={LayoutGrid} attrs={variantAttrs} colorClass="bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400" />
        </div>
        <div className="space-y-6">
          <AttributeGroup title="الخصائص الوصفية" icon={Tags} attrs={descriptiveAttrs} colorClass="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400" />
          <AttributeGroup title="الخصائص التجارية" icon={ShoppingCart} attrs={commercialAttrs} colorClass="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400" />
        </div>
      </div>

      {resolvedAttributes.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-card">
          <p className="text-muted-foreground mb-4">لا توجد خصائص مرتبطة بهذا القسم بعد.</p>
          <Link 
            href={`/categories/${category.id}`}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            إضافة خصائص
          </Link>
        </div>
      )}
    </div>
  );
}
