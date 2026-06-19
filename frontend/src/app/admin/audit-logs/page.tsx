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
  { href: '/admin/audit-logs', label: 'Audit Logs' },
];

export default function AdminAuditLogsPage() {
  const token = useAuthStore((s) => s.accessToken);

  const { data: logs } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => analyticsApi.adminAuditLogs(token!),
    enabled: !!token,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardNav links={navLinks} />
      <h1 className="text-3xl font-bold mb-8">System Audit Logs</h1>

      <div className="space-y-3">
        {(logs as { id: string; action: string; attribute: string | null; status: string; dataHash: string; createdAt: string; merchant: { businessName: string } | null }[])?.map((log) => (
          <Card key={log.id}>
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{log.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.merchant?.businessName}{log.attribute && ` · ${log.attribute}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={log.status === 'SUCCESS' ? 'success' : 'outline'}>{log.status}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</span>
                </div>
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-2 truncate">Hash: {log.dataHash}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
