'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, AlertTriangle, Fingerprint } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DashboardNav } from '@/components/layout/navbar';
import { useAuthStore } from '@/lib/store';
import { privacyApi } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';
import { formatDate } from '@/lib/utils';

const navLinks = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/merchants', label: 'Merchants' },
  { href: '/admin/citizens', label: 'Citizens' },
  { href: '/admin/compliance', label: 'Compliance' },
  { href: '/admin/leak-investigation', label: 'Leak Investigation' },
  { href: '/admin/audit-logs', label: 'Audit Logs' },
];

export default function LeakInvestigationPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const [proofId, setProofId] = useState('');
  const [traceResult, setTraceResult] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/auth/login');
  }, [isAuthenticated, router]);

  const { data: leaks } = useQuery({
    queryKey: ['admin-leaks'],
    queryFn: () => privacyApi.adminLeakInvestigation(accessToken!),
    enabled: !!accessToken,
  });

  const reportMutation = useMutation({
    mutationFn: (id: string) => privacyApi.adminReportLeak(accessToken!, id),
    onSuccess: () => toast({ title: 'Leak Confirmed', description: 'Merchant trust score updated.', variant: 'success' }),
  });

  const handleTrace = async () => {
    if (!proofId || !accessToken) return;
    try {
      const result = await privacyApi.adminTraceProof(accessToken, proofId);
      setTraceResult(result as Record<string, unknown>);
    } catch {
      toast({ title: 'Trace Failed', description: 'Proof ID not found.', variant: 'destructive' });
    }
  };

  const confirmedLeaks = (leaks as { confirmedLeaks: { proofId: string; merchant: { businessName: string }; leakedAt: string; status: string }[] })?.confirmedLeaks || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardNav links={navLinks} />
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <AlertTriangle className="h-8 w-8 text-destructive" /> PrivacyTrace Leak Investigation
      </h1>
      <p className="text-muted-foreground mb-8">Trace leaked proofs using PrivacyTrace Engine proof IDs</p>

      <Card className="mb-8 premium-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Fingerprint className="h-5 w-5" /> Trace Proof ID</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Input placeholder="PT-XXXXXXXX" value={proofId} onChange={(e) => setProofId(e.target.value)} className="font-mono" />
          <Button onClick={handleTrace} className="gap-2"><Search className="h-4 w-4" /> Trace</Button>
        </CardContent>
      </Card>

      {traceResult && (
        <Card className="mb-8 border-primary/30">
          <CardContent className="pt-6 space-y-3">
            <div className="flex justify-between">
              <p className="font-mono font-bold">{String(traceResult.proofId)}</p>
              <Badge variant={traceResult.status === 'LEAKED' ? 'destructive' : 'outline'}>{String(traceResult.status)}</Badge>
            </div>
            <p className="text-sm"><span className="text-muted-foreground">Merchant:</span> {(traceResult.merchant as { businessName: string })?.businessName}</p>
            <p className="text-sm"><span className="text-muted-foreground">Purpose:</span> {String(traceResult.purpose)}</p>
            <p className="text-sm"><span className="text-muted-foreground">Attribute:</span> {String(traceResult.attribute)} = {String(traceResult.value)}</p>
            <p className="text-xs font-mono text-muted-foreground break-all">Signature: {String(traceResult.digitalSignature)}</p>
            {traceResult.status !== 'LEAKED' && (
              <Button variant="destructive" size="sm" onClick={() => reportMutation.mutate(String(traceResult.proofId))}>
                Confirm Leak
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Confirmed Leaks</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {confirmedLeaks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No confirmed leaks. Platform integrity maintained.</p>
          ) : (
            confirmedLeaks.map((l) => (
              <div key={l.proofId} className="flex justify-between p-3 rounded-lg border border-destructive/20">
                <div>
                  <p className="font-mono text-sm">{l.proofId}</p>
                  <p className="text-sm text-muted-foreground">{l.merchant.businessName}</p>
                </div>
                <div className="text-right">
                  <Badge variant="destructive">LEAKED</Badge>
                  <p className="text-xs text-muted-foreground mt-1">{l.leakedAt ? formatDate(l.leakedAt) : ''}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
