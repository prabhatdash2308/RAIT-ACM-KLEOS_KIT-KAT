'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ScanLine, Camera } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DashboardNav } from '@/components/layout/navbar';
import { AIAssistantPanel } from '@/components/features/ai-assistant-panel';
import { TransparencyMeter } from '@/components/features/transparency-meter';
import { TrustStars } from '@/components/features/trust-stars';
import { VerificationSuccessModal } from '@/components/features/success-modal';
import { useToast } from '@/components/ui/toaster';
import { useAuthStore } from '@/lib/store';
import { verificationApi, ApiError } from '@/lib/api';
import { ATTRIBUTE_LABELS } from '@/lib/utils';

const navLinks = [
  { href: '/citizen/dashboard', label: 'Dashboard' },
  { href: '/citizen/wallet', label: 'Wallet' },
  { href: '/citizen/scan', label: 'Scan QR' },
  { href: '/citizen/history', label: 'History' },
  { href: '/citizen/privacy', label: 'Privacy' },
  { href: '/citizen/profile', label: 'Profile' },
];

interface ScanResult {
  requestId: string;
  merchant: { businessName: string; businessType: string; trustScore: number; trustStars?: number };
  purpose: string;
  attributes: { attribute: string; reason: string }[];
  expiresAt: string;
  aiAnalysis: {
    riskLevel: string;
    recommendation: string;
    privacyScorePreview: number;
    unnecessaryAttributes: string[];
    reasonScores: { attribute: string; score: number; feedback: string; verdict: string }[];
    summary: string;
    explanation: string;
    transparency?: {
      traditionalFields: string[];
      requestedFields: string[];
      minimumShareFields: string[];
      disclosurePreventedPercent: number;
      privacySavedKb: number;
    };
  };
}

export default function ScanPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const { toast } = useToast();
  const [qrInput, setQrInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successProofs, setSuccessProofs] = useState<{ attribute: string; value: string }[]>([]);
  const [successMode, setSuccessMode] = useState('');

  const handleDecode = async () => {
    if (!token || !qrInput) return;
    setScanning(true);
    try {
      const data = await verificationApi.decodeQr(token, qrInput) as ScanResult;
      setResult(data);
    } catch (err) {
      toast({ title: 'Invalid QR', description: err instanceof ApiError ? err.message : 'QR decode failed', variant: 'destructive' });
    } finally {
      setScanning(false);
    }
  };

  const handleConsent = async (action: 'approve' | 'minimum' | 'override' | 'reject') => {
    if (!token || !result) return;
    setActionLoading(true);
    try {
      let response;
      if (action === 'reject') {
        await verificationApi.reject(token, result.requestId);
        toast({ title: 'Consent Rejected', description: 'No data was shared with the merchant.' });
        router.push('/citizen/history');
        return;
      }
      if (action === 'minimum') {
        response = await verificationApi.shareMinimum(token, result.requestId) as { proofs: { attribute: string; value: string }[]; mode: string };
        setSuccessMode('MINIMUM');
      } else if (action === 'override') {
        response = await verificationApi.approveAnyway(token, result.requestId) as { proofs: { attribute: string; value: string }[]; mode: string };
        setSuccessMode('OVERRIDE');
      } else {
        response = await verificationApi.approve(token, result.requestId) as { proofs: { attribute: string; value: string }[]; mode: string };
        setSuccessMode('FULL');
      }
      setSuccessProofs(response.proofs.map((p) => ({
        attribute: ATTRIBUTE_LABELS[p.attribute] || p.attribute,
        value: p.value,
      })));
      setSuccessOpen(true);
      toast({ title: 'Proof Generated', description: 'Time-limited proofs created successfully.', variant: 'success' });
    } catch (err) {
      toast({ title: 'Action Failed', description: err instanceof ApiError ? err.message : 'Consent action failed', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardNav links={navLinks} />
      <h1 className="text-3xl font-bold mb-2">Scan QR Code</h1>
      <p className="text-muted-foreground mb-8">Review AI recommendations before sharing any proof</p>

      {!result ? (
        <div className="max-w-lg mx-auto">
          <Card className="premium-card glow-primary">
            <CardContent className="pt-8">
              <div className="relative w-64 h-64 mx-auto mb-6 border-2 border-dashed border-primary/40 rounded-2xl overflow-hidden bg-primary/5">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="h-16 w-16 text-primary/30" />
                </div>
                <motion.div
                  className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-lg shadow-primary/50"
                  animate={{ top: ['10%', '90%', '10%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
              </div>
              <p className="text-center text-muted-foreground text-sm mb-6">Paste merchant QR payload below</p>
              <div className="space-y-3">
                <Input placeholder="Paste QR payload JSON..." value={qrInput} onChange={(e) => setQrInput(e.target.value)} className="font-mono text-xs" />
                <Button className="w-full gap-2" onClick={handleDecode} disabled={scanning || !qrInput}>
                  <ScanLine className="h-4 w-4" />
                  {scanning ? 'Decoding...' : 'Decode QR'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="premium-card">
            <CardContent className="pt-6 space-y-4">
              <div className="p-4 rounded-xl bg-muted/50 border">
                <p className="text-sm text-muted-foreground">Merchant</p>
                <p className="font-semibold text-xl">{result.merchant.businessName}</p>
                <p className="text-sm text-muted-foreground">{result.merchant.businessType}</p>
                <TrustStars score={result.merchant.trustScore} className="mt-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Purpose</p>
                <p className="font-medium">{result.purpose}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Requested Attributes</p>
                {result.attributes.map((a) => (
                  <div key={a.attribute} className="p-3 rounded-xl border mb-2">
                    <Badge className="mb-1">{ATTRIBUTE_LABELS[a.attribute] || a.attribute}</Badge>
                    <p className="text-xs text-muted-foreground">Reason: {a.reason}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <AIAssistantPanel analysis={result.aiAnalysis} />

          {result.aiAnalysis.transparency && (
            <TransparencyMeter
              transparencyScore={result.aiAnalysis.privacyScorePreview}
              disclosurePreventedPercent={result.aiAnalysis.transparency.disclosurePreventedPercent}
              privacySavedKb={result.aiAnalysis.transparency.privacySavedKb}
              traditionalFields={result.aiAnalysis.transparency.traditionalFields}
              requestedFields={result.aiAnalysis.transparency.requestedFields}
              sharedFields={result.aiAnalysis.transparency.minimumShareFields}
            />
          )}

          <div className="grid sm:grid-cols-3 gap-3">
            <Button variant="destructive" onClick={() => handleConsent('reject')} disabled={actionLoading} className="h-12">
              Reject
            </Button>
            <Button variant="outline" onClick={() => handleConsent('minimum')} disabled={actionLoading} className="h-12 border-primary text-primary hover:bg-primary/10">
              Share Minimum
            </Button>
            {result.aiAnalysis.riskLevel === 'HIGH' || result.aiAnalysis.riskLevel === 'CRITICAL' ? (
              <Button variant="warning" onClick={() => handleConsent('override')} disabled={actionLoading} className="h-12 bg-warning text-warning-foreground hover:bg-warning/90">
                Approve Anyway
              </Button>
            ) : (
              <Button variant="success" onClick={() => handleConsent('approve')} disabled={actionLoading} className="h-12">
                Approve
              </Button>
            )}
          </div>
        </div>
      )}

      <VerificationSuccessModal
        open={successOpen}
        proofs={successProofs}
        mode={successMode}
        onClose={() => { setSuccessOpen(false); router.push('/citizen/history'); }}
      />
    </div>
  );
}
