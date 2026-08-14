'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { FileText, Plus, Trash2, AlertCircle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

interface Doc {
  id: string;
  title: string;
  document_type: string | null;
  file_url: string | null;
  expiry_date: string | null;
  status: string;
  uploaded_at: string;
}

export default function DocumentsPage() {
  const params = useParams();
  const id = params.id as string;
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', document_type: '', file_url: '', expiry_date: '' });

  const loadDocs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', id)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      setDocs((data || []) as unknown as Doc[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleAdd = async () => {
    try {
      const { error } = await supabase.from('employee_documents').insert({
        employee_id: id,
        title: newDoc.title,
        document_type: newDoc.document_type || null,
        file_url: newDoc.file_url || null,
        expiry_date: newDoc.expiry_date || null,
      });
      if (error) throw error;
      toast.success('Document added');
      setAddOpen(false);
      setNewDoc({ title: '', document_type: '', file_url: '', expiry_date: '' });
      loadDocs();
    } catch (err) {
      toast.error('Failed to add: ' + (err as Error).message);
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      const { error } = await supabase.from('employee_documents').delete().eq('id', docId);
      if (error) throw error;
      toast.success('Document deleted');
      loadDocs();
    } catch (err) {
      toast.error('Failed to delete: ' + (err as Error).message);
    }
  };

  const isExpiringSoon = (expiry: string | null) => {
    if (!expiry) return false;
    const days = (new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days < 30 && days > 0;
  };

  const isExpired = (expiry: string | null) => {
    if (!expiry) return false;
    return new Date(expiry) < new Date();
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Documents</CardTitle>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Document
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-accent/30 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {doc.document_type && (
                      <span className="text-xs text-muted-foreground">{doc.document_type}</span>
                    )}
                    {doc.expiry_date && isExpired(doc.expiry_date) && (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                        <AlertCircle className="mr-1 h-3 w-3" /> Expired
                      </Badge>
                    )}
                    {doc.expiry_date && isExpiringSoon(doc.expiry_date) && (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        <AlertCircle className="mr-1 h-3 w-3" /> Expiring Soon
                      </Badge>
                    )}
                  </div>
                </div>
                {doc.file_url && (
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">View</Button>
                  </a>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(doc.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={newDoc.title} onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Document Type</Label>
              <Input value={newDoc.document_type} onChange={(e) => setNewDoc({ ...newDoc, document_type: e.target.value })} placeholder="e.g. Contract, ID Scan, Certificate" />
            </div>
            <div className="space-y-1.5">
              <Label>File URL</Label>
              <Input value={newDoc.file_url} onChange={(e) => setNewDoc({ ...newDoc, file_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>Expiry Date</Label>
              <Input type="date" value={newDoc.expiry_date} onChange={(e) => setNewDoc({ ...newDoc, expiry_date: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!newDoc.title}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
