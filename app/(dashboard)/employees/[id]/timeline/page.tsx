'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';

interface AuditEntry {
  id: string;
  action: string;
  field_key: string | null;
  old_value: unknown;
  new_value: unknown;
  created_at: string;
}

export default function TimelinePage() {
  const params = useParams();
  const id = params.id as string;
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('audit_log')
          .select('*')
          .eq('module_key', 'employee')
          .eq('record_id', id)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        setEntries((data || []) as unknown as AuditEntry[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg">Timeline & Audit History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">No activity recorded yet.</p>
          </div>
        ) : (
          <div className="relative space-y-4 before:absolute before:left-2 before:top-0 before:h-full before:w-px before:bg-border">
            {entries.map((entry) => (
              <div key={entry.id} className="relative pl-8">
                <div className="absolute left-0 top-1 h-4 w-4 rounded-full border-2 border-primary bg-card" />
                <p className="text-sm font-medium">{entry.action}</p>
                {entry.field_key && (
                  <p className="text-xs text-muted-foreground">
                    Field: {entry.field_key}
                    {entry.old_value !== null && ` · From: ${JSON.stringify(entry.old_value)}`}
                    {entry.new_value !== null && ` · To: ${JSON.stringify(entry.new_value)}`}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(entry.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
