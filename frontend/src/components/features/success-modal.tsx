'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  proofs: { attribute: string; value: string }[];
  mode?: string;
}

export function VerificationSuccessModal({ open, onClose, proofs, mode }: SuccessModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="glass rounded-2xl p-8 max-w-md w-full text-center border border-success/30"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6"
            >
              <CheckCircle className="h-12 w-12 text-success" />
            </motion.div>

            <h2 className="text-2xl font-bold mb-2">Proof Generated!</h2>
            <p className="text-muted-foreground mb-6">
              {mode === 'MINIMUM' ? 'Minimum disclosure proofs shared.' : 'Verification proofs generated successfully.'}
              Expires in 5 minutes.
            </p>

            <div className="space-y-2 mb-6">
              {proofs.map((p) => (
                <div key={p.attribute} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <span className="text-sm font-medium">{p.attribute}</span>
                  <span className="font-bold text-success">{p.value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-6">
              <Shield className="h-4 w-4" />
              No Aadhaar, DOB, or address was shared
            </div>

            <Button onClick={onClose} className="w-full">View Consent History</Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
