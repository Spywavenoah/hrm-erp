'use client';

import { useEffect, useState, useCallback } from 'react';
import { ModuleListPage, type SummaryCard, type Column } from '@/components/shared/module-list-page';
import { Target, CheckCircle, Clock, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';

interface Review {
  id: string;
  employee_id: string;
  review_cycle: string;
  reviewer_id: string | null;
  status: string;
  rating: number | null;
  feedback: string | null;
  submitted_at: string | null;
}

export default function PerformancePage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('performance_reviews')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReviews((data || []) as unknown as Review[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-muted text-muted-foreground',
    SUBMITTED: 'bg-info/10 text-info',
    COMPLETED: 'bg-success/10 text-success',
  };

  const summaryCards: SummaryCard[] = [
    { label: 'Total Reviews', value: reviews.length, icon: Target, color: 'primary' },
    { label: 'Draft', value: reviews.filter((r) => r.status === 'DRAFT').length, icon: Clock, color: 'warning' },
    { label: 'Submitted', value: reviews.filter((r) => r.status === 'SUBMITTED').length, icon: CheckCircle, color: 'info' },
    { label: 'Completed', value: reviews.filter((r) => r.status === 'COMPLETED').length, icon: Star, color: 'success' },
  ];

  const columns: Column<Review>[] = [
    { key: 'review_cycle', label: 'Cycle' },
    { key: 'rating', label: 'Rating', render: (r) => r.rating ? `${r.rating}/5` : '—' },
    { key: 'feedback', label: 'Feedback', render: (r) => r.feedback?.slice(0, 60) || '—' },
    {
      key: 'submitted_at', label: 'Submitted',
      render: (r) => r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—',
    },
    {
      key: 'status', label: 'Status',
      render: (r) => <Badge variant="outline" className={statusColors[r.status] || ''}>{r.status}</Badge>,
    },
  ];

  return (
    <ModuleListPage
      title="Performance Reviews"
      description="Manage employee performance evaluations and review cycles"
      summaryCards={summaryCards}
      columns={columns}
      data={reviews}
      searchPlaceholder="Search reviews..."
    />
  );
}
