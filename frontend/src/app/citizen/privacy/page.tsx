'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Shield, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DashboardNav } from '@/components/layout/navbar';
import { TransparencyMeter } from '@/components/features/transparency-meter';
import { DashboardSkeleton } from '@/components/ui/skeleton';
import { DPDPComplianceDashboard } from '@/components/features/dpdp-compliance-dashboard';
import { useAuthStore } from '@/lib/store';
import { analyticsApi, privacyApi } from '@/lib/api';

const navLinks = [
  { href: '/citizen/dashboard', label: 'Dashboard' },
  { href: '/citizen/wallet', label: 'Wallet' },
  { href: '/citizen/scan', label: 'Scan QR' },
  { href: '/citizen/history', label: 'History' },
  { href: '/citizen/privacy', label: 'Privacy' },
];

export default function PrivacyPage() {
  const token = useAuthStore((s) => s.accessToken);

  const { data, isLoading } = useQuery({
    queryKey: ['citizen-dashboard'],
    queryFn: () => analyticsApi.citizenDashboard(token!),
    enabled: !!token,
  });

  const { data: transparency } = useQuery({
    queryKey: ['citizen-transparency'],
    queryFn: () => analyticsApi.citizenTransparency(token!),
    enabled: !!token,
  });

  const { data: compliance } = useQuery({
    queryKey: ['citizen-compliance'],
    queryFn: () => privacyApi.citizenCompliance(token!),
    enabled: !!token,
  });

  if (isLoading) return <div className="container mx-auto px-4 py-8"><DashboardSkeleton /></div>;

  const trendData = data?.monthlyTrend?.map((t: { month: string; score: number }) => ({
    month: t.month,
    score: t.score,
  })) || [{ month: new Date().toISOString().slice(0, 7), score: data?.privacyScore || 75 }];

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardNav links={navLinks} />
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Shield className="h-8 w-8 text-primary" /> Privacy Dashboard
      </h1>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="premium-card">
          <CardContent className="pt-6 text-center">
            <p className="text-5xl font-bold text-gradient">{data?.privacyScore ?? 75}</p>
            <p className="text-sm text-muted-foreground mt-2">Privacy Score · {data?.privacyLevel || 'GOOD'}</p>
            <Progress value={data?.privacyScore ?? 75} className="mt-4" />
          </CardContent>
        </Card>
        <Card className="premium-card">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{data?.protectedFields ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-2">Protected Fields</p>
          </CardContent>
        </Card>
        <Card className="premium-card">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{data?.sharedFields ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-2">Shared Fields (Derived Only)</p>
          </CardContent>
        </Card>
      </div>

      {compliance && (
        <div className="mb-8">
          <DPDPComplianceDashboard data={compliance} />
        </div>
      )}

      {transparency && (
        <div className="mb-8">
          <TransparencyMeter
            transparencyScore={transparency.transparencyScore}
            disclosurePreventedPercent={transparency.disclosurePreventedPercent}
            privacySavedKb={transparency.privacySavedKb}
            traditionalFields={transparency.traditionalFields}
            sharedFields={transparency.requestedVsShared?.shared as string[]}
          />
        </div>
      )}

      {data?.aiSuggestions && data.aiSuggestions.length > 0 && (
        <Card className="premium-card mb-8">
          <CardHeader><CardTitle>AI Privacy Suggestions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.aiSuggestions.map((s: string, i: number) => (
              <p key={i} className="text-sm p-3 rounded-lg bg-primary/5 border border-primary/10">💡 {s}</p>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis domain={[0, 100]} className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacy Insights</CardTitle>
            <CardDescription>Your privacy protection summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Most Trusted Merchant</p>
              <p className="font-semibold">{data?.mostTrustedMerchant || 'None yet'}</p>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="font-semibold">{data?.transactions ?? 0}</p>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Risk Avoided</p>
              <p className="font-semibold text-success">High — Zero Aadhaar exposure</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
