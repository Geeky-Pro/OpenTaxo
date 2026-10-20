import Link from 'next/link';
import { Redo2 } from 'lucide-react';
import { readValueCenterData } from '@/lib/data/value-sets';
import { ValueSetManager } from '@/components/values/ValueSetManager';

export const dynamic = 'force-dynamic';

export default async function ValueSetsPage() {
  const data = await readValueCenterData();
  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-5 px-4 py-6 pb-28 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <Link href="/definitions" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><Redo2 className="h-4 w-4" /> التعريفات المركزية</Link>
      </div>
      <ValueSetManager {...data} />
    </main>
  );
}
