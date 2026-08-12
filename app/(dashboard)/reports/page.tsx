'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const turnoverData = [
  { month: 'Jan', hires: 8, exits: 3 },
  { month: 'Feb', hires: 5, exits: 2 },
  { month: 'Mar', hires: 10, exits: 4 },
  { month: 'Apr', hires: 7, exits: 1 },
  { month: 'May', hires: 12, exits: 5 },
  { month: 'Jun', hires: 6, exits: 3 },
  { month: 'Jul', hires: 9, exits: 2 },
  { month: 'Aug', hires: 11, exits: 4 },
];

const payrollCostData = [
  { month: 'Jan', cost: 248000 },
  { month: 'Feb', cost: 252000 },
  { month: 'Mar', cost: 258000 },
  { month: 'Apr', cost: 265000 },
  { month: 'May', cost: 271000 },
  { month: 'Jun', cost: 278000 },
  { month: 'Jul', cost: 282000 },
  { month: 'Aug', cost: 285000 },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pre-built dashboards and custom report builder</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hires vs Exits</CardTitle>
            <CardDescription>Monthly workforce movement</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={turnoverData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="hires" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} name="Hires" />
                <Bar dataKey="exits" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} name="Exits" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payroll Cost Trend</CardTitle>
            <CardDescription>Monthly total payroll expenditure</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={payrollCostData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="cost" stroke="hsl(221 83% 53%)" strokeWidth={2} dot={{ r: 4 }} name="Payroll Cost" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Builder</CardTitle>
          <CardDescription>Build custom reports using any system or custom field</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">The drag-and-drop report builder will be available here.</p>
            <p className="text-xs mt-1">Select any field from any module as a column, filter, or group-by dimension.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
