'use client';

import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TransparencyMeterProps {
  transparencyScore: number;
  disclosurePreventedPercent: number;
  privacySavedKb: number;
  traditionalFields?: string[];
  requestedFields?: string[];
  sharedFields?: string[];
}

export function TransparencyMeter({
  transparencyScore,
  disclosurePreventedPercent,
  privacySavedKb,
  traditionalFields = ['Name', 'Aadhaar', 'DOB', 'Address', 'Phone', 'Photo'],
  requestedFields = [],
  sharedFields = [],
}: TransparencyMeterProps) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (transparencyScore / 100) * circumference;

  return (
    <Card className="glass overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-emerald-500" />
          Transparency Meter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <motion.circle
                cx="60" cy="60" r="54" fill="none"
                stroke="url(#grad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{transparencyScore}</span>
              <span className="text-xs text-muted-foreground">Transparency</span>
            </div>
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-2xl font-bold text-emerald-600">{disclosurePreventedPercent}%</p>
                <p className="text-xs text-muted-foreground">Leak Prevented</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-center">
                <p className="text-2xl font-bold text-primary">{privacySavedKb} KB</p>
                <p className="text-xs text-muted-foreground">Privacy Saved</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Traditional share would expose</p>
                <div className="flex flex-wrap gap-1">
                  {traditionalFields.map((f) => (
                    <span key={f} className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs line-through">{f}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">You shared only</p>
                <div className="flex flex-wrap gap-1">
                  {(sharedFields.length ? sharedFields : requestedFields).map((f) => (
                    <span key={f} className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
