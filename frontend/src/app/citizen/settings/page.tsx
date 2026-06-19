'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardNav } from '@/components/layout/navbar';
import { Settings, Bell, Lock, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

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
      </div>
    </div>
  );
}
