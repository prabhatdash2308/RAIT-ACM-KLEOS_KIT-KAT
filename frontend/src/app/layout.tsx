import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/layout/navbar';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'DigiRakshak - Prove Only What Matters',
  description: "India's Privacy-First Identity Verification Platform. Selective disclosure for Aadhaar verification.",
  keywords: ['Aadhaar', 'privacy', 'identity verification', 'selective disclosure', 'DigiLocker'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen`}>
        <Providers>
          <Toaster />
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
