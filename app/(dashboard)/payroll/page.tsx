'use client';

import { useEffect, useState, useCallback } from 'react';
import { ModuleListPage, type SummaryCard, type Column } from '@/components/shared/module-list-page';
import { Wallet, FileText, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { enqueueAndProcess } from '@/lib/notifications';

interface PayrollRun {
  id: string;
  name: string;
  pay_period_start: string;
  pay_period_end: string;
  status: string;
  total_gross: number;
  total_deductions: number;
  total_net: number;
}

export default function PayrollPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', pay_period_start: '', pay_period_end: '' });

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_runs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRuns((data || []) as unknown as PayrollRun[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    try {
      const { error } = await supabase.from('payroll_runs').insert({
        name: form.name,
        pay_period_start: form.pay_period_start,
        pay_period_end: form.pay_period_end,
        status: 'DRAFT',
      });
      if (error) throw error;
      toast.success('Payroll run created');
      setCreateOpen(false);
      setForm({ name: '', pay_period_start: '', pay_period_end: '' });
      load();
    } catch (err) {
      toast.error('Failed: ' + (err as Error).message);
    }
  };

  const handleApprove = async (run: PayrollRun) => {
    try {
      const { error } = await supabase
        .from('payroll_runs')
        .update({ status: 'APPROVED', approved_at: new Date().toISOString() })
        .eq('id', run.id);
      if (error) throw error;
      toast.success('Payroll run approved');

      const { data: payslips } = await supabase
        .from('payslips')
        .select('employee_id')
        .eq('payroll_run_id', run.id);

      if (payslips && payslips.length > 0) {
        const empIds = payslips.map((p) => p.employee_id);
        const { data: emps } = await supabase
          .from('employees')
          .select('email, first_name, last_name')
          .in('id', empIds);

        for (const emp of emps || []) {
          await enqueueAndProcess({
            eventKey: 'payroll.payslip_ready',
            recipientEmail: emp.email,
            recipientName: `${emp.first_name} ${emp.last_name}`,
            subject: `Payslip ready for ${run.name}`,
            bodyHtml: `<p>Hi ${emp.first_name},</p><p>Your payslip for <strong>${run.name}</strong> (period ${run.pay_period_start} to ${run.pay_period_end}) is now available.</p>`,
            metadata: {
              employee_name: `${emp.first_name} ${emp.last_name}`,
              payroll_name: run.name,
              net_pay: String(run.total_net),
            },
          });
        }
      }
      load();
    } catch (err) {
      toast.error('Failed: ' + (err as Error).message);
    }
  };

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-muted text-muted-foreground',
    CALCULATED: 'bg-info/10 text-info',
    REVIEWED: 'bg-warning/10 text-warning',
    APPROVED: 'bg-primary/10 text-primary',
    DISBURSED: 'bg-success/10 text-success',
  };

  const summaryCards: SummaryCard[] = [
    { label: 'Total Runs', value: runs.length, icon: Wallet, color: 'primary' },
    { label: 'Draft', value: runs.filter((r) => r.status === 'DRAFT').length, icon: FileText, color: 'warning' },
    { label: 'Approved', value: runs.filter((r) => r.status === 'APPROVED').length, icon: CheckCircle, color: 'success' },
    { label: 'Disbursed', value: runs.filter((r) => r.status === 'DISBURSED').length, icon: Clock, color: 'info' },
  ];

  const columns: Column<PayrollRun>[] = [
    { key: 'name', label: 'Run Name' },
    { key: 'pay_period_start', label: 'Period Start' },
    { key: 'pay_period_end', label: 'Period End' },
    { key: 'total_gross', label: 'Gross', render: (r) => `$${r.total_gross.toLocaleString()}` },
    { key: 'total_net', label: 'Net', render: (r) => `$${r.total_net.toLocaleString()}` },
    {
      key: 'status', label: 'Status',
      render: (r) => <Badge variant="outline" className={statusColors[r.status] || ''}>{r.status}</Badge>,
    },
  ];

  return (
    <>
      <ModuleListPage
        title="Payroll Runs"
        description="Manage payroll cycles from draft to disbursement"
        summaryCards={summaryCards}
        columns={columns}
        data={runs}
        searchPlaceholder="Search payroll runs..."
        createLabel="New Run"
        onCreate={() => setCreateOpen(true)}
        rowActions={(r) =>
          r.status === 'DRAFT' || r.status === 'REVIEWED' ? (
            <Button size="sm" variant="outline" className="h-7 text-success" onClick={() => handleApprove(r)}>Approve</Button>
          ) : null
        }
      />
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Payroll Run</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Run Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="August 2026 Payroll" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Period Start</Label>
                <Input type="date" value={form.pay_period_start} onChange={(e) => setForm({ ...form, pay_period_start: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Period End</Label>
                <Input type="date" value={form.pay_period_end} onChange={(e) => setForm({ ...form, pay_period_end: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.name}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
