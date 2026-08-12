'use client';

import { useEffect, useState, useCallback } from 'react';
import { ModuleListPage, type SummaryCard, type Column } from '@/components/shared/module-list-page';
import { CalendarDays, CheckCircle, XCircle, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface LeaveType {
  id: string;
  name: string;
  code: string;
  description: string | null;
  accrual_policy: string;
  annual_allocation: number;
  carry_forward_limit: number;
  is_paid: boolean;
  is_active: boolean;
}

export default function LeaveTypesPage() {
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '', annual_allocation: '0', carry_forward_limit: '0', is_paid: true });

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('leave_types').select('*').order('name');
      if (error) throw error;
      setTypes((data || []) as unknown as LeaveType[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    try {
      const { error } = await supabase.from('leave_types').insert({
        name: form.name,
        code: form.code.toUpperCase(),
        description: form.description || null,
        accrual_policy: 'FIXED',
        annual_allocation: parseFloat(form.annual_allocation) || 0,
        carry_forward_limit: parseFloat(form.carry_forward_limit) || 0,
        is_paid: form.is_paid,
        is_active: true,
      });
      if (error) throw error;
      toast.success('Leave type created');
      setCreateOpen(false);
      setForm({ name: '', code: '', description: '', annual_allocation: '0', carry_forward_limit: '0', is_paid: true });
      load();
    } catch (err) {
      toast.error('Failed: ' + (err as Error).message);
    }
  };

  const summaryCards: SummaryCard[] = [
    { label: 'Total Types', value: types.length, icon: CalendarDays, color: 'primary' },
    { label: 'Active', value: types.filter((t) => t.is_active).length, icon: CheckCircle, color: 'success' },
    { label: 'Paid Leave', value: types.filter((t) => t.is_paid).length, icon: Plus, color: 'info' },
    { label: 'Unpaid', value: types.filter((t) => !t.is_paid).length, icon: XCircle, color: 'destructive' },
  ];

  const columns: Column<LeaveType>[] = [
    { key: 'name', label: 'Name' },
    { key: 'code', label: 'Code' },
    { key: 'annual_allocation', label: 'Annual Allocation', render: (t) => `${t.annual_allocation} days` },
    { key: 'carry_forward_limit', label: 'Carry Forward', render: (t) => `${t.carry_forward_limit} days` },
    {
      key: 'is_paid', label: 'Paid',
      render: (t) => <Badge variant="outline" className={t.is_paid ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}>{t.is_paid ? 'Paid' : 'Unpaid'}</Badge>,
    },
    {
      key: 'is_active', label: 'Status',
      render: (t) => <Badge variant="outline" className={t.is_active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}>{t.is_active ? 'Active' : 'Inactive'}</Badge>,
    },
  ];

  return (
    <>
      <ModuleListPage
        title="Leave Types"
        description="Configure leave categories, allocations, and policies"
        summaryCards={summaryCards}
        columns={columns}
        data={types}
        searchPlaceholder="Search leave types..."
        createLabel="Add Type"
        onCreate={() => setCreateOpen(true)}
      />
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Leave Type</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Annual Leave" />
              </div>
              <div className="space-y-1.5">
                <Label>Code *</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="ANL" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Annual Allocation (days)</Label>
                <Input type="number" value={form.annual_allocation} onChange={(e) => setForm({ ...form, annual_allocation: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Carry Forward Limit (days)</Label>
                <Input type="number" value={form.carry_forward_limit} onChange={(e) => setForm({ ...form, carry_forward_limit: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_paid} onCheckedChange={(v) => setForm({ ...form, is_paid: v })} />
              <Label className="cursor-pointer" onClick={() => setForm({ ...form, is_paid: !form.is_paid })}>Paid Leave</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.name || !form.code}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
