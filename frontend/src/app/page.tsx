'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield, ArrowRight, Lock, Zap, CheckCircle, ChevronDown,
  Building2, Pill, Coffee, Landmark, UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PRIVACY_PRINCIPLES } from '@/lib/utils';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const steps = [
  { step: '01', title: 'Import', desc: 'Import Aadhaar XML or connect DigiLocker. We derive attributes — never store Aadhaar.' },
  { step: '02', title: 'Consent', desc: 'Merchant requests specific attributes. AI assistant recommends minimum disclosure.' },
  { step: '03', title: 'Proof', desc: 'Generate time-limited proofs. AGE_OVER_18 = TRUE, never your DOB.' },
  { step: '04', title: 'Verify', desc: 'Merchant receives only verified TRUE/FALSE. Zero identity over-disclosure.' },
];

const scenarios = [
  { icon: Pill, title: 'Pharmacy', attr: 'Age Above 18', color: 'text-red-500' },
  { icon: Building2, title: 'Hotel', attr: 'State Verification', color: 'text-blue-500' },
  { icon: Coffee, title: 'Coffee Shop', attr: 'Student Status', color: 'text-amber-500' },
  { icon: Landmark, title: 'Bank', attr: 'Identity Verified', color: 'text-green-500' },
];

const faqs = [
  { q: 'Does DigiRakshak store my Aadhaar number?', a: 'No. We never store or expose complete Aadhaar details. Only derived verification proofs are generated.' },
  { q: 'What is selective disclosure?', a: 'Instead of sharing your full identity, you share only the specific verified attribute a merchant needs — like age verification without revealing your date of birth.' },
  { q: 'How long do proofs last?', a: 'All proofs expire in 5 minutes and are one-time use, ensuring maximum security.' },
  { q: 'Can I revoke merchant access?', a: 'Yes. You can revoke future access from your consent history at any time.' },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <motion.div {...fadeUp}>
            <Badge variant="outline" className="mb-6">Privacy-First Identity Verification</Badge>
            <h1 className="text-4xl md:text-7xl font-bold tracking-tight mb-6">
              Digi<span className="text-primary">Rakshak</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-4">Prove Only What Matters.</p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              India&apos;s Privacy-First Identity Verification Platform. Share only the required verified attribute — never your complete identity.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/login?role=merchant">
                <Button size="lg" variant="outline">Merchant Demo</Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="secondary">Watch Demo</Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-16 max-w-lg mx-auto glass rounded-2xl p-6"
          >
            <div className="flex items-center justify-between text-sm mb-4">
              <span className="text-muted-foreground">Merchant requests:</span>
              <Badge variant="warning">AGE_OVER_18</Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 text-left">
                <p className="text-xs text-muted-foreground line-through">DOB: 15/05/1998</p>
                <p className="text-2xl font-bold text-success">AGE_OVER_18 = TRUE</p>
              </div>
              <Shield className="h-12 w-12 text-primary opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-3">Merchant only receives TRUE. Never your DOB.</p>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div key={s.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                <Card className="h-full">
                  <CardHeader>
                    <span className="text-4xl font-bold text-primary/20">{s.step}</span>
                    <CardTitle>{s.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{s.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="py-20">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12">
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">The Problem</CardTitle>
              <CardDescription>Current Aadhaar over-disclosure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Merchants collect full Aadhaar copies for simple age checks</p>
              <p>• Personal data stored indefinitely without consent</p>
              <p>• No way to verify one attribute without exposing all</p>
              <p>• Massive privacy risk from data breaches</p>
            </CardContent>
          </Card>
          <Card className="border-success/30">
            <CardHeader>
              <CardTitle className="text-success">The Solution</CardTitle>
              <CardDescription>Selective disclosure with consent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Share only the specific attribute needed</p>
              <p>• Time-limited, one-time verification proofs</p>
              <p>• AI-powered privacy recommendations</p>
              <p>• Zero Aadhaar storage — privacy by design</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Demo Scenarios */}
      <section id="benefits" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Demo Scenarios</h2>
          <p className="text-center text-muted-foreground mb-12">Real-world use cases with minimum disclosure</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {scenarios.map((s) => (
              <Card key={s.title} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-8">
                  <s.icon className={`h-12 w-12 mx-auto mb-4 ${s.color}`} />
                  <h3 className="font-semibold text-lg">{s.title}</h3>
                  <Badge variant="outline" className="mt-2">{s.attr}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Lock, title: 'Identity Protection', desc: 'Never expose full Aadhaar details' },
              { icon: CheckCircle, title: 'Compliance', desc: 'Purpose limitation & data minimization' },
              { icon: Zap, title: 'Speed', desc: 'Instant QR-based verification' },
              { icon: UserCheck, title: 'Offline Ready', desc: 'Works with Aadhaar Offline XML' },
            ].map((b) => (
              <div key={b.title} className="text-center p-6">
                <b.icon className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Principles */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Privacy Principles</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {PRIVACY_PRINCIPLES.map((p) => (
              <div key={p.title} className="flex gap-3 p-4 rounded-lg border bg-card">
                <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">{p.title}</h4>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl font-bold text-center mb-12">FAQ</h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <Card key={f.q}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ChevronDown className="h-4 w-4 text-primary" />
                    {f.q}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{f.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">DigiRakshak</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Prove Only What Matters.</p>
          <p className="text-xs text-muted-foreground">© 2026 DigiRakshak. Built for privacy-first identity verification.</p>
        </div>
      </footer>
    </div>
  );
}
