'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
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

export default function AdminMerchantsPage() {
  const token = useAuthStore((s) => s.accessToken);

  const { data: merchants } = useQuery({
    queryKey: ['admin-merchants'],
    queryFn: () => analyticsApi.adminMerchants(token!),
    enabled: !!token,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardNav links={navLinks} />
      <h1 className="text-3xl font-bold mb-8">Merchant Management</h1>

      <div className="space-y-3">
        {(merchants as { id: string; businessName: string; businessType: string; email: string; isVerified: boolean; trustScore: { score: number } | null; _count: { verificationRequests: number } }[])?.map((m) => (
          <Card key={m.id}>
            <CardContent className="pt-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{m.businessName}</p>
                <p className="text-sm text-muted-foreground">{m.email} · {m.businessType}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Trust: {m.trustScore?.score ?? 50}</Badge>
                <Badge variant="outline">{m._count.verificationRequests} requests</Badge>
                <Badge variant={m.isVerified ? 'success' : 'warning'}>{m.isVerified ? 'Verified' : 'Pending'}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
