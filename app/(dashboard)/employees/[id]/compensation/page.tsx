'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function CompensationPage() {
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    compensation_grade: '',
    bank_name: '',
    bank_account_number: '',
    bank_routing_number: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('compensation_grade, bank_name, bank_account_number, bank_routing_number')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setForm({
            compensation_grade: data.compensation_grade || '',
            bank_name: data.bank_name || '',
            bank_account_number: data.bank_account_number || '',
            bank_routing_number: data.bank_routing_number || '',
          });
        }
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
          compensation_grade: form.compensation_grade || null,
          bank_name: form.bank_name || null,
          bank_account_number: form.bank_account_number || null,
          bank_routing_number: form.bank_routing_number || null,
        })
        .eq('id', id);
      if (error) throw error;
      toast.success('Compensation information saved');
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
        <CardTitle className="text-lg">Compensation & Banking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1.5">
          <Label>Compensation Grade</Label>
          <Input value={form.compensation_grade} onChange={(e) => setForm({ ...form, compensation_grade: e.target.value })} placeholder="e.g. Level 5, Band B" />
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Bank Details</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Bank Name</Label>
              <Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Account Number</Label>
              <Input value={form.bank_account_number} onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })} />
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <Label>Routing Number</Label>
            <Input value={form.bank_routing_number} onChange={(e) => setForm({ ...form, bank_routing_number: e.target.value })} />
          </div>
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
