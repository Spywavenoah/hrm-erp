'use client';

import { useEffect, useState, useCallback } from 'react';
import { ModuleListPage, type SummaryCard, type Column } from '@/components/shared/module-list-page';
import { UserPlus, Users, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { enqueueAndProcess } from '@/lib/notifications';

interface Candidate {
  id: string;
  job_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  current_stage: string;
  rating: number | null;
  notes: string | null;
  created_at: string;
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ job_id: '', first_name: '', last_name: '', email: '', phone: '', notes: '' });

  const load = useCallback(async () => {
    try {
      const [cRes, jRes] = await Promise.all([
        supabase.from('candidates').select('*').order('created_at', { ascending: false }),
        supabase.from('recruitment_jobs').select('id, title').eq('status', 'OPEN'),
      ]);
      setCandidates((cRes.data || []) as unknown as Candidate[]);
      setJobs(jRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    try {
      const { error } = await supabase.from('candidates').insert({
        job_id: form.job_id,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || null,
        notes: form.notes || null,
        current_stage: 'APPLIED',
      });
      if (error) throw error;
      toast.success('Candidate added');
      setCreateOpen(false);
      setForm({ job_id: '', first_name: '', last_name: '', email: '', phone: '', notes: '' });
      load();
    } catch (err) {
      toast.error('Failed: ' + (err as Error).message);
    }
  };

  const jobTitle = (id: string) => jobs.find((j) => j.id === id)?.title || '—';

  const stageColors: Record<string, string> = {
    APPLIED: 'bg-muted text-muted-foreground',
    SCREENING: 'bg-info/10 text-info',
    INTERVIEW: 'bg-warning/10 text-warning',
    OFFER: 'bg-primary/10 text-primary',
    HIRED: 'bg-success/10 text-success',
    REJECTED: 'bg-destructive/10 text-destructive',
  };

  const summaryCards: SummaryCard[] = [
    { label: 'Total Candidates', value: candidates.length, icon: Users, color: 'primary' },
    { label: 'Applied', value: candidates.filter((c) => c.current_stage === 'APPLIED').length, icon: Clock, color: 'warning' },
    { label: 'Interview', value: candidates.filter((c) => c.current_stage === 'INTERVIEW').length, icon: UserPlus, color: 'info' },
    { label: 'Hired', value: candidates.filter((c) => c.current_stage === 'HIRED').length, icon: CheckCircle, color: 'success' },
  ];

  const columns: Column<Candidate>[] = [
    { key: 'name', label: 'Name', render: (c) => `${c.first_name} ${c.last_name}` },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (c) => c.phone || '—' },
    { key: 'job', label: 'Position', render: (c) => jobTitle(c.job_id) },
    { key: 'rating', label: 'Rating', render: (c) => c.rating ? `${c.rating}/5` : '—' },
    {
      key: 'current_stage', label: 'Stage',
      render: (c) => <Badge variant="outline" className={stageColors[c.current_stage] || ''}>{c.current_stage}</Badge>,
    },
  ];

  return (
    <>
      <ModuleListPage
        title="Candidates"
        description="Track applicants through your hiring pipeline"
        summaryCards={summaryCards}
        columns={columns}
        data={candidates}
        searchPlaceholder="Search candidates..."
        createLabel="Add Candidate"
        onCreate={() => setCreateOpen(true)}
        rowActions={(c) => (
          c.current_stage !== 'HIRED' && c.current_stage !== 'REJECTED' ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7"
              onClick={async () => {
                const stages = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED'];
                const next = stages[stages.indexOf(c.current_stage) + 1];
                if (next) {
                  await supabase.from('candidates').update({ current_stage: next }).eq('id', c.id);
                  toast.success(`Moved to ${next}`);
                  await enqueueAndProcess({
                    eventKey: 'candidate.stage_changed',
                    recipientEmail: c.email,
                    recipientName: `${c.first_name} ${c.last_name}`,
                    subject: `Application status update: ${next}`,
                    bodyHtml: `<p>Hi ${c.first_name},</p><p>Your application status has been updated to <strong>${next}</strong>.</p>`,
                    metadata: {
                      candidate_name: `${c.first_name} ${c.last_name}`,
                      stage: next,
                    },
                  });
                  load();
                }
              }}
            >
              Advance
            </Button>
          ) : null
        )}
      />
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Candidate</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Job Posting</Label>
              <Select value={form.job_id} onValueChange={(v) => setForm({ ...form, job_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select job" /></SelectTrigger>
                <SelectContent>
                  {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name *</Label>
                <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.job_id || !form.first_name || !form.last_name || !form.email}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
