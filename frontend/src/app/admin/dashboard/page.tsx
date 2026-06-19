'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Users, Building2, FileText, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardNav } from '@/components/layout/navbar';
import { useAuthStore } from '@/lib/store';
import { analyticsApi } from '@/lib/api';

const navLinks = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/merchants', label: 'Merchants' },
  { href: '/admin/citizens', label: 'Citizens' },
  { href: '/admin/compliance', label: 'Compliance' },
  { href: '/admin/leak-investigation', label: 'Leak Investigation' },
  { href: '/admin/audit-logs', label: 'Audit Logs' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) router.push('/auth/login');
  }, [isAuthenticated, router]);

  const { data } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => analyticsApi.adminDashboard(accessToken!),
    enabled: !!accessToken,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardNav links={navLinks} />
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Citizens', value: data?.totalCitizens ?? 0, icon: Users },
          { label: 'Merchants', value: data?.totalMerchants ?? 0, icon: Building2 },
          { label: 'Transactions', value: data?.totalTransactions ?? 0, icon: FileText },
          { label: 'Privacy Compliance', value: `${data?.privacyComplianceRate ?? 0}%`, icon: Shield },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>System Overview</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            DigiRakshak platform monitoring. Total audit logs: {data?.totalAuditLogs ?? 0}.
            All identity data is processed through selective disclosure — zero Aadhaar storage.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
