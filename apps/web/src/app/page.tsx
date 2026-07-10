'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Coins, Trophy, TrendingUp, Zap, ChevronRight, Cpu, Users } from 'lucide-react';
import { useMiniPay } from '@/hooks/useMiniPay';
import { PageTransition } from '@/components/page-transition';

interface Mode {
  href: string;
  label: string;
  desc: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  bg: string;
  border: string;
  badge?: string;
}

const MODES: Mode[] = [
  {
    href: '/play/computer',
    label: 'vs Computer',
    desc: 'Practice against AI — Rookie to Legend',
    icon: Cpu,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
  {
    href: '/play/pvp',
    label: 'vs Players',
    desc: 'Stake cUSD against real opponents',
    icon: Users,
    color: 'text-gold',
    bg: 'bg-gold/10',
    border: 'border-gold/20',
    badge: 'LIVE',
  },
];

export default function HomePage() {
  const { truncatedAddress, celoBalance, isBalanceLoading } = useMiniPay();

  const balance = celoBalance?.formatted ? parseFloat(celoBalance.formatted).toFixed(4) : null;

  return (
    <PageTransition>
      <div className="flex flex-col gap-5 px-4 py-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Connected as</p>
            <p className="text-sm font-mono font-medium">{truncatedAddress ?? '—'}</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-primary">Celo</span>
          </div>
        </div>

        {/* Balance card */}
        <motion.div
          initial={{ scale: 0.97, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-surface-raised border border-surface-border p-5 shadow-card"
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">CELO Balance</p>
          </div>
          {isBalanceLoading || balance === null ? (
            <div className="h-9 w-36 skeleton rounded-lg" />
          ) : (
            <p className="text-3xl font-bold">
              {balance}
              <span className="text-base font-medium text-muted-foreground ml-2">CELO</span>
            </p>
          )}
        </motion.div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Trophy, label: 'Games', value: '0' },
            { icon: TrendingUp, label: 'Win Rate', value: '0%' },
            { icon: Coins, label: 'Earned', value: '0 cUSD' },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 rounded-xl bg-surface-raised border border-surface-border py-3"
            >
              <Icon className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-bold">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Mode cards */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Play Now
          </p>
          <div className="flex flex-col gap-3">
            {MODES.map(({ href, label, desc, icon: Icon, color, bg, border, badge }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-4 p-4 rounded-2xl ${bg} border ${border} active:scale-[0.98] transition-transform`}
              >
                <div
                  className={`w-11 h-11 rounded-xl ${bg} border ${border} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{label}</span>
                    {badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gold/20 text-gold border border-gold/30">
                        {badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
