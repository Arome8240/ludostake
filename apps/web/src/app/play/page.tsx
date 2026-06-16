'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight, Cpu, Users, ArrowLeft } from 'lucide-react';
import { PageTransition } from '@/components/page-transition';

interface PlayMode {
  href: string;
  label: string;
  desc: string;
  sub: string[];
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  ring: string;
  bg: string;
  border: string;
  cta: string;
  ctaColor: string;
  badge?: string;
}

const MODES: PlayMode[] = [
  {
    href: '/play/computer',
    label: 'vs Computer',
    desc: 'No stakes. Practice at your own pace.',
    sub: [
      'Rookie — easy warm-up',
      'Hustler — smart opponent',
      'Shark — aggressive play',
      'Legend — max challenge',
    ],
    icon: Cpu,
    color: 'text-primary',
    ring: 'ring-primary/30',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    cta: 'Free to play',
    ctaColor: 'text-primary',
  },
  {
    href: '/play/pvp',
    label: 'vs Players',
    desc: 'Stake cUSD, beat real opponents, keep the pot.',
    sub: ['$0.10 — $5.00 stake tiers', 'Win up to 1.84× your stake', 'Instant cUSD payout on win'],
    icon: Users,
    color: 'text-gold',
    ring: 'ring-gold/30',
    bg: 'bg-gold/10',
    border: 'border-gold/20',
    cta: 'Requires cUSD',
    ctaColor: 'text-gold',
    badge: 'LIVE',
  },
] as const;

export default function PlayPage() {
  const router = useRouter();

  return (
    <PageTransition>
      <div className="flex flex-col gap-4 px-4 py-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-raised border border-surface-border active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-bold">Choose Mode</h1>
        </div>

        {/* Mode cards */}
        <div className="flex flex-col gap-4">
          {MODES.map(
            (
              { href, label, desc, sub, icon: Icon, color, bg, border, cta, ctaColor, badge },
              i
            ) => (
              <motion.div
                key={href}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Link
                  href={href}
                  className={`block p-4 rounded-2xl ${bg} border ${border} active:scale-[0.98] transition-transform`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center`}
                      >
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{label}</span>
                          {badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gold/20 text-gold border border-gold/30">
                              {badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs font-medium ${ctaColor}`}>{cta}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground mt-1" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{desc}</p>
                  <ul className="flex flex-col gap-1">
                    {sub.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <span className={`w-1 h-1 rounded-full ${color.replace('text-', 'bg-')}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Link>
              </motion.div>
            )
          )}
        </div>
      </div>
    </PageTransition>
  );
}
