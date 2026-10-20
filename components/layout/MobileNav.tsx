'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tag, Search, PlusCircle, Store, Home, Network } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/unauthorized') return null;

  return (
    <div className="xl:hidden fixed bottom-6 left-0 right-0 z-40 px-4 pointer-events-none">
      <nav className="pointer-events-auto h-[64px] bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl flex items-center justify-between px-1 shadow-lg shadow-black/5">
        <Link href="/" aria-label="الرئيسية" className={cn("flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors", pathname === '/' ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
          <Home className="h-5 w-5" /><span className="text-[9px] font-medium">الرئيسية</span>
        </Link>
        <Link href="/taxonomy" aria-label="إدارة التصنيفات" className={cn("flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors", (pathname.startsWith('/taxonomy') || pathname.startsWith('/categories')) ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
          <Network className="h-5 w-5" /><span className="text-[9px] font-medium">التصنيفات</span>
        </Link>
        <Link href="/browse" aria-label="معرض المتجر" className={cn("flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors", pathname.startsWith('/browse') ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
          <Store className="h-5 w-5" /><span className="text-[9px] font-medium">المعرض</span>
        </Link>
        <Link href="/definitions" aria-label="التعريفات المركزية" className={cn("flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors", (pathname.startsWith('/definitions') || pathname.startsWith('/attributes') || pathname.startsWith('/data-types') || pathname.startsWith('/value-sets') || pathname.startsWith('/measurements') || pathname.startsWith('/unit-conversions')) ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
          <Tag className="h-5 w-5" /><span className="text-[9px] font-medium">التعريفات</span>
        </Link>
        <button onClick={() => document.dispatchEvent(new CustomEvent('open-spotlight'))} aria-label="بحث شامل" className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-muted-foreground hover:text-foreground transition-all duration-300">
          <Search className="h-5 w-5" /><span className="text-[9px] font-medium">بحث</span>
        </button>
        <button onClick={() => window.dispatchEvent(new CustomEvent('open-new-category'))} aria-label="إضافة قسم" className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-300">
          <div className="bg-primary text-primary-foreground p-2 rounded-full shadow-md active:scale-95 transition-transform"><PlusCircle className="h-5 w-5" /></div><span className="text-[9px] font-medium">إضافة</span>
        </button>
      </nav>
    </div>
  );
}
