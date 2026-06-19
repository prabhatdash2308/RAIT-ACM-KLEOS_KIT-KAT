'use client';

import { Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { DPDPCompliance } from '@/lib/api';

export function DPDPComplianceDashboard({ data }: { data: DPDPCompliance }) {
  return (
    <Card className="premium-card border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          DPDP Compliance Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center p-6 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-5xl font-bold text-gradient">{data.dpdpCompliancePercent}%</p>
          <p className="text-sm text-muted-foreground mt-2">Live DPDP Compliance Score</p>
          <Badge variant="success" className="mt-3">DPDP Act Aligned</Badge>
        </div>

        <div className="space-y-4">
          {data.metrics.map((m) => (
            <div key={m.name} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{m.name}</span>
                <span className="text-muted-foreground">{m.value}% · {m.weight}</span>
              </div>
              <Progress value={m.value} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
