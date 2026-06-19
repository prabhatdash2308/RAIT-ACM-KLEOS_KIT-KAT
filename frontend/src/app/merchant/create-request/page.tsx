'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, Copy, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DashboardNav } from '@/components/layout/navbar';
import { useAuthStore } from '@/lib/store';
import { verificationApi } from '@/lib/api';
import { ATTRIBUTE_LABELS } from '@/lib/utils';

const navLinks = [
  { href: '/merchant/dashboard', label: 'Dashboard' },
  { href: '/merchant/create-request', label: 'Create Request' },
  { href: '/merchant/audit-logs', label: 'Audit Logs' },
];

const ATTRIBUTES = ['AGE_OVER_18', 'STATE', 'FEMALE', 'STUDENT', 'IDENTITY_VERIFIED', 'PINCODE_MATCH'];

const schema = z.object({
  purpose: z.string().min(5),
  attributes: z.array(z.object({
    attribute: z.string(),
    reason: z.string().min(10),
    pincodeValue: z.string().optional(),
  })).min(1),
});

type FormData = z.infer<typeof schema>;

const DEMO_PRESETS: Record<string, FormData> = {
  pharmacy: {
    purpose: 'Age verification for medicine purchase',
    attributes: [{ attribute: 'AGE_OVER_18', reason: 'Required to verify customer is above 18 for restricted medicine purchase as per Drug Rules' }],
  },
  hotel: {
    purpose: 'State residency verification for local discount',
    attributes: [{ attribute: 'STATE', reason: 'Required to verify state residency for applicable local resident discount on room booking' }],
  },
  coffee: {
    purpose: 'Student discount verification',
    attributes: [{ attribute: 'STUDENT', reason: 'Required to verify active student status for 20% discount on beverages' }],
  },
  bank: {
    purpose: 'Identity authenticity verification for account opening',
    attributes: [{ attribute: 'IDENTITY_VERIFIED', reason: 'Required to verify identity document authenticity for new savings account KYC process' }],
  },
};

export default function CreateRequestPage() {
  const token = useAuthStore((s) => s.accessToken);
  const [qrData, setQrData] = useState<{ qrPayload: string; requestId: string; expiresAt: string; aiAnalysis: { riskLevel: string; recommendation: string } } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const { register, control, handleSubmit, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      purpose: '',
      attributes: [{ attribute: 'AGE_OVER_18', reason: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'attributes' });

  useEffect(() => {
    if (!qrData) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(qrData.expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) setQrData(null);
    }, 1000);
    return () => clearInterval(interval);
  }, [qrData]);

  const onSubmit = async (data: FormData) => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await verificationApi.createRequest(token, data) as typeof qrData & { qrPayload: string };
      setQrData(result);
    } catch {
      alert('Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (key: string) => {
    const preset = DEMO_PRESETS[key];
    setValue('purpose', preset.purpose);
    setValue('attributes', preset.attributes);
  };

  const copyPayload = () => {
    if (qrData) {
      navigator.clipboard.writeText(qrData.qrPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardNav links={navLinks} />
      <h1 className="text-3xl font-bold mb-8">Create Verification Request</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>Select attributes and provide mandatory reasons</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.keys(DEMO_PRESETS).map((key) => (
                <Button key={key} variant="outline" size="sm" className="capitalize" onClick={() => applyPreset(key)}>
                  {key}
                </Button>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Purpose</Label>
                <Input {...register('purpose')} placeholder="Why do you need verification?" />
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Attribute {index + 1}</Label>
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>Remove</Button>
                    )}
                  </div>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" {...register(`attributes.${index}.attribute`)}>
                    {ATTRIBUTES.map((a) => (
                      <option key={a} value={a}>{ATTRIBUTE_LABELS[a]}</option>
                    ))}
                  </select>
                  <Input {...register(`attributes.${index}.reason`)} placeholder="Mandatory reason for this attribute" />
                  {watch(`attributes.${index}.attribute`) === 'PINCODE_MATCH' && (
                    <Input {...register(`attributes.${index}.pincodeValue`)} placeholder="Pincode to match against" />
                  )}
                </div>
              ))}

              <Button type="button" variant="outline" size="sm" onClick={() => append({ attribute: 'AGE_OVER_18', reason: '' })}>
                Add Attribute
              </Button>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Generating...' : 'Generate QR Code'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Dynamic QR
              {qrData && (
                <Badge variant={timeLeft > 60 ? 'success' : 'warning'}>
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>One-time use · Expires in 5 minutes · Auto-refresh</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {qrData ? (
              <>
                <div className="p-4 bg-white rounded-xl mb-4">
                  <QRCodeSVG value={qrData.qrPayload} size={220} />
                </div>
                <p className="text-xs text-muted-foreground mb-2">Request ID: {qrData.requestId}</p>
                <div className="flex gap-2 mb-4">
                  <Button variant="outline" size="sm" onClick={copyPayload}>
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy Payload'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleSubmit(onSubmit)()}>
                    <RefreshCw className="h-4 w-4" /> Refresh
                  </Button>
                </div>
                {qrData.aiAnalysis && (
                  <div className="w-full p-3 rounded-lg bg-muted text-sm">
                    <p>AI Analysis: <Badge variant="outline">{qrData.aiAnalysis.recommendation}</Badge></p>
                    <p className="text-muted-foreground mt-1">Risk: {qrData.aiAnalysis.riskLevel}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                <p>Fill in request details and generate a QR code</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
