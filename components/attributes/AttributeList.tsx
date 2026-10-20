'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Plus, AlertTriangle, X, Search } from 'lucide-react';
import { deleteAttribute } from '@/lib/actions/attributes';
import { AttributeForm } from './AttributeForm';
import type { Attribute } from '@/lib/types/attribute';

export type AttributeWithUsage = Attribute & { usageCount: number };

type Props = {
  attributes: AttributeWithUsage[];
};

const DATA_TYPE_LABELS: Record<Attribute['data_type'], string> = {
  string: 'نص',
  number: 'رقم',
  boolean: 'نعم / لا',
  enum: 'قائمة ثابتة',
};

export function AttributeList({ attributes }: Props) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [editingAttr, setEditingAttr] = useState<AttributeWithUsage | null>(null);
  const [deletingAttr, setDeletingAttr] = useState<AttributeWithUsage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dataTypeFilter, setDataTypeFilter] = useState<Attribute['data_type'] | 'all'>('all');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredAttributes = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();

    return attributes.filter((attribute) => {
      const matchesQuery = !query
        || attribute.name_ar.toLocaleLowerCase().includes(query)
        || (attribute.name_en ?? '').toLocaleLowerCase().includes(query);
      const matchesType = dataTypeFilter === 'all' || attribute.data_type === dataTypeFilter;
      return matchesQuery && matchesType;
    });
  }, [attributes, searchQuery, dataTypeFilter]);

  const handleDelete = () => {
    if (!deletingAttr) return;

    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteAttribute(deletingAttr.id);
      if (!result.success) {
        setDeleteError(typeof result.error === 'string' ? result.error : 'تعذر حذف السمة. تحقق من ارتباطاتها ثم حاول مجددًا.');
        return;
      }

      setDeletingAttr(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">مكتبة السمات العامة</h2>
          <p className="text-sm text-foreground-muted mt-1">
            إدارة السمات القابلة لإعادة الاستخدام وربطها بأنواع المنتجات.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة سمة</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_220px] gap-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="ابحث باسم السمة بالعربية أو الإنجليزية..."
            aria-label="البحث في السمات"
            className="w-full h-11 pr-10 pl-4 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <select
          value={dataTypeFilter}
          onChange={(event) => setDataTypeFilter(event.target.value as Attribute['data_type'] | 'all')}
          aria-label="تصفية حسب نوع البيانات"
          className="h-11 px-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">جميع أنواع البيانات</option>
          {Object.entries(DATA_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between text-sm text-foreground-muted">
        <span>المعروض {filteredAttributes.length} من أصل {attributes.length} سمة</span>
        {(searchQuery || dataTypeFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setDataTypeFilter('all');
            }}
            className="underline underline-offset-4 hover:text-foreground"
          >
            مسح التصفية
          </button>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-lg rounded-lg shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold text-lg">إضافة سمة جديدة</h3>
              <button onClick={() => setIsAdding(false)} aria-label="إغلاق" className="text-foreground-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <AttributeForm onSuccess={() => setIsAdding(false)} onCancel={() => setIsAdding(false)} />
            </div>
          </div>
        </div>
      )}

      {editingAttr && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-lg rounded-lg shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold text-lg">تعديل السمة: {editingAttr.name_ar}</h3>
              <button onClick={() => setEditingAttr(null)} aria-label="إغلاق" className="text-foreground-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <AttributeForm attribute={editingAttr} onSuccess={() => setEditingAttr(null)} onCancel={() => setEditingAttr(null)} />
            </div>
          </div>
        </div>
      )}

      {deletingAttr && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-md rounded-lg shadow-xl overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-destructive">
                <Trash2 className="w-6 h-6" />
                <h3 className="font-semibold text-lg">تأكيد الحذف</h3>
              </div>

              <p className="text-sm">
                هل أنت متأكد من حذف السمة <strong>{deletingAttr.name_ar}</strong>؟
              </p>

              {deletingAttr.usageCount > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-start gap-3 text-amber-600 dark:text-amber-500">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p className="text-sm">
                    تنبيه: هذه السمة مستخدمة في ({deletingAttr.usageCount}) نوع منتج. سيؤدي الحذف إلى إزالة ارتباطاتها من مخططات أنواع المنتجات.
                  </p>
                </div>
              )}

              {deleteError && (
                <div role="alert" className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {deleteError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setDeletingAttr(null);
                    setDeleteError(null);
                  }}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-background-muted transition-colors disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50"
                >
                  {isPending ? 'جاري الحذف...' : 'حذف نهائي'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredAttributes.length === 0 ? (
        <div className="text-center p-10 md:p-12 border rounded-lg bg-background-muted border-dashed">
          <Search className="w-9 h-9 mx-auto mb-3 text-foreground-muted/60" />
          <p className="font-medium">
            {attributes.length === 0 ? 'لا توجد سمات مضافة بعد.' : 'لا توجد سمات تطابق البحث.'}
          </p>
          <p className="text-sm text-foreground-muted mt-1">
            {attributes.length === 0 ? 'أنشئ سمة عامة لتتمكن من ربطها بأنواع المنتجات.' : 'جرّب اسمًا آخر أو أزل أحد عوامل التصفية.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAttributes.map((attr) => (
            <div key={attr.id} className="border rounded-lg p-4 bg-background shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start gap-3 mb-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg break-words">{attr.name_ar}</h3>
                  {attr.name_en && (
                    <p className="text-sm text-foreground-muted break-words" dir="ltr">{attr.name_en}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setEditingAttr(attr)}
                    aria-label={`تعديل السمة ${attr.name_ar}`}
                    className="p-2 text-foreground-muted hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                    title="تعديل"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setDeletingAttr(attr);
                      setDeleteError(null);
                    }}
                    aria-label={`حذف السمة ${attr.name_ar}`}
                    className="p-2 text-foreground-muted hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-foreground-muted">نوع البيانات:</span>
                  <span className="font-medium">{DATA_TYPE_LABELS[attr.data_type]}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-foreground-muted">نوع الفلتر:</span>
                  <span className="font-medium">{attr.filter_type}</span>
                </div>
                {attr.unit && (
                  <div className="flex justify-between gap-3">
                    <span className="text-foreground-muted">وحدة القياس:</span>
                    <span className="font-medium bg-background-muted px-1.5 rounded">{attr.unit}</span>
                  </div>
                )}
                <div className="flex justify-between gap-3 pt-2 border-t border-dashed">
                  <span className="text-foreground-muted">الاستخدام:</span>
                  <span className="font-medium">{attr.usageCount} نوع منتج</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
