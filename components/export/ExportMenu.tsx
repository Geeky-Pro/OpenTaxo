'use client';

import React, { useState } from 'react';
import { Download, Copy, Check, ChevronDown } from 'lucide-react';

export function ExportMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCopy = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/export');
      if (!res.ok) throw new Error('Failed to fetch export');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      alert('فشل نسخ البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative inline-block text-right">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 h-10 bg-[--background-elevated] border border-[--border] hover:bg-[--accent] text-[--foreground] text-sm font-medium rounded-md transition-colors"
      >
        <Download className="w-4 h-4" />
        تصدير
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 sm:left-auto right-0 sm:right-auto mt-2 w-48 rounded-md shadow-lg bg-[--background-elevated] border border-[--border] z-50 overflow-hidden" dir="rtl">
            <div className="py-1" role="menu" aria-orientation="vertical">
              <a
                href="/api/export?download=true"
                download="catalog-taxonomy-enriched.json"
                className="flex items-center gap-2 px-4 py-3 text-sm text-[--foreground] hover:bg-[--accent] hover:text-[--accent-foreground] transition-colors"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                <Download className="w-4 h-4" />
                تحميل ملف JSON
              </a>
              <button
                onClick={handleCopy}
                disabled={isLoading}
                className="flex items-center gap-2 w-full text-right px-4 py-3 text-sm text-[--foreground] hover:bg-[--accent] hover:text-[--accent-foreground] transition-colors disabled:opacity-50"
                role="menuitem"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {isLoading ? 'جاري التحضير...' : copied ? 'تم النسخ!' : 'نسخ JSON'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
