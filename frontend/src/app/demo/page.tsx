'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, ArrowRight, Pill, Building2, Coffee, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const scenarios = [
  {
    icon: Pill,
    title: 'Pharmacy',
    desc: 'Verify Age Above 18 for medicine purchase',
    steps: ['Merchant creates QR requesting AGE_OVER_18', 'Citizen scans and reviews AI recommendation', 'Citizen approves — merchant receives TRUE, never DOB'],
    color: 'text-red-500',
    href: '/auth/login?role=merchant',
  },
  {
    icon: Building2,
    title: 'Hotel',
    desc: 'Verify State for local resident discount',
    steps: ['Hotel requests STATE attribute only', 'AI confirms minimal disclosure', 'Proof shared: STATE = Karnataka'],
    color: 'text-blue-500',
    href: '/auth/login?role=merchant',
  },
  {
    icon: Coffee,
    title: 'Coffee Shop',
    desc: 'Verify Student Status for discount',
    steps: ['Coffee shop requests STUDENT status', 'Citizen reviews purpose and reason', 'Proof: STUDENT = TRUE'],
    color: 'text-amber-500',
    href: '/auth/login?role=merchant',
  },
  {
    icon: Landmark,
    title: 'Bank',
    desc: 'Verify Identity Authenticity',
    steps: ['Bank requests IDENTITY_VERIFIED', 'No personal data requested', 'Proof: IDENTITY_VERIFIED = TRUE'],
    color: 'text-green-500',
    href: '/auth/login?role=merchant',
  },
];

export default function DemoPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Play className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Live Demo Scenarios</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience privacy-first identity verification across real-world use cases.
            Login with demo credentials to try the full flow.
          </p>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {scenarios.map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <s.icon className={`h-10 w-10 ${s.color} mb-2`} />
                <CardTitle>{s.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{s.desc}</p>
                <ol className="space-y-2 mb-6">
                  {s.steps.map((step, j) => (
                    <li key={j} className="text-sm flex gap-2">
                      <span className="text-primary font-bold">{j + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
                <Link href={s.href}>
                  <Button className="w-full gap-2">
                    Try as Merchant <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-12">
        <p className="text-muted-foreground mb-4">Demo credentials: citizen@demo.in / pharmacy@demo.in — Password: Demo@123</p>
        <div className="flex justify-center gap-4">
          <Link href="/auth/login"><Button variant="outline">Login as Citizen</Button></Link>
          <Link href="/auth/login?role=merchant"><Button>Login as Merchant</Button></Link>
        </div>
      </div>
    </div>
  );
}
