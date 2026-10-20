import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans-arabic',
});

export const metadata: Metadata = {
  title: 'YCP Taxonomy & Catalog Planner',
  description: 'أداة تخطيط وتنظيم تصنيفات المتجر الإلكتروني وإدارة الكتالوج المركزي',
};

import SpotlightPalette from '@/components/search/SpotlightPalette';
import { AppNavbar } from '@/components/layout/AppNavbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html dir="rtl" lang="ar" className={ibmPlexArabic.variable} suppressHydrationWarning>
      <body className="font-sans antialiased pb-24 xl:pb-6 bg-[--background]">
        <ThemeProvider>
          <AppNavbar />
          <main className="flex-1 w-full">
            {children}
          </main>
          <MobileNav />
          <SpotlightPalette />
        </ThemeProvider>
      </body>
    </html>
  );
}
