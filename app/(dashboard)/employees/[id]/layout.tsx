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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/employees')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary">
            {employee.first_name[0]}{employee.last_name[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold">
              {employee.first_name} {employee.last_name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">{employee.email}</p>
              <Badge variant="outline" className={statusColors[employee.employment_status] || ''}>
                {employee.employment_status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        <nav className="w-48 shrink-0 space-y-0.5">
          {submenus.map((item) => {
            const isActive = activeSection === item.href;
            return (
              <Link
                key={item.href}
                href={`${basePath}/${item.href}`}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
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
        </nav>

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
