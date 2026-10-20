import Link from 'next/link';
import { Redo2, Braces } from 'lucide-react';
import { readAttributeCenterData } from '@/lib/data/attribute-definitions';
import { AttributeDefinitionManager } from '@/components/attributes/AttributeDefinitionManager';

export const dynamic = 'force-dynamic';

export default async function AttributesPage() {
  const { definitions, dimensions } = await readAttributeCenterData();

  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-5 px-4 py-6 pb-28 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <Link href="/definitions" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><Redo2 className="h-4 w-4" /> التعريفات المركزية</Link>
        <Link href="/data-types" className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:border-primary/40 hover:bg-primary/5"><Braces className="h-4 w-4" /> مركز أنواع البيانات</Link>
      </div>
      <AttributeDefinitionManager definitions={definitions} dimensions={dimensions} />
    </main>
  );
}
