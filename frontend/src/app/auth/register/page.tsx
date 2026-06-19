'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

const citizenSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().optional(),
});

const merchantSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().min(2),
  businessType: z.string().min(2),
  gstNumber: z.string().optional(),
});

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<'citizen' | 'merchant'>('citizen');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const citizenForm = useForm<z.infer<typeof citizenSchema>>({ resolver: zodResolver(citizenSchema) });
  const merchantForm = useForm<z.infer<typeof merchantSchema>>({ resolver: zodResolver(merchantSchema) });

  const onCitizenSubmit = async (data: z.infer<typeof citizenSchema>) => {
    setLoading(true);
    setError('');
    try {
      const result = await authApi.citizenRegister(data);
      setAuth(result.user as Parameters<typeof setAuth>[0], result.accessToken);
      router.push('/citizen/onboarding');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const onMerchantSubmit = async (data: z.infer<typeof merchantSchema>) => {
    setLoading(true);
    setError('');
    try {
      const result = await authApi.merchantRegister(data);
      setAuth(result.user as Parameters<typeof setAuth>[0], result.accessToken);
      router.push('/merchant/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="h-10 w-10 text-primary mx-auto mb-2" />
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Join DigiRakshak</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Button variant={role === 'citizen' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setRole('citizen')}>Citizen</Button>
            <Button variant={role === 'merchant' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setRole('merchant')}>Merchant</Button>
          </div>

          {role === 'citizen' ? (
            <form onSubmit={citizenForm.handleSubmit(onCitizenSubmit)} className="space-y-4">
              <div><Label>Name</Label><Input {...citizenForm.register('name')} /></div>
              <div><Label>Email</Label><Input type="email" {...citizenForm.register('email')} /></div>
              <div><Label>Phone (optional)</Label><Input {...citizenForm.register('phone')} /></div>
              <div><Label>Password</Label><Input type="password" {...citizenForm.register('password')} /></div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating...' : 'Register as Citizen'}</Button>
            </form>
          ) : (
            <form onSubmit={merchantForm.handleSubmit(onMerchantSubmit)} className="space-y-4">
              <div><Label>Business Name</Label><Input {...merchantForm.register('businessName')} /></div>
              <div><Label>Business Type</Label><Input placeholder="Pharmacy, Hotel, etc." {...merchantForm.register('businessType')} /></div>
              <div><Label>GST Number (optional)</Label><Input {...merchantForm.register('gstNumber')} /></div>
              <div><Label>Email</Label><Input type="email" {...merchantForm.register('email')} /></div>
              <div><Label>Password</Label><Input type="password" {...merchantForm.register('password')} /></div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating...' : 'Register as Merchant'}</Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account? <Link href="/auth/login" className="text-primary hover:underline">Login</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
