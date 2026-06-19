'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') || 'citizen';
  const [role, setRole] = useState(defaultRole);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      let result;
      if (role === 'merchant') {
        result = await authApi.merchantLogin(data.email, data.password);
        setAuth(result.user as Parameters<typeof setAuth>[0], result.accessToken);
        router.push('/merchant/dashboard');
      } else if (role === 'admin') {
        result = await authApi.adminLogin(data.email, data.password);
        setAuth(result.user as Parameters<typeof setAuth>[0], result.accessToken);
        router.push('/admin/dashboard');
      } else {
        result = await authApi.citizenLogin(data.email, data.password);
        setAuth(result.user as Parameters<typeof setAuth>[0], result.accessToken);
        router.push('/citizen/dashboard');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="h-10 w-10 text-primary mx-auto mb-2" />
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to DigiRakshak</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            {['citizen', 'merchant', 'admin'].map((r) => (
              <Button key={r} variant={role === r ? 'default' : 'outline'} size="sm" className="flex-1 capitalize" onClick={() => setRole(r)}>
                {r}
              </Button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder={role === 'citizen' ? 'citizen@demo.in' : `${role}@demo.in`} {...register('email')} />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Demo@123" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
            </div>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-primary hover:underline">Register</Link>
          </p>

          <div className="mt-4 p-3 rounded-lg bg-muted text-xs text-muted-foreground">
            <p className="font-medium mb-1">Demo Credentials (password: Demo@123)</p>
            <p>Citizen: citizen@demo.in</p>
            <p>Merchant: pharmacy@demo.in</p>
            <p>Admin: admin@digirakshak.in</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)]">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
