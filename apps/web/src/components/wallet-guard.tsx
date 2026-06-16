'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMiniPay } from '@/hooks/useMiniPay';
import { ConnectButton } from '@/components/connect-button';

// Shown while we wait for client-side hydration or MiniPay auto-connect
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

// Shown in a browser when no wallet is connected
function ConnectScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-surface px-6 gap-8 text-center">
      {/* Logo mark */}
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

      {/* Title */}
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

      {/* Features */}
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

      {/* Connect button */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-xs"
      >
        <ConnectButton />
      </motion.div>

      {/* Footer badge */}
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

interface WalletGuardProps {
  children: React.ReactNode;
}

export function WalletGuard({ children }: WalletGuardProps) {
  // Prevent SSR flash: don't evaluate wallet state until mounted on client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { isConnected, isConnecting, isMiniPay } = useMiniPay();

  if (!mounted) return <LoadingScreen />;

  // MiniPay is auto-connecting — show spinner until it resolves
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
