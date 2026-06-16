'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Gamepad2 } from 'lucide-react';
import { PageTransition } from '@/components/page-transition';
import Link from 'next/link';

type Tab = 'all' | 'computer' | 'pvp';

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'computer', label: 'vs Computer' },
  { id: 'pvp', label: 'vs Players' },
];

export default function HistoryPage() {
  const [tab, setTab] = useState<Tab>('all');

  return (
    <PageTransition>
      <div className="flex flex-col gap-4 px-4 py-5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-lg font-bold">Game History</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-surface-raised border border-surface-border">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === id ? 'bg-surface-overlay text-foreground' : 'text-muted-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Empty state */}
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 py-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-surface-raised border border-surface-border flex items-center justify-center">
            <Gamepad2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No games yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Play your first game to see history here
            </p>
          </div>
          <Link
            href="/play"
            className="px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold active:scale-95 transition-transform"
          >
            Play Now
          </Link>
        </motion.div>
      </div>
    </PageTransition>
  );
}
