'use client';

import { motion } from 'framer-motion';
import { Bot, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ReasonScore {
  attribute: string;
  score: number;
  feedback: string;
  verdict: string;
}

interface AIAnalysis {
  riskLevel: string;
  recommendation: string;
  privacyScorePreview: number;
  unnecessaryAttributes: string[];
  minimumAttributes?: string[];
  reasonScores: ReasonScore[];
  summary: string;
  explanation: string;
  transparency?: {
    traditionalFields: string[];
    requestedFields: string[];
    minimumShareFields: string[];
    disclosurePreventedPercent: number;
    privacySavedKb: number;
  };
}

const riskVariant = (level: string) => {
  if (level === 'CRITICAL') return 'destructive' as const;
  if (level === 'HIGH') return 'destructive' as const;
  if (level === 'MEDIUM') return 'warning' as const;
  return 'success' as const;
};

const riskIcon = (level: string) => {
  if (level === 'CRITICAL' || level === 'HIGH') return ShieldX;
  if (level === 'MEDIUM') return ShieldAlert;
  return ShieldCheck;
};

export function AIAssistantPanel({ analysis }: { analysis: AIAnalysis }) {
  const Icon = riskIcon(analysis.riskLevel);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-primary/30 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-cyan-500 to-emerald-500" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            Explainable AI Privacy Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant={riskVariant(analysis.riskLevel)} className="gap-1">
              <Icon className="h-3 w-3" /> Risk: {analysis.riskLevel}
            </Badge>
            <Badge variant="outline">Privacy Score: {analysis.privacyScorePreview}/100</Badge>
            <Badge variant={analysis.recommendation === 'APPROVE' ? 'success' : analysis.recommendation === 'REJECT' ? 'destructive' : 'warning'}>
              Recommend: {analysis.recommendation}
            </Badge>
          </div>

          <div className="p-4 rounded-xl bg-muted/50 border text-sm leading-relaxed">
            {analysis.explanation}
          </div>

          {analysis.reasonScores.map((r) => (
            <div key={r.attribute} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{r.attribute} — Reason Quality</span>
                <span className={r.score < 40 ? 'text-destructive' : r.score >= 80 ? 'text-success' : 'text-warning'}>
                  {r.score}/100
                </span>
              </div>
              <Progress value={r.score} className="h-2" />
              <p className="text-xs text-muted-foreground">{r.feedback}</p>
            </div>
          ))}

          {analysis.unnecessaryAttributes.length > 0 && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
              <p className="font-medium text-destructive mb-1">Unnecessary attributes detected</p>
              <p>{analysis.unnecessaryAttributes.join(', ')}</p>
            </div>
          )}

          {analysis.transparency && (
            <div className="text-xs text-muted-foreground">
              {analysis.transparency.disclosurePreventedPercent}% unnecessary disclosure prevented vs traditional Aadhaar share
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
