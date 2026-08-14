'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ModuleListPage, type SummaryCard, type Column } from '@/components/shared/module-list-page';
import { Users, UserPlus, UserCheck, UserX, Mail, MoreHorizontal, Eye, Pencil, Trash2, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Employee } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { enqueueAndProcess } from '@/lib/notifications';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-success/10 text-success border-success/20',
  PENDING_VERIFICATION: 'bg-warning/10 text-warning border-warning/20',
  ONBOARDING: 'bg-info/10 text-info border-info/20',
  ON_LEAVE: 'bg-primary/10 text-primary border-primary/20',
  TERMINATED: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [resending, setResending] = useState<string | null>(null);
  const [newEmp, setNewEmp] = useState({ first_name: '', last_name: '', email: '', employee_id: '' });

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEmployees((data || []) as unknown as Employee[]);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const handleCreate = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmp.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert({
          ...newEmp,
          employment_status: 'PENDING_VERIFICATION',
        })
        .select()
        .single();
      if (error) throw error;
      toast.success('Employee created successfully');
      setCreateOpen(false);
      setNewEmp({ first_name: '', last_name: '', email: '', employee_id: '' });
      loadEmployees();

      await enqueueAndProcess({
        eventKey: 'welcome.new_employee',
        recipientEmail: newEmp.email,
        recipientName: `${newEmp.first_name} ${newEmp.last_name}`,
        subject: `Welcome to the team, ${newEmp.first_name}!`,
        bodyHtml: `<p>Hi ${newEmp.first_name},</p><p>Welcome aboard! Your employee account has been created. Please complete your profile at your earliest convenience.</p>`,
        metadata: {
          employee_name: `${newEmp.first_name} ${newEmp.last_name}`,
          employee_email: newEmp.email,
          first_name: newEmp.first_name,
        },
      });

      router.push(`/employees/${data.id}/personal`);
    } catch (err) {
      toast.error('Failed to create employee: ' + (err as Error).message);
    }
  };

  const handleResendInvitation = async (emp: Employee) => {
    setResending(emp.id);
    try {
      const setupLink = `${window.location.origin}/setup-account?email=${encodeURIComponent(emp.email)}`;
      await enqueueAndProcess({
        eventKey: 'password.setup',
        recipientEmail: emp.email,
        recipientName: `${emp.first_name} ${emp.last_name}`,
        subject: `Set up your HR Flow account, ${emp.first_name}`,
        bodyHtml: `<p>Hi ${emp.first_name},</p><p>An account has been created for you on HR Flow. Click the link below to set up your password and complete your profile:</p><p><a href="${setupLink}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">Set Up Your Account</a></p><p>If you did not expect this email, please contact your HR administrator.</p><p>Best regards,<br/>The HR Flow Team</p>`,
        metadata: {
          employee_name: `${emp.first_name} ${emp.last_name}`,
          employee_email: emp.email,
          first_name: emp.first_name,
          setup_link: setupLink,
        },
      });
      toast.success(`Invitation resent to ${emp.email}`);
    } catch (err) {
      toast.error('Failed to resend: ' + (err as Error).message);
    } finally {
      setResending(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
      toast.success('Employee deleted');
      loadEmployees();
    } catch (err) {
      toast.error('Failed to delete: ' + (err as Error).message);
    }
  };

  const summaryCards: SummaryCard[] = [
    { label: 'Total Employees', value: employees.length, icon: Users, color: 'primary' },
    { label: 'Active', value: employees.filter((e) => e.employment_status === 'ACTIVE').length, icon: UserCheck, color: 'success' },
    { label: 'Pending Onboarding', value: employees.filter((e) => e.employment_status === 'PENDING_VERIFICATION').length, icon: UserPlus, color: 'warning' },
    { label: 'Terminated', value: employees.filter((e) => e.employment_status === 'TERMINATED').length, icon: UserX, color: 'destructive' },
  ];

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (emp) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {emp.first_name[0]}{emp.last_name[0]}
          </div>
          <div>
            <p className="font-medium">{emp.first_name} {emp.last_name}</p>
            <p className="text-xs text-muted-foreground">{emp.employee_id || '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (e) => e.phone || '—' },
    {
      key: 'employment_type',
      label: 'Type',
      render: (e) => <span className="text-sm">{e.employment_type.replace('_', ' ')}</span>,
    },
    {
      key: 'employment_status',
      label: 'Status',
      render: (e) => (
        <Badge variant="outline" className={statusColors[e.employment_status] || ''}>
          {e.employment_status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <ModuleListPage
        title="Employees"
        description="Manage your organization's employee records"
        summaryCards={summaryCards}
        columns={columns}
        data={employees}
        searchPlaceholder="Search employees..."
        createLabel="Add Employee"
        onCreate={() => setCreateOpen(true)}
        onRowClick={(emp) => router.push(`/employees/${emp.id}/personal`)}
        rowActions={(emp) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/employees/${emp.id}/personal`)}>
                <Eye className="mr-2 h-4 w-4" /> View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/employees/${emp.id}/personal`)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={resending === emp.id}
                onClick={() => handleResendInvitation(emp)}
              >
                {resending === emp.id ? (
                  <Send className="mr-2 h-4 w-4 animate-pulse" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                {resending === emp.id ? 'Sending...' : 'Resend Invitation'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDelete(emp.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Register Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Enter the basics — the employee will complete their full profile via self-onboarding.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <Input
                  value={newEmp.first_name}
                  onChange={(e) => setNewEmp({ ...newEmp, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name *</Label>
                <Input
                  value={newEmp.last_name}
                  onChange={(e) => setNewEmp({ ...newEmp, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input
                type="email"
                value={newEmp.email}
                onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Staff ID</Label>
              <Input
                value={newEmp.employee_id}
                onChange={(e) => setNewEmp({ ...newEmp, employee_id: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newEmp.first_name || !newEmp.email}>
              Create & Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
