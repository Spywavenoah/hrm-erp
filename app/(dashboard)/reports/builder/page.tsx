'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Wrench, Plus, X, Download, Table as TableIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const modules = [
  {
    key: 'employees',
    label: 'Employees',
    table: 'employees',
    fields: [
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'employment_type', label: 'Employment Type' },
      { key: 'employment_status', label: 'Status' },
      { key: 'hire_date', label: 'Hire Date' },
    ],
  },
  {
    key: 'attendance',
    label: 'Attendance',
    table: 'attendance',
    fields: [
      { key: 'date', label: 'Date' },
      { key: 'clock_in', label: 'Clock In' },
      { key: 'clock_out', label: 'Clock Out' },
      { key: 'work_hours', label: 'Work Hours' },
      { key: 'status', label: 'Status' },
    ],
  },
  {
    key: 'leave_requests',
    label: 'Leave',
    table: 'leave_requests',
    fields: [
      { key: 'start_date', label: 'Start Date' },
      { key: 'end_date', label: 'End Date' },
      { key: 'reason', label: 'Reason' },
      { key: 'status', label: 'Status' },
    ],
  },
  {
    key: 'payroll_runs',
    label: 'Payroll',
    table: 'payroll_runs',
    fields: [
      { key: 'name', label: 'Run Name' },
      { key: 'pay_period_start', label: 'Period Start' },
      { key: 'pay_period_end', label: 'Period End' },
      { key: 'total_gross', label: 'Gross' },
      { key: 'total_deductions', label: 'Deductions' },
      { key: 'total_net', label: 'Net' },
      { key: 'status', label: 'Status' },
    ],
  },
  {
    key: 'assets',
    label: 'Assets',
    table: 'assets',
    fields: [
      { key: 'asset_tag', label: 'Asset Tag' },
      { key: 'name', label: 'Name' },
      { key: 'asset_type', label: 'Type' },
      { key: 'serial_number', label: 'Serial' },
      { key: 'status', label: 'Status' },
    ],
  },
  {
    key: 'performance_reviews',
    label: 'Performance',
    table: 'performance_reviews',
    fields: [
      { key: 'review_cycle', label: 'Cycle' },
      { key: 'rating', label: 'Rating' },
      { key: 'status', label: 'Status' },
      { key: 'feedback', label: 'Feedback' },
    ],
  },
];

export default function ReportBuilderPage() {
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const module = modules.find((m) => m.key === selectedModule);

  const addColumn = (colKey: string) => {
    if (!selectedColumns.includes(colKey)) {
      setSelectedColumns([...selectedColumns, colKey]);
    }
  };

  const removeColumn = (colKey: string) => {
    setSelectedColumns(selectedColumns.filter((c) => c !== colKey));
  };

  const runReport = useCallback(async () => {
    if (!module || selectedColumns.length === 0) {
      toast.error('Select a module and at least one column');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(module.table)
        .select(selectedColumns.join(','))
        .limit(500);
      if (error) throw error;
      setRows((data || []) as unknown as Record<string, unknown>[]);
      setHasRun(true);
      toast.success(`${data?.length || 0} records loaded`);
    } catch (err) {
      toast.error('Failed to load: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [module, selectedColumns]);

  const handleExport = () => {
    if (rows.length === 0) {
      toast.error('Run the report first to load data');
      return;
    }
    const colLabels = selectedColumns.map((key) => {
      const f = module?.fields.find((f) => f.key === key);
      return f?.label || key;
    });
    const csvLines: string[] = [colLabels.join(',')];
    for (const row of rows) {
      const vals = selectedColumns.map((key) => {
        const val = row[key];
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('\n') ? `"${str}"` : str;
      });
      csvLines.push(vals.join(','));
    }
    const csv = csvLines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${module?.label || 'report'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported as CSV');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Report Builder</h1>
        <p className="mt-1 text-sm text-muted-foreground">Build custom reports by selecting fields from any module, then export to CSV</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Wrench className="h-4 w-4" /> Configuration</CardTitle>
            <CardDescription>Select a data source and fields</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Module</Label>
              <Select value={selectedModule} onValueChange={(v) => { setSelectedModule(v); setSelectedColumns([]); setRows([]); setHasRun(false); }}>
                <SelectTrigger><SelectValue placeholder="Choose a module" /></SelectTrigger>
                <SelectContent>
                  {modules.map((m) => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {module && (
              <div className="space-y-2">
                <Label>Available Fields</Label>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {module.fields.map((field) => (
                    <button
                      key={field.key}
                      onClick={() => addColumn(field.key)}
                      disabled={selectedColumns.includes(field.key)}
                      className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent disabled:opacity-40"
                    >
                      <Plus className="h-3 w-3" />
                      {field.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Selected Columns & Preview</CardTitle>
                <CardDescription>Add fields, run the report, then export</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={runReport} disabled={selectedColumns.length === 0 || loading}>
                  {loading ? 'Loading...' : 'Run Report'}
                </Button>
                <Button size="sm" variant="outline" onClick={handleExport} disabled={rows.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedColumns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <TableIcon className="h-10 w-10 opacity-40 mb-2" />
                <p className="text-sm">No columns selected yet.</p>
                <p className="text-xs mt-1">Pick a module on the left, then add fields to build your report.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {selectedColumns.map((colKey) => {
                    const f = module?.fields.find((f) => f.key === colKey);
                    return (
                      <Badge key={colKey} variant="secondary" className="gap-1.5 pr-1.5">
                        {f?.label || colKey}
                        <button onClick={() => { removeColumn(colKey); setRows([]); setHasRun(false); }} className="rounded-full hover:bg-destructive/20 p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>

                {hasRun && (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="overflow-x-auto max-h-96">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {selectedColumns.map((colKey) => {
                              const f = module?.fields.find((f) => f.key === colKey);
                              return <TableHead key={colKey}>{f?.label || colKey}</TableHead>;
                            })}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={selectedColumns.length} className="h-16 text-center text-muted-foreground">
                                No data found
                              </TableCell>
                            </TableRow>
                          ) : (
                            rows.slice(0, 100).map((row, idx) => (
                              <TableRow key={idx}>
                                {selectedColumns.map((colKey) => (
                                  <TableCell key={colKey} className="text-sm">
                                    {row[colKey] === null || row[colKey] === undefined ? '—' : String(row[colKey])}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {rows.length > 100 && (
                      <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                        Showing first 100 of {rows.length} rows. Export to see all data.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
