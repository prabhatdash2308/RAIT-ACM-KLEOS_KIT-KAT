'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardNav } from '@/components/layout/navbar';
import { useAuthStore } from '@/lib/store';
import { analyticsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const navLinks = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/merchants', label: 'Merchants' },
  { href: '/admin/citizens', label: 'Citizens' },
  { href: '/admin/compliance', label: 'Compliance' },
  { href: '/admin/leak-investigation', label: 'Leak Investigation' },
  { href: '/admin/audit-logs', label: 'Audit Logs' },
];

export default function AdminCitizensPage() {
  const token = useAuthStore((s) => s.accessToken);

  const { data: citizens } = useQuery({
    queryKey: ['admin-citizens'],
    queryFn: () => analyticsApi.adminCitizens(token!),
    enabled: !!token,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardNav links={navLinks} />
      <h1 className="text-3xl font-bold mb-8">Citizen Management</h1>

      <div className="space-y-3">
        {(citizens as { id: string; name: string; email: string; isVerified: boolean; demoMode: boolean; createdAt: string }[])?.map((c) => (
          <Card key={c.id}>
            <CardContent className="pt-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-muted-foreground">{c.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                {c.demoMode && <Badge variant="outline">Demo</Badge>}
                <Badge variant={c.isVerified ? 'success' : 'warning'}>{c.isVerified ? 'Verified' : 'Unverified'}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
