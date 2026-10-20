'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, FolderTree, Tag, Layers, Store, LogOut, Home, Network } from 'lucide-react';
import { signOutAction } from '@/lib/auth/actions';
import { ExportMenu } from '../export/ExportMenu';
import { ThemeToggle } from '../theme/ThemeToggle';
import { cn } from '@/lib/utils';

export function AppNavbar() {
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/unauthorized') return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm transition-all duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left side: Logo */}
        <Link href="/" className="flex items-center gap-3 group transition-opacity hover:opacity-90">
          <div className="bg-primary/10 p-2 rounded-xl border border-primary/20 shadow-inner group-hover:scale-105 transition-transform duration-200">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base leading-none tracking-tight text-foreground group-hover:text-primary transition-colors">
              YCP Taxonomy & Catalog Planner
            </span>
          </div>
        </Link>

        {/* Center: Main Navigation */}
        <nav className="hidden xl:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/50 shadow-sm backdrop-blur-sm">
          {[
            { href: '/', label: 'الرئيسية', icon: Home, active: pathname === '/' },
            { href: '/taxonomy', label: 'إدارة التصنيفات', icon: Network, active: pathname.startsWith('/taxonomy') || pathname.startsWith('/categories') },
            { href: '/tree', label: 'الشجرة', icon: FolderTree, active: pathname.startsWith('/tree') },
            { href: '/definitions', label: 'التعريفات', icon: Tag, active: pathname.startsWith('/definitions') || pathname.startsWith('/attributes') || pathname.startsWith('/data-types') || pathname.startsWith('/value-sets') || pathname.startsWith('/measurements') || pathname.startsWith('/unit-conversions') },
            { href: '/browse', label: 'معرض المتجر', icon: Store, active: pathname.startsWith('/browse') },
          ].map((item) => {
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} className={cn("flex items-center gap-2 px-3 h-9 rounded-md text-sm font-medium transition-all duration-300", item.active ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:bg-background/50 hover:text-foreground")}><Icon className="h-4 w-4" />{item.label}</Link>;
          })}
        </nav>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form action={signOutAction}>
            <button type="submit" aria-label="تسجيل الخروج" title="تسجيل الخروج" className="inline-flex h-9 items-center gap-2 rounded-full border border-border/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline">خروج</span>
            </button>
          </form>

          <button
            onClick={() => document.dispatchEvent(new CustomEvent('open-spotlight'))}
            className="hidden sm:flex items-center justify-between gap-2 px-3 h-9 w-56 text-sm bg-muted/50 border border-border/50 hover:bg-background hover:border-border hover:shadow-sm text-muted-foreground rounded-full transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              بحث شامل...
            </span>
            <kbd className="inline-flex items-center gap-1 rounded bg-background border px-1.5 font-mono text-[10px] font-medium opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>

          <ExportMenu />
        </div>
      </div>
    </header>
  );
}
