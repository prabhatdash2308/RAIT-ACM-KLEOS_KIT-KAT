'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, FileText, Link2, Play, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';
import { walletApi } from '@/lib/api';
import { PRIVACY_PRINCIPLES } from '@/lib/utils';

const slides = [
  {
    title: 'Welcome to DigiRakshak',
    description: 'Your privacy-first identity wallet. We help you prove only what matters — never your complete identity.',
    icon: Shield,
  },
  {
    title: 'Selective Disclosure',
    description: 'Instead of sharing your full Aadhaar, share only verified attributes like AGE_OVER_18 = TRUE. Merchants never see your DOB.',
    icon: FileText,
  },
  {
    title: 'You Stay in Control',
    description: 'Every disclosure requires your explicit consent. AI assistant recommends minimum disclosure. Revoke access anytime.',
    icon: Link2,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleImport = async (method: 'mock' | 'digilocker' | 'demo') => {
    if (!token) return;
    setLoading(true);
    try {
      if (method === 'mock') await walletApi.importMock(token);
      else if (method === 'digilocker') await walletApi.digilocker(token);
      else await walletApi.demoMode(token);
      router.push('/citizen/dashboard');
    } catch {
      setLoading(false);
    }
  };

  if (step < slides.length) {
    const slide = slides[step];
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-8">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <slide.icon className="h-16 w-16 text-primary mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-center mb-3">{slide.title}</h2>
                <p className="text-muted-foreground text-center mb-8">{slide.description}</p>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-2 mb-8">
              {slides.map((_, i) => (
                <div key={i} className={`h-2 w-8 rounded-full transition-colors ${i === step ? 'bg-primary' : 'bg-muted'}`} />
              ))}
            </div>

            <div className="flex gap-3">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              )}
              <Button className="flex-1" onClick={() => setStep(step + 1)}>
                {step === slides.length - 1 ? 'Set Up Wallet' : 'Next'} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-2">Set Up Your Wallet</h1>
      <p className="text-muted-foreground text-center mb-8">Import credentials to derive verification attributes. We never store your Aadhaar number.</p>

      <div className="grid gap-4 mb-8">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleImport('mock')}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5" /> Import Aadhaar XML</CardTitle>
            <CardDescription>Upload offline Aadhaar XML to derive verification attributes</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleImport('digilocker')}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Link2 className="h-5 w-5" /> Connect DigiLocker</CardTitle>
            <CardDescription>Securely fetch credentials from your DigiLocker account</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleImport('demo')}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Play className="h-5 w-5" /> Skip — Demo Mode</CardTitle>
            <CardDescription>Use pre-configured demo credentials for hackathon demonstration</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {loading && <p className="text-center text-muted-foreground">Setting up wallet...</p>}

      <div className="grid sm:grid-cols-2 gap-3">
        {PRIVACY_PRINCIPLES.slice(0, 4).map((p) => (
          <div key={p.title} className="flex gap-2 text-xs p-3 rounded-lg border">
            <Shield className="h-4 w-4 text-primary shrink-0" />
            <div><span className="font-medium">{p.title}:</span> {p.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
