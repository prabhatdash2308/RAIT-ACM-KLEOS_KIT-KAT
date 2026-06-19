'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardNav } from '@/components/layout/navbar';
import { TrustStars } from '@/components/features/trust-stars';
import { DashboardSkeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/lib/store';
import { analyticsApi } from '@/lib/api';

const navLinks = [
  { href: '/merchant/dashboard', label: 'Dashboard' },
  { href: '/merchant/create-request', label: 'Create Request' },
  { href: '/merchant/analytics', label: 'Analytics' },
  { href: '/merchant/audit-logs', label: 'Audit Logs' },
  { href: '/merchant/profile', label: 'Profile' },
];

export default function MerchantAnalyticsPage() {
  const token = useAuthStore((s) => s.accessToken);

  const { data, isLoading } = useQuery({
    queryKey: ['merchant-analytics'],
    queryFn: () => analyticsApi.merchantAnalytics(token!),
    enabled: !!token,
  });

  if (isLoading) return <div className="container mx-auto px-4 py-8"><DashboardSkeleton /></div>;

  const analytics = data as {
    trustScore: number;
    approvalRate: number;
    reasonQuality: number;
    minimalDisclosure: number;
    complaints: number;
    attributeBreakdown: { attribute: string; count: number }[];
    monthlyVolume: { month: string; count: number }[];
    consentBreakdown: { approved: number; rejected: number; minimum: number };
    trustHistory: { month: string; score: number }[];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardNav links={navLinks} />
      <h1 className="text-3xl font-bold mb-8">Merchant Analytics</h1>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="premium-card"><CardContent className="pt-6"><TrustStars score={analytics?.trustScore ?? 50} /><p className="text-sm text-muted-foreground mt-2">Trust Score</p></CardContent></Card>
        <Card className="premium-card"><CardContent className="pt-6"><p className="text-3xl font-bold">{analytics?.approvalRate?.toFixed(0) ?? 0}%</p><p className="text-sm text-muted-foreground">Approval Rate</p></CardContent></Card>
        <Card className="premium-card"><CardContent className="pt-6"><p className="text-3xl font-bold">{analytics?.reasonQuality?.toFixed(0) ?? 0}</p><p className="text-sm text-muted-foreground">Reason Quality</p></CardContent></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="premium-card">
          <CardHeader><CardTitle>Trust Score Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics?.trustHistory || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" /><YAxis domain={[0, 100]} /><Tooltip />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="premium-card">
          <CardHeader><CardTitle>Attribute Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics?.attributeBreakdown || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="attribute" /><YAxis /><Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
