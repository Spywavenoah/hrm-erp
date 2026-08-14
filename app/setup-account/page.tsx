'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, CheckCircle, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

function SetupAccountContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') || '';

  const [employee, setEmployee] = useState<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    employment_status: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function loadEmployee() {
      if (!email) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, employment_status')
        .eq('email', email)
        .maybeSingle();

      if (error || !data) {
        setLoading(false);
        return;
      }
      setEmployee(data as typeof employee);
      setLoading(false);
    }
    loadEmployee();
  }, [email]);

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    match: password === confirmPassword && password.length > 0,
  };

  const allValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async () => {
    if (!employee) return;
    if (!allValid) {
      toast.error('Please meet all password requirements');
      return;
    }
    setSubmitting(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: employee.email,
        password,
      });
      if (authError) throw authError;

      const { error: updateError } = await supabase
        .from('employees')
        .update({ employment_status: 'ONBOARDING' })
        .eq('id', employee.id);
      if (updateError) throw updateError;

      setDone(true);
      toast.success('Account set up successfully');
    } catch (err) {
      toast.error('Setup failed: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!email || !employee) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-lg font-semibold">Invalid Setup Link</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This setup link is no longer valid. Please contact your HR administrator for a new invitation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md animate-fade-in">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-bold">You&apos;re all set!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your password has been set and your account is now active. You can now sign in to complete your onboarding.
            </p>
            <Button className="mt-6 w-full" onClick={() => router.push('/login')}>
              Continue to Sign In <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/30 p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Set Up Your Account</CardTitle>
          <CardDescription>
            Welcome{employee ? `, ${employee.first_name}` : ''}! Choose a password to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={employee.email} disabled className="bg-muted/50" />
          </div>

          <div className="space-y-1.5">
            <Label>New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-9"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-9"
                placeholder="Re-enter password"
              />
            </div>
          </div>

          <div className="space-y-2 rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">Password requirements:</p>
            {[
              { label: 'At least 8 characters', met: passwordChecks.length },
              { label: 'At least one uppercase letter', met: passwordChecks.uppercase },
              { label: 'At least one number', met: passwordChecks.number },
              { label: 'Passwords match', met: passwordChecks.match },
            ].map((req) => (
              <div key={req.label} className="flex items-center gap-2">
                <CheckCircle
                  className={`h-3.5 w-3.5 ${req.met ? 'text-success' : 'text-muted-foreground/40'}`}
                />
                <span className={`text-xs ${req.met ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={!allValid || submitting}>
            {submitting ? 'Setting up...' : 'Set Up Account'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SetupAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <SetupAccountContent />
    </Suspense>
  );
}
