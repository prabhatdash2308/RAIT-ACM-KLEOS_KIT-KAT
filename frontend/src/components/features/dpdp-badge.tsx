'use client';

import { BadgeCheck, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DPDPReadyBadgeProps {
  dpdpReady?: boolean;
  trustScore?: number;
  className?: string;
  size?: 'sm' | 'md';
}

export function DPDPReadyBadge({ dpdpReady, trustScore, className, size = 'md' }: DPDPReadyBadgeProps) {
  const isReady = dpdpReady ?? (trustScore !== undefined && trustScore >= 85);

  if (!isReady) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        size === 'sm' ? 'text-xs' : 'text-sm',
        className
      )}
    >
      <BadgeCheck className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      DPDP Ready
    </Badge>
  );
}

export function MerchantRiskAlert({ alert }: { alert: { level: string; message: string } | null }) {
  if (!alert) return null;

  return (
    <div
      className={cn(
        'p-4 rounded-xl border flex gap-3',
        alert.level === 'CRITICAL'
          ? 'bg-destructive/10 border-destructive/30'
          : 'bg-warning/10 border-warning/30'
      )}
    >
      <Shield className={cn('h-5 w-5 shrink-0', alert.level === 'CRITICAL' ? 'text-destructive' : 'text-warning')} />
      <div>
        <p className={cn('font-semibold text-sm', alert.level === 'CRITICAL' ? 'text-destructive' : 'text-warning')}>
          Merchant Risk Alert — {alert.level}
        </p>
        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
      </div>
    </div>
  );
}
