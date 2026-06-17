'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Gamepad2, Trophy, X, ExternalLink, Trash2 } from 'lucide-react';
import { PageTransition } from '@/components/page-transition';
import Link from 'next/link';
import { getGameHistory, clearGameHistory, getGameStats } from '@/lib/game-history';
import type { GameHistoryEntry } from '@/types/history';

type Tab = 'all' | 'computer' | 'pvp';

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'computer', label: 'vs Computer' },
  { id: 'pvp', label: 'vs Players' },
];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - ts;
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function HistoryCard({ entry }: { entry: GameHistoryEntry }) {
  const isWin = entry.result === 'win';
  const modeLabel =
    entry.mode === 'vs-computer'
      ? `vs Computer${entry.difficulty ? ` · ${entry.difficulty}` : ''}`
      : 'vs Player';
  const hasStake = parseFloat(entry.stakeAmount) > 0;
  const reward = parseFloat(entry.rewardAmount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised border border-surface-border"
    >
      {/* Result icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isWin ? 'bg-gold/15' : 'bg-loss/10'
        }`}
      >
        {isWin ? <Trophy className="w-5 h-5 text-gold" /> : <X className="w-5 h-5 text-loss" />}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-bold ${isWin ? 'text-gold' : 'text-loss'}`}>
            {isWin ? 'Won' : 'Lost'}
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground truncate">{modeLabel}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-muted-foreground/70">{formatDate(entry.playedAt)}</span>
          {entry.durationSeconds > 0 && (
            <>
              <span className="text-[11px] text-muted-foreground/40">·</span>
              <span className="text-[11px] text-muted-foreground/70">
                {formatDuration(entry.durationSeconds)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Stake / reward */}
      <div className="text-right flex-shrink-0">
        {hasStake ? (
          <>
            <p className={`text-sm font-bold ${isWin ? 'text-gold' : 'text-loss'}`}>
              {isWin ? `+${reward.toFixed(2)}` : `-${parseFloat(entry.stakeAmount).toFixed(2)}`}
            </p>
            <p className="text-[10px] text-muted-foreground">cUSD</p>
          </>
        ) : (
          <span className="text-[11px] text-muted-foreground/50 italic">No stake</span>
        )}
        {entry.txHash && (
          <a
            href={`https://celoscan.io/tx/${entry.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-0.5 text-[10px] text-primary mt-0.5 justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            On-chain <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

export default function HistoryPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setHistory(getGameHistory());
    setLoaded(true);
  }, []);

  const filtered = history.filter((g) => {
    if (tab === 'computer') return g.mode === 'vs-computer';
    if (tab === 'pvp') return g.mode === 'vs-players';
    return true;
  });

  const stats = getGameStats(history);

  const handleClear = () => {
    if (confirm('Clear all game history?')) {
      clearGameHistory();
      setHistory([]);
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-4 px-4 py-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-lg font-bold">Game History</h1>
          </div>
          {history.length > 0 && (
            <button
              onClick={handleClear}
              className="p-2 rounded-lg text-muted-foreground/60 hover:text-loss transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Stats strip — only shown when there's data */}
        {loaded && history.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Games', value: stats.totalGames },
              { label: 'Win rate', value: `${stats.winRate}%` },
              { label: 'Streak', value: stats.currentStreak },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center py-2 px-3 rounded-xl bg-surface-raised border border-surface-border"
              >
                <span className="text-lg font-black">{value}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}

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

        {/* List or empty state */}
        {!loaded ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
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
                {tab === 'all'
                  ? 'Play your first game to see history here'
                  : `No ${tab === 'computer' ? 'vs Computer' : 'PvP'} games recorded`}
              </p>
            </div>
            <Link
              href="/play"
              className="px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold active:scale-95 transition-transform"
            >
              Play Now
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((entry) => (
              <HistoryCard key={entry.gameId} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
