import Link from 'next/link';
import { Redo2 } from 'lucide-react';
import { readConversionCenterData } from '@/lib/data/measurements';
import { UnitConversionManager } from '@/components/measurements/UnitConversionManager';

export const dynamic = 'force-dynamic';

export default async function UnitConversionsPage() {
  const data = await readConversionCenterData();
  return <main className="mx-auto min-h-screen max-w-7xl space-y-5 px-4 py-6 pb-28 md:px-8 md:py-8"><div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4"><Link href="/definitions" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><Redo2 className="h-4 w-4" /> التعريفات المركزية</Link><Link href="/measurements" className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:border-primary/40 hover:bg-primary/5">مركز الوحدات والأبعاد</Link></div><UnitConversionManager {...data} /></main>;
}
