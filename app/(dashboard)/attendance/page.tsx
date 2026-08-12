'use client';

import { useEffect, useState, useCallback } from 'react';
import { ModuleListPage, type SummaryCard, type Column } from '@/components/shared/module-list-page';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';

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

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .order('date', { ascending: false })
        .limit(100);
      if (error) throw error;
      setRecords((data || []) as unknown as AttendanceRecord[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
    { key: 'date', label: 'Date' },
    {
      key: 'clock_in', label: 'Clock In',
      render: (r) => r.clock_in ? new Date(r.clock_in).toLocaleTimeString() : '—',
    },
    {
      key: 'clock_out', label: 'Clock Out',
      render: (r) => r.clock_out ? new Date(r.clock_out).toLocaleTimeString() : '—',
    },
    { key: 'work_hours', label: 'Hours', render: (r) => r.work_hours ? `${r.work_hours}h` : '—' },
    { key: 'overtime_hours', label: 'Overtime', render: (r) => r.overtime_hours ? `${r.overtime_hours}h` : '—' },
    {
      key: 'status', label: 'Status',
      render: (r) => <Badge variant="outline" className={statusColors[r.status] || ''}>{r.status}</Badge>,
    },
  ];

  return (
    <ModuleListPage
      title="Attendance"
      description="Track employee clock-in/out and time management"
      summaryCards={summaryCards}
      columns={columns}
      data={records}
      searchPlaceholder="Search attendance..."
    />
  );
}
