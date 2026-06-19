'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Wallet, ScanLine, History, BarChart3, Shield, CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DashboardNav } from '@/components/layout/navbar';
import { useAuthStore } from '@/lib/store';
import { analyticsApi, walletApi } from '@/lib/api';
import { ATTRIBUTE_LABELS } from '@/lib/utils';

const navLinks = [
  { href: '/citizen/dashboard', label: 'Dashboard' },
  { href: '/citizen/wallet', label: 'Wallet' },
  { href: '/citizen/scan', label: 'Scan QR' },
  { href: '/citizen/history', label: 'History' },
  { href: '/citizen/privacy', label: 'Privacy' },
];

export default function CitizenDashboard() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) router.push('/auth/login');
  }, [isAuthenticated, router]);

  const { data: dashboard } = useQuery({
    queryKey: ['citizen-dashboard'],
    queryFn: () => analyticsApi.citizenDashboard(accessToken!),
    enabled: !!accessToken,
  });

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletApi.get(accessToken!),
    enabled: !!accessToken,
  });

  const wallet = walletData?.wallet;

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardNav links={navLinks} />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">Citizen Dashboard</h1>
        <p className="text-muted-foreground mb-8">Manage your privacy-first identity wallet</p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Privacy Score', value: dashboard?.privacyScore ?? '—', icon: Shield, color: 'text-primary' },
          { label: 'Transactions', value: dashboard?.transactions ?? 0, icon: BarChart3, color: 'text-blue-500' },
          { label: 'Protected Fields', value: dashboard?.protectedFields ?? 0, icon: CheckCircle, color: 'text-success' },
          { label: 'Data Saved', value: `${dashboard?.dataSavedKb ?? 0} KB`, icon: Wallet, color: 'text-amber-500' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" /> Credential Wallet</CardTitle>
            <CardDescription>Derived attributes only — never Aadhaar number or raw DOB</CardDescription>
          </CardHeader>
          <CardContent>
            {wallet ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Identity Verified', value: wallet.identityVerified },
                  { label: 'Age Above 18', value: wallet.ageOver18 },
                  { label: 'Student Status', value: wallet.isStudent },
                  { label: 'Female Status', value: wallet.isFemale },
                  { label: 'State', value: wallet.state },
                  { label: 'Pincode', value: wallet.pincodeMasked },
                ].map((attr) => (
                  <div key={attr.label} className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground">{attr.label}</p>
                    <p className="font-semibold">
                      {typeof attr.value === 'boolean' ? (
                        <Badge variant={attr.value ? 'success' : 'outline'}>{String(attr.value).toUpperCase()}</Badge>
                      ) : (
                        attr.value || '—'
                      )}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No wallet set up yet</p>
                <Link href="/citizen/onboarding"><Button>Set Up Wallet</Button></Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/citizen/scan">
              <Button className="w-full justify-start gap-2" size="lg">
                <ScanLine className="h-5 w-5" /> Scan Merchant QR
              </Button>
            </Link>
            <Link href="/citizen/history">
              <Button variant="outline" className="w-full justify-start gap-2" size="lg">
                <History className="h-5 w-5" /> Consent History
              </Button>
            </Link>
            <Link href="/citizen/privacy">
              <Button variant="outline" className="w-full justify-start gap-2" size="lg">
                <BarChart3 className="h-5 w-5" /> Privacy Dashboard
              </Button>
            </Link>

            {dashboard?.privacyScore && (
              <div className="pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Privacy Score</span>
                  <span className="font-bold">{dashboard.privacyScore}/100</span>
                </div>
                <Progress value={dashboard.privacyScore} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {dashboard?.recentTransactions && dashboard.recentTransactions.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard.recentTransactions.map((t: { merchant: string; attribute: string; status: string; time: string }, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{t.merchant}</p>
                    <p className="text-xs text-muted-foreground">{ATTRIBUTE_LABELS[t.attribute] || t.attribute}</p>
                  </div>
                  <Badge variant="success">{t.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
