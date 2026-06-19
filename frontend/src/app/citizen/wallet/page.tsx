'use client';

import { useQuery } from '@tanstack/react-query';
import { Wallet, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardNav } from '@/components/layout/navbar';
import { useAuthStore } from '@/lib/store';
import { walletApi } from '@/lib/api';

const navLinks = [
  { href: '/citizen/dashboard', label: 'Dashboard' },
  { href: '/citizen/wallet', label: 'Wallet' },
  { href: '/citizen/scan', label: 'Scan QR' },
  { href: '/citizen/history', label: 'History' },
  { href: '/citizen/privacy', label: 'Privacy' },
];

export default function WalletPage() {
  const token = useAuthStore((s) => s.accessToken);

  const { data } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletApi.get(token!),
    enabled: !!token,
  });

  const wallet = data?.wallet;

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
