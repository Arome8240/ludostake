'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { useStaking, type StakingStatus } from '@/hooks/useStaking';
import { stakeBreakdown } from '@/lib/contract';

// ── Types ──────────────────────────────────────────────────────────────────────

interface StakeModalProps {
  open: boolean;
  stakeAmount: string; // human-readable cUSD e.g. "1.00"
  onClose: () => void;
  onSuccess: (gameId: `0x${string}`) => void;
}

// ── Step indicator ─────────────────────────────────────────────────────────────

type Step = { label: string; status: 'idle' | 'active' | 'done' | 'error' };

function stepStatus(current: StakingStatus, stepKey: 'approve' | 'stake'): Step['status'] {
  const APPROVE_ACTIVE: StakingStatus[] = ['approving', 'approval-pending'];
  const STAKE_ACTIVE: StakingStatus[] = ['creating', 'create-pending', 'joining', 'join-pending'];

  if (current === 'error') {
    // colour the active step red
    if (stepKey === 'approve' && APPROVE_ACTIVE.includes(current)) return 'error';
    if (stepKey === 'stake' && STAKE_ACTIVE.includes(current)) return 'error';
  }
  if (stepKey === 'approve') {
    if (APPROVE_ACTIVE.includes(current)) return 'active';
    if (['creating', 'create-pending', 'joining', 'join-pending', 'success'].includes(current))
      return 'done';
    return 'idle';
  }
  // stake step
  if (STAKE_ACTIVE.includes(current)) return 'active';
  if (current === 'success') return 'done';
  return 'idle';
}

