'use client';

import { motion } from 'framer-motion';
import { User, Copy, Check, Trophy, TrendingUp, Coins, Zap, LogOut } from 'lucide-react';
import { useState } from 'react';
import { PageTransition } from '@/components/page-transition';
import { useMiniPay } from '@/hooks/useMiniPay';

export default function ProfilePage() {
  const { address, truncatedAddress, cUSDBalance, celoBalance, chainId, disconnect } = useMiniPay();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const network =
    chainId === 42220 ? 'Celo Mainnet' : chainId === 44787 ? 'Alfajores Testnet' : 'Unknown';
  const cusdFormatted = cUSDBalance?.formatted ? parseFloat(cUSDBalance.formatted).toFixed(4) : '—';
  const celoFormatted = celoBalance?.formatted ? parseFloat(celoBalance.formatted).toFixed(4) : '—';

  const STATS = [
    { icon: Trophy, label: 'Total Games', value: '0' },
    { icon: TrendingUp, label: 'Win Rate', value: '—' },
    { icon: Coins, label: 'Total Earned', value: '0 cUSD' },
  ];

  return (
    <PageTransition>
      <div className="flex flex-col gap-5 px-4 py-5">
        {/* Avatar + address */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-3 py-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-raised border border-surface-border active:scale-95 transition-transform"
          >
            <span className="text-xs font-mono text-foreground">{truncatedAddress ?? '—'}</span>
            {copied ? (
              <Check className="w-3 h-3 text-primary" />
            ) : (
              <Copy className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-xs text-primary font-medium">{network}</span>
          </div>
        </motion.div>

        {/* Balances */}
        <div className="rounded-2xl bg-surface-raised border border-surface-border overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-surface-border">
            <span className="text-sm text-muted-foreground">cUSD</span>
            <span className="text-sm font-bold">{cusdFormatted}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm text-muted-foreground">CELO</span>
            <span className="text-sm font-bold">{celoFormatted}</span>
          </div>
        </div>

        {/* Stats */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Lifetime Stats
          </p>
          <div className="grid grid-cols-3 gap-2">
            {STATS.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-surface-raised border border-surface-border py-4"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-bold">{value}</p>
                <p className="text-[10px] text-muted-foreground text-center leading-tight">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Disconnect */}
        <button
          onClick={disconnect}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border border-loss/30 text-loss text-sm font-medium active:scale-95 transition-transform mt-auto"
        >
          <LogOut className="w-4 h-4" />
          Disconnect Wallet
        </button>
      </div>
    </PageTransition>
  );
}
