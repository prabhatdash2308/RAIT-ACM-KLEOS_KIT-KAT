'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardNav } from '@/components/layout/navbar';
import { Settings, Bell, Lock, Moon, AlertCircle } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store';
import { privacyApi } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';

const navLinks = [
  { href: '/citizen/dashboard', label: 'Dashboard' },
  { href: '/citizen/wallet', label: 'Wallet' },
  { href: '/citizen/scan', label: 'Scan QR' },
  { href: '/citizen/history', label: 'History' },
  { href: '/citizen/privacy', label: 'Privacy' },
  { href: '/citizen/settings', label: 'Settings' },
];

export default function CitizenSettingsPage() {
  const { theme, setTheme } = useTheme();
  const token = useAuthStore((s) => s.accessToken);
  const { toast } = useToast();
  const [institution, setInstitution] = useState('');

  const { data: emergencyHistory } = useQuery({
    queryKey: ['emergency-history'],
    queryFn: () => privacyApi.emergencyHistory(token!),
    enabled: !!token,
  });

  const activateEmergency = async () => {
    if (!institution || !token) return;
    try {
      await privacyApi.emergencyActivate(token, institution);
      toast({ title: 'Emergency Profile Shared', description: 'Minimal attributes shared. Fully auditable.', variant: 'success' });
      setInstitution('');
    } catch {
      toast({ title: 'Emergency Mode Failed', variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <DashboardNav links={navLinks} />
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2"><Settings className="h-8 w-8" /> Settings</h1>

      <div className="space-y-4">
        <Card className="premium-card">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Moon className="h-4 w-4" /> Appearance</CardTitle></CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </Button>
          </CardContent>
        </Card>
        <Card className="premium-card">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Consent request alerts enabled</p></CardContent>
        </Card>
        <Card className="premium-card">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" /> Security</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Encrypted local storage · Session timeout 15 min · Device binding active</p></CardContent>
        </Card>
        <Card className="premium-card border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" /> Emergency Verification Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share predefined minimal attributes with hospitals or emergency services. Every use is logged and auditable.
            </p>
            <Input placeholder="Institution name (e.g. City Hospital)" value={institution} onChange={(e) => setInstitution(e.target.value)} />
            <Button variant="destructive" onClick={activateEmergency} disabled={!institution}>
              Activate Emergency Profile
            </Button>
            {(emergencyHistory as { institution: string; usedAt: string }[])?.length > 0 && (
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                <p className="font-medium">Recent emergency uses:</p>
                {(emergencyHistory as { institution: string; usedAt: string }[]).slice(0, 3).map((e, i) => (
                  <p key={i}>{e.institution} — {new Date(e.usedAt).toLocaleDateString()}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
