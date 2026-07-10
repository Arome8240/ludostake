'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Cpu, Zap, ChevronRight } from 'lucide-react';
import { PageTransition } from '@/components/page-transition';

type Difficulty = 'rookie' | 'hustler' | 'shark' | 'legend';

const DIFFICULTIES: {
  id: Difficulty;
  label: string;
  desc: string;
  color: string;
  bg: string;
  border: string;
  stars: number;
}[] = [
  {
    id: 'rookie',
    label: 'Rookie',
    desc: 'Random moves, great for beginners',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    stars: 1,
  },
  {
    id: 'hustler',
    label: 'Hustler',
    desc: 'Advances pieces, blocks when possible',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    stars: 2,
  },
  {
    id: 'shark',
    label: 'Shark',
    desc: 'Aggressive cuts and safe zone priority',
    color: 'text-gold',
    bg: 'bg-gold/10',
    border: 'border-gold/20',
    stars: 3,
  },
  {
    id: 'legend',
    label: 'Legend',
    desc: 'Full minimax evaluation — unforgiving',
    color: 'text-loss',
    bg: 'bg-loss/10',
    border: 'border-loss/20',
    stars: 4,
  },
];

export default function ComputerPlayPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Difficulty>('rookie');

  const handleStart = () => {
    router.push(`/game?mode=computer&difficulty=${selected}`);
  };

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
            <Cpu className="w-4 h-4 text-primary" />
            <h1 className="text-lg font-bold">vs Computer</h1>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Free to play — no cUSD required. Choose your challenge level.
        </p>

        {/* Difficulty cards */}
        <div className="flex flex-col gap-2">
          {DIFFICULTIES.map(({ id, label, desc, color, bg, border, stars }, i) => (
            <motion.button
              key={id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setSelected(id)}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.98] text-left ${
                selected === id
                  ? `${bg} ${border} ring-2 ring-offset-2 ring-offset-surface`
                  : 'bg-surface-raised border-surface-border'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg} ${border} border`}
              >
                <Cpu className={`w-5 h-5 ${color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{label}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 4 }).map((_, s) => (
                      <Zap
                        key={s}
                        className={`w-2.5 h-2.5 ${s < stars ? color : 'text-surface-border'}`}
                        fill={s < stars ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selected === id ? `${border} ${bg}` : 'border-surface-border'
                }`}
              >
                {selected === id && (
                  <div className={`w-2 h-2 rounded-full ${color.replace('text-', 'bg-')}`} />
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Start button */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          onClick={handleStart}
          className="mt-auto flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-primary text-white font-bold text-base active:scale-95 transition-transform"
        >
          Start Game
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </PageTransition>
  );
}
