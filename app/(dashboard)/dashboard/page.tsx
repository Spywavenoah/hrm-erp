'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, UserPlus, CalendarDays, Wallet, TrendingUp, TrendingDown, Clock, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, Area, AreaChart,
} from 'recharts';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalEmployees: number;
  pendingOnboarding: number;
  onLeaveToday: number;
  monthlyPayroll: number;
  presentToday: number;
  totalAssets: number;
}

const headcountData = [
  { month: 'Jan', count: 120 },
  { month: 'Feb', count: 125 },
  { month: 'Mar', count: 130 },
  { month: 'Apr', count: 135 },
  { month: 'May', count: 142 },
  { month: 'Jun', count: 148 },
  { month: 'Jul', count: 155 },
  { month: 'Aug', count: 162 },
];

const departmentData = [
  { name: 'Engineering', value: 45, color: 'hsl(221 83% 53%)' },
  { name: 'Sales', value: 25, color: 'hsl(142 71% 45%)' },
  { name: 'Operations', value: 20, color: 'hsl(38 92% 50%)' },
  { name: 'HR', value: 10, color: 'hsl(0 72% 51%)' },
  { name: 'Finance', value: 15, color: 'hsl(280 65% 60%)' },
];

const attendanceData = [
  { day: 'Mon', present: 150, absent: 12 },
  { day: 'Tue', present: 155, absent: 7 },
  { day: 'Wed', present: 148, absent: 14 },
  { day: 'Thu', present: 160, absent: 2 },
  { day: 'Fri', present: 145, absent: 17 },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    pendingOnboarding: 0,
    onLeaveToday: 0,
    monthlyPayroll: 0,
    presentToday: 0,
    totalAssets: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [empCount, onboardingCount, leaveCount, assetCount, attendanceCount] =
          await Promise.all([
            supabase.from('employees').select('id', { count: 'exact', head: true }),
            supabase
              .from('employees')
              .select('id', { count: 'exact', head: true })
              .eq('employment_status', 'PENDING_VERIFICATION'),
            supabase
              .from('leave_requests')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'PENDING'),
            supabase.from('assets').select('id', { count: 'exact', head: true }),
            supabase
              .from('attendance')
              .select('id', { count: 'exact', head: true })
              .eq('date', new Date().toISOString().split('T')[0]),
          ]);

        setStats({
          totalEmployees: empCount.count || 0,
          pendingOnboarding: onboardingCount.count || 0,
          onLeaveToday: leaveCount.count || 0,
          monthlyPayroll: 285000,
          presentToday: attendanceCount.count || 0,
          totalAssets: assetCount.count || 0,
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    }
    loadStats();
  }, []);

  const summaryCards = [
    { label: 'Total Employees', value: stats.totalEmployees, icon: Users, color: 'primary' as const, trend: { value: '+5.2%', positive: true } },
    { label: 'Pending Onboarding', value: stats.pendingOnboarding, icon: UserPlus, color: 'warning' as const },
    { label: 'On Leave Today', value: stats.onLeaveToday, icon: CalendarDays, color: 'info' as const },
    { label: 'Present Today', value: stats.presentToday, icon: Clock, color: 'success' as const, trend: { value: '+2.1%', positive: true } },
    { label: 'Monthly Payroll', value: `$${(stats.monthlyPayroll / 1000).toFixed(0)}K`, icon: Wallet, color: 'primary' as const, trend: { value: '+1.8%', positive: true } },
    { label: 'Total Assets', value: stats.totalAssets, icon: Package, color: 'destructive' as const },
  ];

  const colorClasses: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    destructive: 'bg-destructive/10 text-destructive',
    info: 'bg-info/10 text-info',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your organization's key metrics
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', colorClasses[card.color])}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {card.trend && (
                    <span className={cn('flex items-center gap-0.5 text-xs font-medium', card.trend.positive ? 'text-success' : 'text-destructive')}>
                      {card.trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {card.trend.value}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-2xl font-bold">{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Headcount Growth</CardTitle>
            <CardDescription>Employee count over the past 8 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={headcountData}>
                <defs>
                  <linearGradient id="headcountGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(221 83% 53%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(221 83% 53%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(221 83% 53%)"
                  strokeWidth={2}
                  fill="url(#headcountGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Department Distribution</CardTitle>
            <CardDescription>Employees by department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={departmentData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={2}
                >
                  {departmentData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Attendance</CardTitle>
          <CardDescription>Present vs absent employees this week</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="present" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} name="Present" />
              <Bar dataKey="absent" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} name="Absent" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
