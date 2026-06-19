'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { History, RotateCcw, Download, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/toaster';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardNav } from '@/components/layout/navbar';
import { useAuthStore } from '@/lib/store';
import { walletApi, privacyApi } from '@/lib/api';
import { ATTRIBUTE_LABELS, formatDate } from '@/lib/utils';

const navLinks = [
  { href: '/citizen/dashboard', label: 'Dashboard' },
  { href: '/citizen/wallet', label: 'Wallet' },
  { href: '/citizen/scan', label: 'Scan QR' },
  { href: '/citizen/history', label: 'History' },
  { href: '/citizen/privacy', label: 'Privacy' },
];

export default function HistoryPage() {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: history } = useQuery({
    queryKey: ['consent-history'],
    queryFn: () => walletApi.history(token!),
    enabled: !!token,
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => walletApi.revoke(token!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consent-history'] }),
  });

  const statusVariant = (status: string) => {
    if (status === 'APPROVED') return 'success' as const;
    if (status === 'REJECTED') return 'destructive' as const;
    if (status === 'REVOKED') return 'warning' as const;
    return 'outline' as const;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardNav links={navLinks} />
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <History className="h-8 w-8" /> Consent History
        </h1>
        <Button variant="outline" size="sm" className="gap-2" onClick={async () => {
          try {
            await walletApi.exportHistory(token!);
            toast({ title: 'Export Ready', description: 'Consent logs exported as JSON.', variant: 'success' });
          } catch {
            toast({ title: 'Export Failed', variant: 'destructive' });
          }
        }}>
          <Download className="h-4 w-4" /> Export Logs
        </Button>
      </div>

      <div className="space-y-4">
        {(history as { id: string; merchant: string; status: string; time: string; proofs: { attribute: string; value: string }[]; canRevoke: boolean }[])?.map((item) => (
          <Card key={item.id}>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{item.merchant}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(item.time)}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.proofs.map((p, i) => (
                      <Badge key={i} variant="outline">
                        {ATTRIBUTE_LABELS[p.attribute] || p.attribute}: {p.value}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                  {item.status === 'APPROVED' && token && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const res = await fetch(privacyApi.downloadReceipt(token, item.id), {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `privacy-receipt-${item.id}.html`;
                        a.click();
                      }}
                    >
                      <FileText className="h-3 w-3" /> Receipt
                    </Button>
                  )}
                  {item.canRevoke && (
                    <Button variant="outline" size="sm" onClick={() => revokeMutation.mutate(item.id)}>
                      <RotateCcw className="h-3 w-3" /> Revoke
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )) || (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No consent history yet. Scan a merchant QR to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