function Steps({ status }: { status: StakingStatus }) {
  const steps: { key: 'approve' | 'stake'; label: string }[] = [
    { key: 'approve', label: 'Approve cUSD' },
    { key: 'stake', label: 'Lock stake' },
  ];

  return (
    <div className="flex items-center gap-2 w-full">
      {steps.map(({ key, label }, idx) => {
        const s = stepStatus(status, key);
        return (
          <div key={key} className="flex items-center gap-2 flex-1">
            <div
              className={`
                flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0
                transition-colors duration-300
                ${s === 'done' ? 'bg-primary text-white' : ''}
                ${s === 'active' ? 'bg-primary/20 border-2 border-primary text-primary' : ''}
                ${s === 'error' ? 'bg-loss/20 border-2 border-loss text-loss' : ''}
                ${s === 'idle' ? 'bg-surface-overlay border border-surface-border text-muted-foreground' : ''}
              `}
            >
              {s === 'done' ? (
                '✓'
              ) : s === 'active' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                idx + 1
              )}
            </div>
            <span
              className={`text-xs truncate transition-colors duration-300 ${
                s === 'active' ? 'text-foreground font-medium' : 'text-muted-foreground'
              }`}
            >
              {label}
            </span>
            {idx < steps.length - 1 && (
              <div
                className={`h-px flex-1 transition-colors duration-300 ${
                  stepStatus(status, steps[idx + 1].key) !== 'idle'
                    ? 'bg-primary'
                    : 'bg-surface-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Transaction hash link ──────────────────────────────────────────────────────

function TxLink({ hash, chainId }: { hash: `0x${string}`; chainId?: number }) {
  const base = chainId === 42220 ? 'https://celoscan.io' : 'https://alfajores.celoscan.io';
  return (
    <a
      href={`${base}/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-xs text-primary hover:underline"
    >
      View on CeloScan
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

// ── Success confetti ───────────────────────────────────────────────────────────

function Confetti() {
  const colors = ['#16a34a', '#eab308', '#22c55e', '#facc15', '#ffffff'];
  const pieces = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.2 + Math.random() * 0.8,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {pieces.map(({ id, color, x, delay, duration }) => (
        <motion.div
          key={id}
          className="absolute top-0 w-2 h-2 rounded-sm"
          style={{ left: `${x}%`, backgroundColor: color }}
          initial={{ y: -10, opacity: 1, rotate: 0 }}
          animate={{ y: 280, opacity: 0, rotate: 720 }}
          transition={{ duration, delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────────

export function StakeModal({ open, stakeAmount, onClose, onSuccess }: StakeModalProps) {
  const {
    status,
    gameId,
    gameTxHash,
    approveTxHash,
    error,
    netRewardFormatted,
    isPending,
    isSuccess,
    isError,
    createGame,
    reset,
  } = useStaking();

  const breakdown = stakeBreakdown(stakeAmount);
  const hasFired = useRef(false);

  // Trigger onSuccess callback once when status flips to success
  useEffect(() => {
    if (isSuccess && gameId && !hasFired.current) {
      hasFired.current = true;
      setTimeout(() => onSuccess(gameId), 1_200); // brief delay to show success UI
    }
  }, [isSuccess, gameId, onSuccess]);

  // Reset hook state when modal closes
  useEffect(() => {
    if (!open) {
      hasFired.current = false;
      reset();
    }
  }, [open, reset]);

  const handleConfirm = () => createGame(stakeAmount);

  // Derive display hash (most recent tx)
  const displayHash = gameTxHash ?? approveTxHash;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/70 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isPending ? onClose : undefined}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-50"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="relative glass rounded-t-3xl px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] overflow-hidden">
              {/* Success confetti */}
              {isSuccess && <Confetti />}

              {/* Handle bar */}
              <div className="w-10 h-1 bg-surface-border rounded-full mx-auto mb-4" />

              {/* Close button */}
              {!isPending && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors tap-target"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              <AnimatePresence mode="wait">
                {/* ── SUCCESS ─────────────────────────────────────────────── */}
                {isSuccess && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4 py-4 text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">Stake locked!</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Win to earn{' '}
                        <span className="text-gold font-semibold">{netRewardFormatted} cUSD</span>
                      </p>
                    </div>
                    {displayHash && <TxLink hash={displayHash} />}
                  </motion.div>
                )}

                {/* ── ERROR ───────────────────────────────────────────────── */}
                {isError && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-loss/10 border border-loss/30">
                      <AlertCircle className="w-5 h-5 text-loss shrink-0 mt-0.5" />
                      <p className="text-sm text-loss leading-snug">
                        {error ?? 'Transaction failed'}
                      </p>
                    </div>
                    <button
                      onClick={handleConfirm}
                      className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-sm active:scale-95 transition-transform tap-target"
                    >
                      Try again
                    </button>
                  </motion.div>
                )}

                {/* ── PENDING ─────────────────────────────────────────────── */}
                {isPending && !isError && !isSuccess && (
                  <motion.div
                    key="pending"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col gap-5"
                  >
                    <p className="font-semibold text-base">Confirm transaction</p>
                    <Steps status={status} />
                    <p className="text-xs text-muted-foreground text-center">
                      {status === 'approving' || status === 'approval-pending'
                        ? 'Approving cUSD spend in your wallet…'
                        : 'Locking your stake on Celo…'}
                    </p>
                    {displayHash && <TxLink hash={displayHash} />}
                  </motion.div>
                )}

                {/* ── IDLE (confirm screen) ────────────────────────────────── */}
                {status === 'idle' && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col gap-5"
                  >
                    <p className="font-semibold text-base">Confirm stake</p>

                    {/* Breakdown */}
                    <div className="rounded-2xl bg-surface-raised border border-surface-border overflow-hidden">
                      <div className="flex justify-between px-4 py-3 border-b border-surface-border">
                        <span className="text-sm text-muted-foreground">Your stake</span>
                        <span className="text-sm font-medium">{breakdown.stake} cUSD</span>
                      </div>
                      <div className="flex justify-between px-4 py-3 border-b border-surface-border">
                        <span className="text-sm text-muted-foreground">Prize pool</span>
                        <span className="text-sm font-medium">{breakdown.pot} cUSD</span>
                      </div>
                      <div className="flex justify-between px-4 py-3 border-b border-surface-border">
                        <span className="text-sm text-muted-foreground">Protocol fee (8%)</span>
                        <span className="text-sm text-muted-foreground">−{breakdown.fee} cUSD</span>
                      </div>
                      <div className="flex justify-between px-4 py-3 bg-gold/5">
                        <span className="text-sm font-semibold">You'll earn if you win</span>
                        <span className="text-sm font-bold text-gold">{breakdown.reward} cUSD</span>
                      </div>
                    </div>

                    {/* Multiplier badge */}
                    <div className="flex justify-center">
                      <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {breakdown.multiplier.toFixed(2)}× your stake
                      </span>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={handleConfirm}
                      className="w-full py-4 rounded-xl bg-primary text-white font-bold text-base active:scale-95 transition-transform tap-target"
                    >
                      Approve &amp; Stake {breakdown.stake} cUSD
                    </button>

                    <p className="text-xs text-center text-muted-foreground">
                      Two wallet confirmations required (approve + lock)
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
