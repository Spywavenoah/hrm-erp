'use client';

import { useState, useEffect } from 'react';
import { Sidebar, SidebarContent } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-open');
    if (stored !== null) setDesktopOpen(stored === 'true');
  }, []);

  const toggleDesktop = () => {
    setDesktopOpen((v) => {
      const next = !v;
      localStorage.setItem('sidebar-open', String(next));
      return next;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div
        className={cn(
          'hidden lg:flex shrink-0 transition-all duration-300 overflow-hidden',
          desktopOpen ? 'w-64' : 'w-0'
        )}
      >
        <div className="w-64 shrink-0">
          <Sidebar />
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          desktopOpen={desktopOpen}
          onToggleDesktop={toggleDesktop}
          onToggleMobile={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
          {children}
        </main>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 sm:max-w-xs">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
