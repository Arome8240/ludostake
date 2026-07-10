'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useMiniPay } from '@/hooks/useMiniPay';
import { ConnectButton } from '@/components/connect-button';
import { ChevronRight, Dices, Swords, Coins, Zap, type LucideIcon } from 'lucide-react';

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

// The 4 Ludo piece colours — floats as ambient accents around the main icon
const PIECE_DOTS = [
  { color: '#E63946', size: 18, style: { top: '-12px', left: '32px' }, delay: 0 },
  { color: '#22C97A', size: 13, style: { top: '24px', right: '-8px' }, delay: 0.7 },
  { color: '#4895EF', size: 15, style: { bottom: '-8px', left: '16px' }, delay: 1.3 },
  { color: '#F5A82E', size: 11, style: { bottom: '28px', right: '-16px' }, delay: 1.9 },
];

const slideVariants: Variants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 280, damping: 28 },
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? '-60%' : '60%',
    opacity: 0,
    transition: { duration: 0.18, ease: 'easeIn' },
  }),
};

// ── Onboarding screen ─────────────────────────────────────────────────────────

function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [[idx, dir], setSlide] = useState<[number, number]>([0, 0]);
  const isLast = idx === SLIDES.length - 1;
  const slide = SLIDES[idx];

  function advance() {
    if (isLast) onComplete();
    else setSlide([idx + 1, 1]);
  }

  function retreat() {
    if (idx > 0) setSlide([idx - 1, -1]);
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-dvh bg-surface overflow-hidden">
      {/* Constrain to phone width, matching app-shell */}
      <div className="relative w-full max-w-[390px] h-dvh flex flex-col overflow-hidden">
        {/* Skip — hidden on last slide */}
        <AnimatePresence>
          {!isLast && (
            <motion.button
              key="skip"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onComplete}
              className="absolute top-4 right-5 z-20 text-sm text-muted-foreground px-2 py-1 tap-target"
            >
              Skip
            </motion.button>
          )}
        </AnimatePresence>

        {/* Slide area */}
        <AnimatePresence initial={false} custom={dir} mode="wait">
          <motion.div
            key={idx}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) advance();
              else if (info.offset.x > 60) retreat();
            }}
            className="absolute inset-0 flex flex-col select-none cursor-grab active:cursor-grabbing"
          >
            {/* ── Visual area ── */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-4">
              {/* Ambient background glow */}
              <div
                className={`absolute w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none ${slide.blur}`}
              />

              {/* Floating piece-colour dots */}
              <div className="relative">
                {PIECE_DOTS.map((dot, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: dot.size,
                      height: dot.size,
                      background: dot.color,
                      boxShadow: `0 0 ${dot.size}px ${dot.color}80`,
                      ...dot.style,
                    }}
                    animate={{ y: [0, -9, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.6 + i * 0.35,
                      ease: 'easeInOut',
                      delay: dot.delay,
                    }}
                  />
                ))}

                {/* Outer decorative ring */}
                <div
                  className={`absolute inset-0 -m-7 rounded-full border ${slide.ring} opacity-30`}
                />

                {/* Main icon circle */}
                <div
                  className={`relative w-48 h-48 rounded-full ${slide.glow} border ${slide.ring} flex items-center justify-center`}
                >
                  <motion.span
                    key={slide.emoji}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 }}
                    className="text-7xl leading-none"
                    style={{ userSelect: 'none' }}
                  >
                    {slide.emoji}
                  </motion.span>
                </div>
              </div>
            </div>

            {/* ── Text + navigation area ── */}
            <div
              className="px-7 pb-safe-bottom"
              style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px) + 2rem)' }}
            >
              {/* Title & body */}
              <motion.h2
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.08 }}
                className="text-2xl font-bold tracking-tight mb-2.5"
              >
                {slide.title}
              </motion.h2>
              <motion.p
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.14 }}
                className="text-sm text-muted-foreground leading-relaxed mb-8"
              >
                {slide.body}
              </motion.p>

              {/* Progress dots */}
              <div className="flex items-center gap-2 mb-6">
                {SLIDES.map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setSlide([i, i > idx ? 1 : -1])}
                    animate={{ width: i === idx ? 24 : 6 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className={`h-1.5 rounded-full transition-colors ${
                      i === idx ? 'bg-primary' : 'bg-surface-border'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>

              {/* CTA */}
              <motion.button
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.18 }}
                whileTap={{ scale: 0.97 }}
                onClick={advance}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2"
              >
                {isLast ? 'Get Started' : 'Next'}
                {!isLast && <ChevronRight className="w-4 h-4" />}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
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

// ── Connect screen ────────────────────────────────────────────────────────────

function ConnectScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-surface px-6 gap-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative"
      >
        <div className="w-24 h-24 rounded-3xl bg-primary/15 border border-primary/30 flex items-center justify-center text-5xl glow-green">
          🎲
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold tracking-tight">
          Ludo <span className="text-primary">Stakes</span>
        </h1>
        <p className="text-muted-foreground text-base max-w-xs">
          Stake cUSD and beat your rivals at Ludo — on Celo.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-xs space-y-3"
      >
        {[
          { icon: '🏆', text: 'Win real cUSD rewards' },
          { icon: '🤖', text: 'Play vs AI or real players' },
          { icon: '⚡', text: 'Instant payouts on Celo' },
        ].map(({ icon, text }) => (
          <div
            key={text}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-raised border border-surface-border"
          >
            <span className="text-xl">{icon}</span>
            <span className="text-sm text-foreground/80">{text}</span>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-xs"
      >
        <ConnectButton />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs text-muted-foreground"
      >
        Powered by <span className="text-primary font-medium">Celo</span>
      </motion.p>
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
    setOnboarded(localStorage.getItem(ONBOARDING_KEY) === 'true');
  }, []);

  const { isConnected, isConnecting, isMiniPay } = useMiniPay();

  if (!mounted) return <LoadingScreen />;

  if (!onboarded) {
    return (
      <OnboardingScreen
        onComplete={() => {
          localStorage.setItem(ONBOARDING_KEY, 'true');
          setOnboarded(true);
        }}
      />
    );
  }

  if (!isConnected && (isConnecting || isMiniPay)) return <LoadingScreen />;

  if (!isConnected) return <ConnectScreen />;

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
