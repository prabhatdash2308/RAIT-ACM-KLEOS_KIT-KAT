'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { QrCode, BarChart3, FileText, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DashboardNav } from '@/components/layout/navbar';
import { useAuthStore } from '@/lib/store';
import { analyticsApi } from '@/lib/api';
import { ATTRIBUTE_LABELS } from '@/lib/utils';

const navLinks = [
  { href: '/merchant/dashboard', label: 'Dashboard' },
  { href: '/merchant/create-request', label: 'Create Request' },
  { href: '/merchant/audit-logs', label: 'Audit Logs' },
];

export default function MerchantDashboard() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) router.push('/auth/login?role=merchant');
  }, [isAuthenticated, router]);

  const { data } = useQuery({
    queryKey: ['merchant-dashboard'],
    queryFn: () => analyticsApi.merchantDashboard(accessToken!),
    enabled: !!accessToken,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardNav links={navLinks} />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">Merchant Dashboard</h1>
        <p className="text-muted-foreground mb-8">Privacy-compliant identity verification</p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Requests', value: data?.totalRequests ?? 0, icon: QrCode },
          { label: 'Success Rate', value: `${data?.successRate ?? 0}%`, icon: BarChart3 },
          { label: 'Privacy Compliance', value: `${data?.privacyCompliance ?? 0}%`, icon: Shield },
          { label: 'Trust Score', value: data?.trustScore ?? 50, icon: FileText },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Trust Score</CardTitle>
            <CardDescription>Based on reason quality, approval rate, and minimal disclosure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <p className="text-4xl font-bold text-primary">{data?.trustScore ?? 50}</p>
              <div className="flex-1">
                <Progress value={data?.trustScore ?? 50} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Link href="/merchant/create-request">
              <Button className="w-full gap-2" size="lg">
                <QrCode className="h-5 w-5" /> Create Verification Request
              </Button>
            </Link>
            <Link href="/merchant/audit-logs">
              <Button variant="outline" className="w-full gap-2" size="lg">
                <FileText className="h-5 w-5" /> View Audit Logs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {data?.recentTransactions && data.recentTransactions.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Recent Verifications</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentTransactions.map((t: { attribute: string; proofValue: string; status: string; time: string }, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{ATTRIBUTE_LABELS[t.attribute] || t.attribute}</p>
                    <p className="text-xs text-muted-foreground">Result: {t.proofValue}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{t.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
