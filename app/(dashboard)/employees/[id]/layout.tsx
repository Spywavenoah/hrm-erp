'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import type { Employee } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  User,
  Briefcase,
  ShieldCheck,
  GraduationCap,
  HeartPulse,
  Wallet,
  FileText,
  Target,
  CalendarDays,
  Package,
  Clock,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const submenus = [
  { label: 'Personal', href: 'personal', icon: User },
  { label: 'Employment', href: 'employment', icon: Briefcase },
  { label: 'Guarantor', href: 'guarantor', icon: ShieldCheck },
  { label: 'Qualifications', href: 'qualifications', icon: GraduationCap },
  { label: 'Medical', href: 'medical', icon: HeartPulse },
  { label: 'Compensation', href: 'compensation', icon: Wallet },
  { label: 'Documents', href: 'documents', icon: FileText },
  { label: 'Performance', href: 'performance', icon: Target },
  { label: 'Leave', href: 'leave', icon: CalendarDays },
  { label: 'Assets', href: 'assets', icon: Package },
  { label: 'Attendance', href: 'attendance', icon: Clock },
  { label: 'Timeline', href: 'timeline', icon: Clock },
];

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-success/10 text-success border-success/20',
  PENDING_VERIFICATION: 'bg-warning/10 text-warning border-warning/20',
  ONBOARDING: 'bg-info/10 text-info border-info/20',
  TERMINATED: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function EmployeeDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const id = params.id as string;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEmployee() {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        setEmployee(data as unknown as Employee);
      } catch (err) {
        console.error('Failed to load employee:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEmployee();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!employee) {
    return <div className="text-center text-muted-foreground">Employee not found.</div>;
  }

  const basePath = `/employees/${id}`;
  const activeSection = pathname.split('/').pop();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/employees')} className="shrink-0">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
          <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg sm:text-xl font-bold text-primary">
            {employee.first_name[0]}{employee.last_name[0]}
          </div>
          <div className="overflow-hidden">
            <h1 className="text-lg sm:text-xl font-bold truncate">
              {employee.first_name} {employee.last_name}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{employee.email}</p>
              <Badge variant="outline" className={statusColors[employee.employment_status] || ''}>
                {employee.employment_status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: horizontal scrollable nav. Desktop: vertical sidebar. */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        <nav className="lg:w-48 lg:shrink-0 lg:space-y-0.5">
          <div className="flex lg:flex-col gap-1 lg:gap-0.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 -mx-1 px-1 lg:mx-0 lg:px-0 scrollbar-thin">
            {submenus.map((item) => {
              const isActive = activeSection === item.href;
              return (
                <Link
                  key={item.href}
                  href={`${basePath}/${item.href}`}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors whitespace-nowrap shrink-0 lg:w-full',
                    isActive
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
