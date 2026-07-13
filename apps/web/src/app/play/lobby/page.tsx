'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Copy, Check, X, Users } from 'lucide-react';
import { PageTransition } from '@/components/page-transition';
import { useStaking } from '@/hooks/useStaking';

function LobbyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const gameId = params.get('gameId') as `0x${string}` | null;
  const stake = params.get('stake') ?? '1.00';

  const { cancelGame } = useStaking();
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const shortId = gameId ? `${gameId.slice(0, 10)}…${gameId.slice(-6)}` : '—';

  const handleCopy = async () => {
    if (!gameId) return;
    await navigator.clipboard.writeText(gameId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancel = async () => {
    if (!gameId) return router.push('/play');
    setCancelling(true);
    try {
      await cancelGame(gameId);
    } catch {
      // ignore — still navigate back
    }
    router.push('/play');
  };

  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  return (
    <PageTransition>
      <div className="flex flex-col items-center gap-6 px-4 py-8 flex-1">
        {/* Animated rings */}
        <div className="relative flex items-center justify-center w-32 h-32">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-2 border-primary/30"
              style={{ width: 32 + i * 24, height: 32 + i * 24 }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.2, 0.6] }}
              transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
            />
          ))}
          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
            <Users className="w-7 h-7 text-primary" />
          </div>
        </div>

        {/* Status */}
        <div className="text-center">
          <p className="text-xl font-bold">Finding opponent…</p>
          <p className="text-sm text-muted-foreground mt-1">Stake locked · {stake} USDm</p>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {mins}:{secs}
          </p>
        </div>

        {/* Game ID */}
        <div className="w-full rounded-2xl bg-surface-raised border border-surface-border p-4">
          <p className="text-xs text-muted-foreground mb-2">Game ID</p>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-mono text-foreground truncate">{shortId}</p>
            <button
              onClick={handleCopy}
              className="shrink-0 w-8 h-8 rounded-lg bg-surface-overlay border border-surface-border flex items-center justify-center active:scale-90 transition-transform"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Share your Game ID with a friend to start a private match. Or wait for a random opponent.
        </p>

        {/* Cancel */}
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-loss/30 text-loss text-sm font-medium active:scale-95 transition-transform disabled:opacity-50"
        >
          <X className="w-4 h-4" />
          {cancelling ? 'Cancelling…' : 'Cancel & Refund'}
        </button>
      </div>
    </PageTransition>
  );
}

export default function LobbyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <LobbyContent />
    </Suspense>
  );
}
