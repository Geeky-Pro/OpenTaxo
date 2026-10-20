'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("w-9 h-9 rounded-md border flex items-center justify-center opacity-50", className)}>
        <Sun className="h-4 w-4" />
      </div>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        "relative w-9 h-9 rounded-md border flex items-center justify-center bg-background hover:bg-muted transition-colors",
        className
      )}
      title="تبديل المظهر"
      aria-label="تبديل المظهر"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-foreground transition-all" />
      ) : (
        <Moon className="h-4 w-4 text-foreground transition-all" />
      )}
    </button>
  );
}
