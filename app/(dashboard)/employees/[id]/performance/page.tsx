'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { Target } from 'lucide-react';

interface Review {
  id: string;
  review_cycle: string;
  reviewer_id: string | null;
  status: string;
  rating: number | null;
  feedback: string | null;
  submitted_at: string | null;
  created_at: string;
}

export default function PerformancePage() {
  const params = useParams();
  const id = params.id as string;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('performance_reviews')
          .select('*')
          .eq('employee_id', id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setReviews((data || []) as unknown as Review[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-muted text-muted-foreground',
    SUBMITTED: 'bg-info/10 text-info',
    COMPLETED: 'bg-success/10 text-success',
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg">Performance Reviews</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Target className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">No performance reviews yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{review.review_cycle}</p>
                    {review.rating && (
                      <p className="text-sm text-muted-foreground mt-0.5">Rating: {review.rating}/5</p>
                    )}
                  </div>
                  <Badge variant="outline" className={statusColors[review.status] || ''}>
                    {review.status}
                  </Badge>
                </div>
                {review.feedback && (
                  <p className="mt-2 text-sm text-muted-foreground">{review.feedback}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
