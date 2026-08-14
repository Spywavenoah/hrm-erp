'use client';

import { useEffect, useState, useCallback } from 'react';
import { ModuleListPage, type SummaryCard, type Column } from '@/components/shared/module-list-page';
import { Clock, CheckCircle, XCircle, AlertTriangle, LogIn, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AttendanceRecord {
  id: string;
  employee_id: string;
  clock_in: string | null;
  clock_out: string | null;
  date: string;
  status: string;
  work_hours: number | null;
  overtime_hours: number;
}

interface EmployeeRef {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<EmployeeRef | null>(null);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [clocking, setClocking] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [attRes, empRes] = await Promise.all([
        supabase.from('attendance').select('*').order('date', { ascending: false }).limit(100),
        supabase.from('employees').select('id, first_name, last_name, email'),
      ]);
      setRecords((attRes.data || []) as unknown as AttendanceRecord[]);
      setEmployees((empRes.data || []) as unknown as EmployeeRef[]);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const emp = (empRes.data || []).find((e: EmployeeRef) => e.email === user.email);
        if (emp) {
          setCurrentUser(emp);
          const todays = (attRes.data || []) as AttendanceRecord[];
          setTodayRecord(todays.find((r) => r.employee_id === emp.id && r.date === today) || null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { load(); }, [load]);

  const handleClockIn = async () => {
    if (!currentUser) return;
    setClocking(true);
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          employee_id: currentUser.id,
          date: today,
          clock_in: now,
          status: 'PRESENT',
        })
        .select()
        .single();
      if (error) throw error;
      setTodayRecord(data as unknown as AttendanceRecord);
      toast.success('Clocked in successfully');
      load();
    } catch (err) {
      toast.error('Failed to clock in: ' + (err as Error).message);
    } finally {
      setClocking(false);
    }
  };

  const handleClockOut = async () => {
    if (!todayRecord) return;
    setClocking(true);
    try {
      const now = new Date().toISOString();
      const clockIn = new Date(todayRecord.clock_in!);
      const hours = (new Date(now).getTime() - clockIn.getTime()) / (1000 * 60 * 60);
      const { error } = await supabase
        .from('attendance')
        .update({
          clock_out: now,
          work_hours: Math.round(hours * 100) / 100,
        })
        .eq('id', todayRecord.id);
      if (error) throw error;
      setTodayRecord({ ...todayRecord, clock_out: now, work_hours: Math.round(hours * 100) / 100 });
      toast.success('Clocked out successfully');
      load();
    } catch (err) {
      toast.error('Failed to clock out: ' + (err as Error).message);
    } finally {
      setClocking(false);
    }
  };

  const empName = (id: string) => {
    const e = employees.find((e) => e.id === id);
    return e ? `${e.first_name} ${e.last_name}` : '—';
  };

  const statusColors: Record<string, string> = {
    PRESENT: 'bg-success/10 text-success',
    ABSENT: 'bg-destructive/10 text-destructive',
    LATE: 'bg-warning/10 text-warning',
    HALF_DAY: 'bg-info/10 text-info',
  };

  const summaryCards: SummaryCard[] = [
    { label: 'Total Records', value: records.length, icon: Clock, color: 'primary' },
    { label: 'Present', value: records.filter((r) => r.status === 'PRESENT').length, icon: CheckCircle, color: 'success' },
    { label: 'Absent', value: records.filter((r) => r.status === 'ABSENT').length, icon: XCircle, color: 'destructive' },
    { label: 'Late', value: records.filter((r) => r.status === 'LATE').length, icon: AlertTriangle, color: 'warning' },
  ];

  const columns: Column<AttendanceRecord>[] = [
    {
      key: 'employee_name',
      label: 'Employee',
      render: (r) => <span className="font-medium">{empName(r.employee_id)}</span>,
    },
    { key: 'date', label: 'Date', sortable: true },
    {
      key: 'clock_in', label: 'Clock In',
      render: (r) => r.clock_in ? new Date(r.clock_in).toLocaleTimeString() : '—',
    },
    {
      key: 'clock_out', label: 'Clock Out',
      render: (r) => r.clock_out ? new Date(r.clock_out).toLocaleTimeString() : '—',
    },
    { key: 'work_hours', label: 'Hours', render: (r) => r.work_hours ? `${r.work_hours}h` : '—', sortable: true },
    { key: 'overtime_hours', label: 'Overtime', render: (r) => r.overtime_hours ? `${r.overtime_hours}h` : '—' },
    {
      key: 'status', label: 'Status',
      render: (r) => <Badge variant="outline" className={statusColors[r.status] || ''}>{r.status}</Badge>,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {currentUser && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Time Tracking</h3>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              {todayRecord && (
                <p className="mt-2 text-sm">
                  {todayRecord.clock_in && !todayRecord.clock_out ? (
                    <span className="text-success flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4" />
                      Clocked in at {new Date(todayRecord.clock_in).toLocaleTimeString()}
                    </span>
                  ) : todayRecord.clock_out ? (
                    <span className="text-muted-foreground">
                      Day complete — {todayRecord.work_hours}h logged
                    </span>
                  ) : null}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {!todayRecord || (!todayRecord.clock_in) ? (
                <Button onClick={handleClockIn} disabled={clocking} className="gap-2">
                  <LogIn className="h-4 w-4" />
                  {clocking ? 'Clocking in...' : 'Clock In'}
                </Button>
              ) : !todayRecord.clock_out ? (
                <Button onClick={handleClockOut} disabled={clocking} variant="outline" className="gap-2">
                  <LogOut className="h-4 w-4" />
                  {clocking ? 'Clocking out...' : 'Clock Out'}
                </Button>
              ) : (
                <Button disabled variant="outline" className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Day Complete
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <ModuleListPage
        title="Attendance"
        description="Track employee clock-in/out and time management"
        summaryCards={summaryCards}
        columns={columns}
        data={records}
        loading={loading}
        searchPlaceholder="Search attendance..."
      />
    </div>
  );
}
