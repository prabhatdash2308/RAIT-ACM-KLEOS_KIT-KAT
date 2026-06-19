'use client';

import { useAuthStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardNav } from '@/components/layout/navbar';
import { Building2, Mail } from 'lucide-react';

const navLinks = [
  { href: '/merchant/dashboard', label: 'Dashboard' },
  { href: '/merchant/create-request', label: 'Create Request' },
  { href: '/merchant/analytics', label: 'Analytics' },
  { href: '/merchant/audit-logs', label: 'Audit Logs' },
  { href: '/merchant/profile', label: 'Profile' },
];

export default function MerchantProfilePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <DashboardNav links={navLinks} />
      <h1 className="text-3xl font-bold mb-8">Merchant Profile</h1>
      <Card className="premium-card">
        <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Business Account</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-xl bg-muted/50 flex items-center gap-3">
            <Mail className="h-4 w-4" />
            <span>{user?.email}</span>
          </div>
          <p className="text-sm text-muted-foreground">Verified merchant · Privacy compliance enabled</p>
        </CardContent>
      </Card>
    </div>
  );
}
