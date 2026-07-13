'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, Swords, Coins, Zap, type LucideIcon } from 'lucide-react';

// ── Onboarding slide data ─────────────────────────────────────────────────────

interface Slide {
  Icon: LucideIcon;
  iconColor: string;
  ring: string;
  glow: string;
  blur: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    Icon: Dices,
    iconColor: 'text-primary',
    ring: 'border-primary/50',
    glow: 'bg-primary/25',
    blur: 'bg-primary/40',
    title: 'Ludo Stakes',
    body: 'The classic Nigerian board game — now with real cUSD on the line.',
  },
  {
    Icon: Swords,
    iconColor: 'text-yellow-400',
    ring: 'border-yellow-500/50',
    glow: 'bg-yellow-500/20',
    blur: 'bg-yellow-500/40',
    title: 'Pure Naija Rules',
    body: 'Roll 6 + 3? Exit a piece then move it 3 steps — each die is its own move, just like real Naija Ludo.',
  },
  {
    Icon: Coins,
    iconColor: 'text-yellow-400',
    ring: 'border-yellow-500/50',
    glow: 'bg-yellow-500/20',
    blur: 'bg-yellow-500/40',
    title: 'Stake Real cUSD',
    body: 'Practice free vs the AI, or wager Celo Dollars against a live opponent. Winner collects the pot instantly.',
  },
  {
    Icon: Zap,
    iconColor: 'text-primary',
    ring: 'border-primary/50',
    glow: 'bg-primary/25',
    blur: 'bg-primary/40',
    title: 'Built on Celo',
    body: 'Near-zero gas fees. Every result recorded on-chain. Works natively in MiniPay — no setup needed.',
  },
];

// ── Onboarding screen ─────────────────────────────────────────────────────────

function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-surface overflow-hidden">
      <div className="w-full max-w-[390px] h-dvh flex flex-col px-6 overflow-y-auto">
        {/* Hero */}
        <div className="flex flex-col items-center pt-16 pb-8">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="w-20 h-20 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-5"
          >
            <Dices className="w-10 h-10 text-primary" strokeWidth={1.5} />
          </motion.div>
          <motion.h1
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.08 }}
            className="text-3xl font-bold tracking-tight mb-2"
          >
            Ludo <span className="text-primary">Stakes</span>
          </motion.h1>
          <motion.p
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.13 }}
            className="text-sm text-muted-foreground text-center max-w-[260px]"
          >
            The classic Nigerian board game — now with real CELO on the line.
          </motion.p>
        </div>

        {/* Feature list */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.18 }}
          className="flex flex-col gap-3 flex-1"
        >
          {SLIDES.slice(1).map((slide) => (
            <div
              key={slide.title}
              className={`flex items-start gap-4 p-4 rounded-2xl border ${slide.ring}`}
            >
              <div className={`mt-0.5 shrink-0`}>
                <slide.Icon className={`w-5 h-5 ${slide.iconColor}`} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-0.5">{slide.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{slide.body}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.28 }}
          className="py-6"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px) + 1.5rem)' }}
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onComplete}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base"
          >
            Get Started
          </motion.button>
        </motion.div>
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
