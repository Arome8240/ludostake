'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, ChevronRight, Info, Wallet } from 'lucide-react';
import { PageTransition } from '@/components/page-transition';
import { StakeModal } from '@/components/stake-modal';
import { ConnectButton } from '@/components/connect-button';
import { useMiniPay } from '@/hooks/useMiniPay';
import { STAKE_PRESETS, stakeBreakdown } from '@/lib/contract';
import type { StakePreset } from '@/lib/contract';

export default function PvpPlayPage() {
  const router = useRouter();
  const { isConnected } = useMiniPay();
  const [selectedStake, setSelectedStake] = useState<StakePreset>('1.00');
  const [showModal, setShowModal] = useState(false);

  const breakdown = stakeBreakdown(selectedStake);

  const handleSuccess = (gameId: `0x${string}`) => {
    setShowModal(false);
    router.push(`/play/lobby?gameId=${gameId}&stake=${selectedStake}`);
  };

  if (!isConnected) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center flex-1 px-6 gap-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="w-16 h-16 rounded-2xl bg-gold/15 border border-gold/30 flex items-center justify-center"
          >
            <Wallet className="w-8 h-8 text-gold" strokeWidth={1.5} />
          </motion.div>
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.08 }}
            className="space-y-2"
          >
            <h2 className="text-xl font-bold tracking-tight">Connect to play vs Players</h2>
            <p className="text-sm text-muted-foreground max-w-[260px]">
              You need a wallet to stake cUSD and join a live match.
            </p>
          </motion.div>
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="w-full max-w-xs"
          >
            <ConnectButton />
          </motion.div>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={() => router.back()}
            className="text-sm text-muted-foreground"
          >
            ← Go back
          </motion.button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-5 px-4 py-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-raised border border-surface-border active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gold" />
            <h1 className="text-lg font-bold">vs Players</h1>
          </div>
        </div>

        {/* Stake selection */}
        <div>
          <p className="text-sm font-semibold mb-3">Select stake amount</p>
          <div className="grid grid-cols-5 gap-2">
            {STAKE_PRESETS.map((amount) => (
              <button
                key={amount}
                onClick={() => setSelectedStake(amount)}
                className={`py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  selectedStake === amount
                    ? 'bg-gold text-gold-foreground'
                    : 'bg-surface-raised border border-surface-border text-muted-foreground'
                }`}
              >
                ${amount}
              </button>
            ))}
          </div>
        </div>

        {/* Reward breakdown */}
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
            <span className="text-sm font-semibold">Win and earn</span>
            <span className="text-sm font-bold text-gold">{breakdown.reward} cUSD</span>
          </div>
        </div>

        {/* Info note */}
        <div className="flex gap-2 p-3 rounded-xl bg-surface-overlay border border-surface-border">
          <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Stake is locked on-chain. If no opponent joins within 5 minutes, you can cancel and get
            a full refund.
          </p>
        </div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-gold text-gold-foreground font-bold text-base active:scale-95 transition-transform"
        >
          Find Match — {selectedStake} cUSD
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>

      <StakeModal
        open={showModal}
        stakeAmount={selectedStake}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
      />
    </PageTransition>
  );
}
