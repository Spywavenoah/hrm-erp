'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, Building2, LogOut } from 'lucide-react';
import { navSections } from '@/lib/navigation';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('User');
  const [userRole, setUserRole] = useState<string>('EMPLOYEE');

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || '');
        setUserName(user.email?.split('@')[0] || 'User');
        const { data: emp } = await supabase
          .from('employees')
          .select('first_name, last_name, role')
          .eq('email', user.email)
          .maybeSingle();
        if (emp) {
          setUserName(`${emp.first_name} ${emp.last_name}`);
          setUserRole(emp.role || 'EMPLOYEE');
        }
      }
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out');
    router.push('/login');
  };

  const initials = userName
    .split(/[.\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || 'U';

  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN';

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.adminOnly || isAdmin),
    }))
    .filter((section) => section.items.length > 0);

  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const section of visibleSections) {
      const hasActiveChild = section.items.some(
        (item) => pathname === item.href || pathname.startsWith(item.href + '/')
      );
      if (hasActiveChild) initial.add(section.label);
    }
    return initial;
  });

  useEffect(() => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      for (const section of visibleSections) {
        const hasActiveChild = section.items.some(
          (item) => pathname === item.href || pathname.startsWith(item.href + '/')
        );
        if (hasActiveChild) next.add(section.label);
      }
      return next;
    });
  }, [pathname, isAdmin]);

  const toggleSection = (label: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  return (
    <>
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building2 className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold tracking-tight">HR Flow</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {visibleSections.map((section) => {
          const isOpen = openSections.has(section.label);
          const hasActiveChild = section.items.some(
            (item) =>
              pathname === item.href || pathname.startsWith(item.href + '/')
          );

          return (
            <div key={section.label} className="mb-1">
              <button
                onClick={() => toggleSection(section.label)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  hasActiveChild
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <section.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{section.label}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform',
                    isOpen && 'rotate-180'
                  )}
                />
              </button>

              {isOpen && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
                  {section.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/dashboard' &&
                        pathname.startsWith(item.href + '/'));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          'flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <item.icon className="h-3.5 w-3.5 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg bg-accent/50 px-3 py-2 transition-colors hover:bg-accent">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {initials}
              </div>
              <div className="flex-1 overflow-hidden text-left">
                <p className="truncate text-sm font-medium">{userName}</p>
                <p className="truncate text-xs text-muted-foreground">{userEmail || 'Not signed in'}</p>
              </div>
              {isAdmin && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">ADMIN</span>}
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuItem className="text-sm font-medium">
              {userEmail}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <SidebarContent />
    </aside>
  );
}
