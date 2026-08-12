'use client';

import { useEffect, useState, useCallback } from 'react';
import { ModuleListPage, type SummaryCard, type Column } from '@/components/shared/module-list-page';
import { Briefcase, Users, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Job {
  id: string;
  title: string;
  department_id: string | null;
  description: string | null;
  status: string;
  posted_date: string | null;
  closing_date: string | null;
}

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', requirements: '', closing_date: '' });

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('recruitment_jobs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setJobs((data || []) as unknown as Job[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    try {
      const { error } = await supabase.from('recruitment_jobs').insert({
        title: form.title,
        description: form.description || null,
        requirements: form.requirements || null,
        status: 'OPEN',
        posted_date: new Date().toISOString(),
        closing_date: form.closing_date || null,
      });
      if (error) throw error;
      toast.success('Job posted');
      setCreateOpen(false);
      setForm({ title: '', description: '', requirements: '', closing_date: '' });
      load();
    } catch (err) {
      toast.error('Failed: ' + (err as Error).message);
    }
  };

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-muted text-muted-foreground',
    OPEN: 'bg-success/10 text-success',
    CLOSED: 'bg-destructive/10 text-destructive',
  };

  const summaryCards: SummaryCard[] = [
    { label: 'Total Jobs', value: jobs.length, icon: Briefcase, color: 'primary' },
    { label: 'Open', value: jobs.filter((j) => j.status === 'OPEN').length, icon: CheckCircle, color: 'success' },
    { label: 'Draft', value: jobs.filter((j) => j.status === 'DRAFT').length, icon: Clock, color: 'warning' },
    { label: 'Closed', value: jobs.filter((j) => j.status === 'CLOSED').length, icon: Users, color: 'destructive' },
  ];

  const columns: Column<Job>[] = [
    { key: 'title', label: 'Job Title' },
    { key: 'description', label: 'Description', render: (j) => j.description?.slice(0, 60) + '...' || '—' },
    { key: 'posted_date', label: 'Posted', render: (j) => j.posted_date ? new Date(j.posted_date).toLocaleDateString() : '—' },
    { key: 'closing_date', label: 'Closing', render: (j) => j.closing_date || '—' },
    {
      key: 'status', label: 'Status',
      render: (j) => <Badge variant="outline" className={statusColors[j.status] || ''}>{j.status}</Badge>,
    },
  ];

  return (
    <>
      <ModuleListPage
        title="Recruitment"
        description="Manage job postings and candidate pipelines"
        summaryCards={summaryCards}
        columns={columns}
        data={jobs}
        searchPlaceholder="Search jobs..."
        createLabel="Post Job"
        onCreate={() => setCreateOpen(true)}
      />
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Post a Job</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Job Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Senior Frontend Engineer" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Requirements</Label>
              <Textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Closing Date</Label>
              <Input type="date" value={form.closing_date} onChange={(e) => setForm({ ...form, closing_date: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.title}>Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
