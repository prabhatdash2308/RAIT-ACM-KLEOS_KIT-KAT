'use client';

import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardNav } from '@/components/layout/navbar';
import { useAuthStore } from '@/lib/store';
import { verificationApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const navLinks = [
  { href: '/merchant/dashboard', label: 'Dashboard' },
  { href: '/merchant/create-request', label: 'Create Request' },
  { href: '/merchant/audit-logs', label: 'Audit Logs' },
];

export default function AuditLogsPage() {
  const token = useAuthStore((s) => s.accessToken);

  const { data: logs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => verificationApi.auditLogs(token!),
    enabled: !!token,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardNav links={navLinks} />
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <FileText className="h-8 w-8" /> Audit Logs
      </h1>
      <p className="text-muted-foreground mb-8">No personal information stored — only hashes and metadata</p>

      <div className="space-y-3">
        {(logs as { id: string; action: string; attribute: string | null; status: string; dataHash: string; createdAt: string; verificationRequestId: string | null }[])?.map((log) => (
          <Card key={log.id}>
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{log.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.verificationRequestId && `Request: ${log.verificationRequestId.slice(0, 12)}...`}
                    {log.attribute && ` · ${log.attribute}`}
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
        )) || (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No audit logs yet</CardContent></Card>
        )}
      </div>
    </div>
  );
}
