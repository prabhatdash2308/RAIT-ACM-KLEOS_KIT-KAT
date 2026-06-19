'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TrustStars({ score, className }: { score: number; className?: string }) {
  const stars = Math.round(score / 20);
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn('h-4 w-4', i < stars ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{score}/100</span>
    </div>
  );
}
