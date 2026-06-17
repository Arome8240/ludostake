import type { GameHistoryEntry } from '@/types/history';

const STORAGE_KEY = 'ludostake_history_v1';
const MAX_ENTRIES = 100;

export function getGameHistory(): GameHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GameHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveGameResult(entry: GameHistoryEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getGameHistory();
    history.unshift(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_ENTRIES)));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function clearGameHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getGameStats(history: GameHistoryEntry[]) {
  const wins = history.filter((g) => g.result === 'win').length;
  const losses = history.filter((g) => g.result === 'loss').length;
  const totalStaked = history.reduce((sum, g) => sum + parseFloat(g.stakeAmount || '0'), 0);
  const totalEarned = history.reduce((sum, g) => sum + parseFloat(g.rewardAmount || '0'), 0);

  // Current win streak
  let streak = 0;
  for (const g of history) {
    if (g.result === 'win') streak++;
    else break;
  }

  return {
    totalGames: history.length,
    wins,
    losses,
    winRate: history.length > 0 ? Math.round((wins / history.length) * 100) : 0,
    totalStaked: totalStaked.toFixed(2),
    totalEarned: totalEarned.toFixed(2),
    currentStreak: streak,
  };
}
