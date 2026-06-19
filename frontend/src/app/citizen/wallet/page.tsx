'use client';

import { useQuery } from '@tanstack/react-query';
import { Wallet, Shield, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardNav } from '@/components/layout/navbar';
import { useAuthStore } from '@/lib/store';
import { walletApi } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';

const CREDENTIAL_TYPES = [
  { type: 'PAN', label: 'PAN Card', issuer: 'Income Tax Dept' },
  { type: 'DRIVING_LICENCE', label: 'Driving Licence', issuer: 'RTO' },
  { type: 'ABHA', label: 'ABHA Health ID', issuer: 'ABDM' },
  { type: 'STUDENT_ID', label: 'Student ID', issuer: 'University' },
  { type: 'EMPLOYEE_ID', label: 'Employee ID', issuer: 'Employer' },
  { type: 'UNIVERSITY_CERTIFICATE', label: 'University Certificate', issuer: 'University' },
];

const navLinks = [
  { href: '/citizen/dashboard', label: 'Dashboard' },
  { href: '/citizen/wallet', label: 'Wallet' },
  { href: '/citizen/scan', label: 'Scan QR' },
  { href: '/citizen/history', label: 'History' },
  { href: '/citizen/privacy', label: 'Privacy' },
];

export default function WalletPage() {
  const token = useAuthStore((s) => s.accessToken);
  const { toast } = useToast();

  const { data, refetch } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletApi.get(token!),
    enabled: !!token,
  });

  const { data: credentials } = useQuery({
    queryKey: ['wallet-credentials'],
    queryFn: () => walletApi.getCredentials(token!),
    enabled: !!token,
  });

  const wallet = data?.wallet;

  const importCredential = async (type: string, label: string) => {
    try {
      await walletApi.importCredential(token!, { credentialType: type, label });
      toast({ title: 'Credential Imported', description: `${label} added to wallet.`, variant: 'success' });
      refetch();
    } catch {
      toast({ title: 'Import Failed', variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardNav links={navLinks} />
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <Wallet className="h-8 w-8" /> Credential Wallet
      </h1>
      <p className="text-muted-foreground mb-8">Only derived attributes — never Aadhaar number or raw DOB</p>

      {wallet ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl">
          {[
            { label: 'Identity Verified', value: wallet.identityVerified, icon: Shield },
            { label: 'Age Above 18', value: wallet.ageOver18 },
            { label: 'Student Status', value: wallet.isStudent },
            { label: 'Female Status', value: wallet.isFemale },
            { label: 'State', value: wallet.state, isText: true },
            { label: 'Pincode', value: wallet.pincodeMasked, isText: true },
          ].map((attr) => (
            <Card key={attr.label}>
              <CardHeader className="pb-2">
                <CardDescription>{attr.label}</CardDescription>
              </CardHeader>
              <CardContent>
                {attr.isText ? (
                  <p className="text-2xl font-bold">{attr.value || '—'}</p>
                ) : (
                  <Badge variant={attr.value ? 'success' : 'outline'} className="text-lg px-4 py-1">
                    {String(attr.value).toUpperCase()}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Wallet not set up. Complete onboarding first.</p>
          </CardContent>
        </Card>
      )}

      {(credentials as { type: string; issuer: string; label: string; attributes: string[] }[])?.length > 0 && (
        <Card className="mt-8 max-w-3xl">
          <CardHeader>
            <CardTitle>Universal Credentials</CardTitle>
            <CardDescription>Verifiable credentials in your wallet — selective disclosure ready</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(credentials as { type: string; issuer: string; label: string; attributes: string[] }[]).map((c) => (
              <div key={c.type} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.issuer} · {c.attributes.length} derived attributes</p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="mt-8 max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Add Credential</CardTitle>
          <CardDescription>Import additional verifiable credentials using the same selective disclosure engine</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          {CREDENTIAL_TYPES.map((c) => (
            <Button key={c.type} variant="outline" className="justify-start h-auto py-3" onClick={() => importCredential(c.type, c.label)}>
              <div className="text-left">
                <p className="font-medium">{c.label}</p>
                <p className="text-xs text-muted-foreground">{c.issuer}</p>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-8 max-w-3xl border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Zero Aadhaar Storage</p>
              <p>DigiRakshak never stores or displays your Aadhaar number, full name, or date of birth. Only derived verification attributes are kept in your wallet.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
