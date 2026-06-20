'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Camera, CameraOff, ScanLine } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DashboardNav } from '@/components/layout/navbar';
import { AIAssistantPanel } from '@/components/features/ai-assistant-panel';
import { TransparencyMeter } from '@/components/features/transparency-meter';
import { TrustStars } from '@/components/features/trust-stars';
import { DPDPReadyBadge, MerchantRiskAlert } from '@/components/features/dpdp-badge';
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
  merchant: { businessName: string; businessType: string; trustScore: number; trustStars?: number; dpdpReady?: boolean };
  purpose: string;
  attributes: { attribute: string; reason: string }[];
  expiresAt: string;
  merchantRiskAlert?: { level: string; message: string } | null;
  trustedMerchant?: { isTrusted: boolean; canQuickApprove?: boolean; priorApprovals?: number };
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

type DetectedBarcode = { rawValue: string };
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
};

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorCtor;
  }
}

export default function ScanPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const [qrInput, setQrInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successProofs, setSuccessProofs] = useState<{ attribute: string; value: string }[]>([]);
  const [successMode, setSuccessMode] = useState('');

  const stopCamera = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => stopCamera, []);

  const decodePayload = async (payload: string) => {
    if (!token || !payload.trim()) return;
    setScanning(true);
    try {
      const data = await verificationApi.decodeQr(token, payload.trim()) as ScanResult;
      stopCamera();
      setResult(data);
    } catch (err) {
      toast({ title: 'Invalid QR', description: err instanceof ApiError ? err.message : 'QR decode failed', variant: 'destructive' });
    } finally {
      setScanning(false);
    }
  };

  const handleDecode = () => decodePayload(qrInput);

  const startCameraScan = async () => {
    if (!token || cameraActive) return;
    setCameraError(null);

    if (!window.isSecureContext) {
      setCameraError('Camera access requires HTTPS. Use the Vercel URL or localhost for testing.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('This browser does not support camera access. Paste the QR payload below.');
      return;
    }
    if (!window.BarcodeDetector) {
      setCameraError('QR camera scanning is not supported in this browser. Paste the QR payload below.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);

      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const scanFrame = async () => {
        const video = videoRef.current;
        if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          animationRef.current = requestAnimationFrame(scanFrame);
          return;
        }

        try {
          const codes = await detector.detect(video);
          const qrValue = codes.find((code) => code.rawValue)?.rawValue;
          if (qrValue) {
            setQrInput(qrValue);
            await decodePayload(qrValue);
            return;
          }
        } catch {
          setCameraError('Camera scan failed. Paste the QR payload below or try again.');
          stopCamera();
          return;
        }
        animationRef.current = requestAnimationFrame(scanFrame);
      };

      animationRef.current = requestAnimationFrame(scanFrame);
    } catch (err) {
      const denied = err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');
      setCameraError(denied ? 'Camera permission was denied. Allow camera access in your browser and try again.' : 'Unable to start the camera. Check that no other app is using it.');
      stopCamera();
    }
  };

  const handleQuickReverify = async () => {
    if (!token || !result) return;
    setActionLoading(true);
    try {
      const response = await verificationApi.quickReverify(token, result.requestId) as { proofs: { attribute: string; value: string }[] };
      setSuccessProofs(response.proofs.map((p) => ({
        attribute: ATTRIBUTE_LABELS[p.attribute] || p.attribute,
        value: p.value,
      })));
      setSuccessMode('QUICK_REVERIFY');
      setSuccessOpen(true);
      toast({ title: 'Quick Reverification', description: 'Trusted merchant — consent approved instantly.', variant: 'success' });
    } catch (err) {
      toast({ title: 'Quick Reverify Failed', description: err instanceof ApiError ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setActionLoading(false);
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
                <video
                  ref={videoRef}
                  className={`absolute inset-0 h-full w-full object-cover ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
                  muted
                  playsInline
                  aria-label="QR scanner camera preview"
                />
                <div className={`absolute inset-0 flex items-center justify-center ${cameraActive ? 'opacity-0' : 'opacity-100'}`}>
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
              <p className="text-center text-muted-foreground text-sm mb-6">
                {cameraActive ? 'Point your camera at the merchant QR' : 'Scan with camera or paste merchant QR payload below'}
              </p>
              {cameraError && (
                <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {cameraError}
                </div>
              )}
              <div className="space-y-3">
                <Button
                  className="w-full gap-2"
                  variant={cameraActive ? 'outline' : 'default'}
                  onClick={cameraActive ? stopCamera : startCameraScan}
                  disabled={scanning}
                >
                  {cameraActive ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                  {cameraActive ? 'Stop Camera' : 'Allow Camera & Scan'}
                </Button>
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
                <div className="flex items-center gap-2 mt-2">
                  <TrustStars score={result.merchant.trustScore} />
                  <DPDPReadyBadge dpdpReady={result.merchant.dpdpReady} trustScore={result.merchant.trustScore} size="sm" />
                </div>
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

          <MerchantRiskAlert alert={result.merchantRiskAlert ?? null} />

          {result.trustedMerchant?.canQuickApprove && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">One-Click Reverification</p>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ve approved {result.trustedMerchant.priorApprovals} prior request(s) from this merchant.
                  </p>
                </div>
                <Button onClick={handleQuickReverify} disabled={actionLoading} className="gap-2">
                  Quick Approve
                </Button>
              </CardContent>
            </Card>
          )}

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
