'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Shield, Search, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DashboardNav } from '@/components/layout/navbar';
import { DPDPComplianceDashboard } from '@/components/features/dpdp-compliance-dashboard';
import { useAuthStore } from '@/lib/store';
import { privacyApi } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';

const navLinks = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/merchants', label: 'Merchants' },
  { href: '/admin/citizens', label: 'Citizens' },
  { href: '/admin/compliance', label: 'Compliance' },
  { href: '/admin/leak-investigation', label: 'Leak Investigation' },
  { href: '/admin/audit-logs', label: 'Audit Logs' },
];

export default function AdminCompliancePage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) router.push('/auth/login');
  }, [isAuthenticated, router]);

  const { data } = useQuery({
    queryKey: ['admin-compliance'],
    queryFn: () => privacyApi.adminCompliance(accessToken!),
    enabled: !!accessToken,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardNav links={navLinks} />
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Shield className="h-8 w-8 text-primary" /> DPDP Compliance Monitoring
      </h1>

      {data && <DPDPComplianceDashboard data={data} />}

      <div className="grid md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-emerald-600">{data?.dpdpReadyMerchants ?? 0}</p>
            <p className="text-sm text-muted-foreground">DPDP Ready Merchants</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-destructive">{data?.confirmedLeaks ?? 0}</p>
            <p className="text-sm text-muted-foreground">Confirmed Leaks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{data?.dpdpCompliancePercent ?? 0}%</p>
            <p className="text-sm text-muted-foreground">Platform Compliance</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
