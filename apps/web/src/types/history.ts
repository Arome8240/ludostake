import type { GameMode, Difficulty } from './game';

export interface GameHistoryEntry {
  gameId: string;
  mode: GameMode;
  difficulty?: Difficulty;
  stakeAmount: string; // cUSD
  rewardAmount: string; // cUSD earned (0 if lost)
  result: 'win' | 'loss' | 'draw';
  opponentAddress?: string;
  opponentType: 'ai' | 'human';
  durationSeconds: number;
  playedAt: number; // unix timestamp
  moves: MoveRecord[];
  txHash?: `0x${string}`;
}

export interface MoveRecord {
  turn: number;
  playerId: string;
  diceValue: number;
  pieceId: number;
  fromPosition: number;
  toPosition: number;
  captured: boolean;
}

export interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  totalStaked: string;
  totalEarned: string;
  biggestWin: string;
  currentStreak: number;
}
