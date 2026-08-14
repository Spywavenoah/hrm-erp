'use client';

import { useEffect, useState, useCallback } from 'react';
import { ModuleListPage, type SummaryCard, type Column } from '@/components/shared/module-list-page';
import { CalendarDays, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { enqueueAndProcess } from '@/lib/notifications';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  approver_id: string | null;
  approved_at: string | null;
  created_at: string;
}

interface EmployeeRef {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface LeaveTypeRef {
  id: string;
  name: string;
  annual_allocation: number;
}

export default function LeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<EmployeeRef[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ employee_id: '', leave_type_id: '', start_date: '', end_date: '', reason: '' });
  const [formError, setFormError] = useState('');
  const [approving, setApproving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [lrRes, empRes, ltRes] = await Promise.all([
        supabase.from('leave_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('employees').select('id, first_name, last_name, email').eq('employment_status', 'ACTIVE'),
        supabase.from('leave_types').select('id, name, annual_allocation').eq('is_active', true),
      ]);
      setRequests((lrRes.data || []) as unknown as LeaveRequest[]);
      setEmployees((empRes.data || []) as unknown as EmployeeRef[]);
      setLeaveTypes((ltRes.data || []) as unknown as LeaveTypeRef[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getDaysBetween = (start: string, end: string) => {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
  };

  const validateForm = async (): Promise<boolean> => {
    if (!form.employee_id || !form.leave_type_id || !form.start_date || !form.end_date) {
      setFormError('All required fields must be filled');
      return false;
    }
    if (new Date(form.end_date) < new Date(form.start_date)) {
      setFormError('End date cannot be before start date');
      return false;
    }

    // Check for overlapping approved leave
    const { data: overlaps } = await supabase
      .from('leave_requests')
      .select('id')
      .eq('employee_id', form.employee_id)
      .eq('status', 'APPROVED')
      .lte('start_date', form.end_date)
      .gte('end_date', form.start_date);
    if (overlaps && overlaps.length > 0) {
      setFormError('This employee already has approved leave overlapping these dates');
      return false;
    }

    // Check leave balance
    const lt = leaveTypes.find((l) => l.id === form.leave_type_id);
    if (lt && lt.annual_allocation > 0) {
      const requestedDays = getDaysBetween(form.start_date, form.end_date);
      const { data: used } = await supabase
        .from('leave_requests')
        .select('start_date, end_date')
        .eq('employee_id', form.employee_id)
        .eq('leave_type_id', form.leave_type_id)
        .eq('status', 'APPROVED');
      const usedDays = (used || []).reduce((sum: number, r: { start_date: string; end_date: string }) => {
        return sum + getDaysBetween(r.start_date, r.end_date);
      }, 0);
      if (usedDays + requestedDays > lt.annual_allocation) {
        setFormError(`Insufficient leave balance. Used: ${usedDays} days, requesting: ${requestedDays} days, annual allocation: ${lt.annual_allocation} days`);
        return false;
      }
    }

    setFormError('');
    return true;
  };

  const handleCreate = async () => {
    const valid = await validateForm();
    if (!valid) return;
    try {
      const { error } = await supabase.from('leave_requests').insert({
        employee_id: form.employee_id,
        leave_type_id: form.leave_type_id,
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason || null,
        status: 'PENDING',
      });
      if (error) throw error;
      toast.success('Leave request submitted');
      setCreateOpen(false);
      setForm({ employee_id: '', leave_type_id: '', start_date: '', end_date: '', reason: '' });
      load();
    } catch (err) {
      toast.error('Failed: ' + (err as Error).message);
    }
  };

  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setApproving(id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let approverId: string | null = null;
      if (user) {
        const { data: emp } = await supabase
          .from('employees')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();
        approverId = emp?.id || null;
      }

      const { error } = await supabase
        .from('leave_requests')
        .update({
          status,
          approved_at: new Date().toISOString(),
          approver_id: approverId,
        })
        .eq('id', id);
      if (error) throw error;
      toast.success(`Leave ${status.toLowerCase()}`);

      const req = requests.find((r) => r.id === id);
      if (req) {
        const emp = employees.find((e) => e.id === req.employee_id);
        const lt = leaveTypes.find((l) => l.id === req.leave_type_id);
        if (emp) {
          await enqueueAndProcess({
            eventKey: status === 'APPROVED' ? 'leave.approved' : 'leave.rejected',
            recipientEmail: emp.email,
            recipientName: `${emp.first_name} ${emp.last_name}`,
            subject: `Your leave request has been ${status.toLowerCase()}`,
            bodyHtml: `<p>Hi ${emp.first_name},</p><p>Your ${lt?.name || 'leave'} request from ${req.start_date} to ${req.end_date} has been <strong>${status.toLowerCase()}</strong>.</p>`,
            metadata: {
              employee_name: `${emp.first_name} ${emp.last_name}`,
              leave_type: lt?.name || '',
              start_date: req.start_date,
              end_date: req.end_date,
              status,
            },
          });
        }
      }
      load();
    } catch (err) {
      toast.error('Failed: ' + (err as Error).message);
    } finally {
      setApproving(null);
    }
  };

  const empName = (id: string) => {
    const e = employees.find((e) => e.id === id);
    return e ? `${e.first_name} ${e.last_name}` : '—';
  };
  const ltName = (id: string) => leaveTypes.find((l) => l.id === id)?.name || '—';

  const statusColors: Record<string, string> = {
    PENDING: 'bg-warning/10 text-warning',
    APPROVED: 'bg-success/10 text-success',
    REJECTED: 'bg-destructive/10 text-destructive',
  };

  const summaryCards: SummaryCard[] = [
    { label: 'Total Requests', value: requests.length, icon: CalendarDays, color: 'primary' },
    { label: 'Pending', value: requests.filter((r) => r.status === 'PENDING').length, icon: Clock, color: 'warning' },
    { label: 'Approved', value: requests.filter((r) => r.status === 'APPROVED').length, icon: CheckCircle, color: 'success' },
    { label: 'Rejected', value: requests.filter((r) => r.status === 'REJECTED').length, icon: XCircle, color: 'destructive' },
  ];

  const columns: Column<LeaveRequest>[] = [
    { key: 'employee', label: 'Employee', render: (r) => empName(r.employee_id), sortable: true },
    { key: 'type', label: 'Leave Type', render: (r) => ltName(r.leave_type_id) },
    { key: 'start_date', label: 'Start', sortable: true },
    { key: 'end_date', label: 'End', sortable: true },
    { key: 'reason', label: 'Reason', render: (r) => r.reason || '—' },
    {
      key: 'status', label: 'Status',
      render: (r) => <Badge variant="outline" className={statusColors[r.status] || ''}>{r.status}</Badge>,
    },
  ];

  return (
    <>
      <ModuleListPage
        title="Leave Requests"
        description="Manage employee leave applications and approvals"
        summaryCards={summaryCards}
        columns={columns}
        data={requests}
        loading={loading}
        searchPlaceholder="Search leave requests..."
        createLabel="New Request"
        onCreate={() => setCreateOpen(true)}
        rowActions={(r) => (
          r.status === 'PENDING' ? (
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="h-7 text-success" disabled={approving === r.id} onClick={() => handleAction(r.id, 'APPROVED')}>
                {approving === r.id ? '...' : 'Approve'}
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-destructive" disabled={approving === r.id} onClick={() => handleAction(r.id, 'REJECTED')}>
                Reject
              </Button>
            </div>
          ) : null
        )}
      />
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Leave Request</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Leave Type</Label>
              <Select value={form.leave_type_id} onValueChange={(v) => setForm({ ...form, leave_type_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((l) => <SelectItem key={l.id} value={l.id}>{l.name} ({l.annual_allocation} days/yr)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={2} />
            </div>
            {formError && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.employee_id || !form.leave_type_id || !form.start_date}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
