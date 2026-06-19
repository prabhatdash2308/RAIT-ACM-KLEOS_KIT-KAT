'use client';

import { useAuthStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardNav } from '@/components/layout/navbar';
import { User, Mail, Phone, Shield } from 'lucide-react';

const navLinks = [
  { href: '/citizen/dashboard', label: 'Dashboard' },
  { href: '/citizen/wallet', label: 'Wallet' },
  { href: '/citizen/scan', label: 'Scan QR' },
  { href: '/citizen/history', label: 'History' },
  { href: '/citizen/privacy', label: 'Privacy' },
  { href: '/citizen/profile', label: 'Profile' },
];

export default function CitizenProfilePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <DashboardNav links={navLinks} />
      <h1 className="text-3xl font-bold mb-8">Profile</h1>

      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <Badge variant="outline" className="capitalize">{user?.type || 'citizen'}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-medium">Verified via OTP</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
