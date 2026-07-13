'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices } from 'lucide-react';

// ── Onboarding screen ─────────────────────────────────────────────────────────

function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-surface px-6">
      <div className="flex flex-col items-center gap-6 w-full max-w-[320px]">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-20 h-20 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center"
        >
          <Dices className="w-10 h-10 text-primary" strokeWidth={1.5} />
        </motion.div>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Ludo <span className="text-primary">Stakes</span>
          </h1>
          <p className="text-sm text-muted-foreground">Naija Ludo. Real stakes. On Celo.</p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onComplete}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base"
          style={{
            marginTop: 8,
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px) + 1rem)',
          }}
        >
          Get Started
        </motion.button>
      </div>
    </div>
  );
}

// ── Loading screen ────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-surface gap-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 rounded-2xl bg-primary/20 border-2 border-primary flex items-center justify-center text-3xl"
      >
        🎲
      </motion.div>
      <p className="text-muted-foreground text-sm">Connecting wallet…</p>
    </div>
  );
}

// ── Guard ─────────────────────────────────────────────────────────────────────

interface WalletGuardProps {
  children: React.ReactNode;
}

export function WalletGuard({ children }: WalletGuardProps) {
  const [mounted, setMounted] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <LoadingScreen />;

  if (!onboarded) {
    return <OnboardingScreen onComplete={() => setOnboarded(true)} />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="app"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="contents"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
