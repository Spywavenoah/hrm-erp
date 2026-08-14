'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function EmploymentPage() {
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [positions, setPositions] = useState<{ id: string; title: string }[]>([]);
  const [managers, setManagers] = useState<{ id: string; first_name: string; last_name: string }[]>([]);
  const [form, setForm] = useState({
    employment_type: 'FULL_TIME',
    employment_status: 'PENDING_VERIFICATION',
    hire_date: '',
    position_id: '',
    department_id: '',
    reporting_manager_id: '',
    compensation_grade: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const [empRes, deptRes, posRes, mgrRes] = await Promise.all([
          supabase.from('employees').select('*').eq('id', id).maybeSingle(),
          supabase.from('departments').select('id, name').eq('is_active', true),
          supabase.from('positions').select('id, title'),
          supabase.from('employees').select('id, first_name, last_name').neq('id', id),
        ]);

        if (empRes.data) {
          setForm({
            employment_type: empRes.data.employment_type || 'FULL_TIME',
            employment_status: empRes.data.employment_status || 'PENDING_VERIFICATION',
            hire_date: empRes.data.hire_date || '',
            position_id: empRes.data.position_id || '',
            department_id: empRes.data.department_id || '',
            reporting_manager_id: empRes.data.reporting_manager_id || '',
            compensation_grade: empRes.data.compensation_grade || '',
          });
        }
        setDepartments(deptRes.data || []);
        setPositions(posRes.data || []);
        setManagers(mgrRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          employment_type: form.employment_type,
          employment_status: form.employment_status,
          hire_date: form.hire_date || null,
          position_id: form.position_id || null,
          department_id: form.department_id || null,
          reporting_manager_id: form.reporting_manager_id || null,
          compensation_grade: form.compensation_grade || null,
        })
        .eq('id', id);
      if (error) throw error;
      toast.success('Employment information saved');
    } catch (err) {
      toast.error('Failed to save: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-64 animate-pulse rounded-lg bg-muted" />;

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg">Employment Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Employment Type</Label>
            <Select value={form.employment_type} onValueChange={(v) => setForm({ ...form, employment_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FULL_TIME">Full Time</SelectItem>
                <SelectItem value="PART_TIME">Part Time</SelectItem>
                <SelectItem value="CONTRACT">Contract</SelectItem>
                <SelectItem value="INTERN">Intern</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Employment Status</Label>
            <Select value={form.employment_status} onValueChange={(v) => setForm({ ...form, employment_status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING_VERIFICATION">Pending Verification</SelectItem>
                <SelectItem value="ONBOARDING">Onboarding</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Hire Date</Label>
            <Input type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Compensation Grade</Label>
            <Input value={form.compensation_grade} onChange={(e) => setForm({ ...form, compensation_grade: e.target.value })} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Position</Label>
            <Select value={form.position_id} onValueChange={(v) => setForm({ ...form, position_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
              <SelectContent>
                {positions.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Reporting Manager</Label>
          <Select value={form.reporting_manager_id} onValueChange={(v) => setForm({ ...form, reporting_manager_id: v })}>
            <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
            <SelectContent>
              {managers.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.first_name} {m.last_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end border-t border-border pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
