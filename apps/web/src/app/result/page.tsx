'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trophy, X, Minus, Home, RotateCcw, ExternalLink } from 'lucide-react';
import { PageTransition } from '@/components/page-transition';

function Confetti() {
  const colors = ['#16a34a', '#eab308', '#22c55e', '#facc15', '#ffffff'];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-0 w-2 h-2 rounded-sm"
          style={{
            left: `${(i / 24) * 100}%`,
            backgroundColor: colors[i % colors.length],
          }}
          initial={{ y: -16, opacity: 1, rotate: 0 }}
          animate={{ y: '100vh', opacity: 0, rotate: 720 }}
          transition={{ duration: 2 + (i % 5) * 0.3, delay: (i % 8) * 0.1, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

function ResultContent() {
  const router = useRouter();
  const params = useSearchParams();

  const result = (params.get('result') ?? 'loss') as 'win' | 'loss' | 'draw';
  const reward = params.get('reward');
  const stake = params.get('stake');
  const mode = params.get('mode');
  const difficulty = params.get('difficulty');
  const txHash = params.get('tx') as `0x${string}` | null;

  const isWin = result === 'win';
  const isDraw = result === 'draw';

  const modeLabel = mode === 'computer' ? `vs Computer (${difficulty ?? 'rookie'})` : 'vs Players';

  const handlePlayAgain = () => {
    if (mode === 'computer') router.push(`/play/computer`);
    else router.push('/play/pvp');
  };

  return (
    <PageTransition>
      {isWin && <Confetti />}

      <div className="flex flex-col items-center gap-6 px-4 py-8 flex-1 relative z-10">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.1 }}
          className={`w-24 h-24 rounded-3xl flex items-center justify-center ${
            isWin
              ? 'bg-gold/20 border-2 border-gold shadow-glow-gold'
              : isDraw
                ? 'bg-surface-raised border-2 border-surface-border'
                : 'bg-loss/20 border-2 border-loss/50'
          }`}
        >
          {isWin ? (
            <Trophy className="w-12 h-12 text-gold" />
          ) : isDraw ? (
            <Minus className="w-12 h-12 text-muted-foreground" />
          ) : (
            <X className="w-12 h-12 text-loss" />
          )}
        </motion.div>

        {/* Result text */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p
            className={`text-3xl font-bold ${isWin ? 'text-gold' : isDraw ? 'text-foreground' : 'text-loss'}`}
          >
            {isWin ? 'You Won!' : isDraw ? "It's a Draw" : 'You Lost'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{modeLabel}</p>
        </motion.div>

        {/* Reward / stake */}
        {(reward || stake) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full rounded-2xl bg-surface-raised border border-surface-border overflow-hidden"
          >
            {isWin && reward && (
              <div className="flex justify-between items-center px-4 py-3 border-b border-surface-border bg-gold/5">
                <span className="text-sm font-semibold">You earned</span>
                <span className="text-base font-bold text-gold">
                  {parseFloat(reward).toFixed(2)} cUSD
                </span>
              </div>
            )}
            {stake && (
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-muted-foreground">
                  {isWin ? 'Your stake' : 'Stake lost'}
                </span>
                <span className={`text-sm font-medium ${!isWin && !isDraw ? 'text-loss' : ''}`}>
                  {parseFloat(stake).toFixed(2)} cUSD
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* Tx link */}
        {txHash && (
          <motion.a
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            href={`https://alfajores.celoscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary"
          >
            View transaction
            <ExternalLink className="w-3 h-3" />
          </motion.a>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col gap-3 w-full mt-auto"
        >
          <button
            onClick={handlePlayAgain}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-primary text-white font-bold text-base active:scale-95 transition-transform glow-green"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-surface-raised border border-surface-border text-foreground font-medium text-sm active:scale-95 transition-transform"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
        </motion.div>
      </div>
    </PageTransition>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
