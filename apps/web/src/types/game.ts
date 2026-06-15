export type GameMode = 'vs-computer' | 'vs-players' | 'practice';

export type Difficulty = 'rookie' | 'hustler' | 'shark' | 'legend';

export type GameStatus = 'idle' | 'waiting' | 'active' | 'finished';

export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export interface Piece {
  id: number;
  playerId: string;
  color: PlayerColor;
  position: number; // -1 = base, 0-56 = board path, 57 = home
  isHome: boolean;
  isSafe: boolean;
}

export interface Player {
  id: string;
  address?: string;
  color: PlayerColor;
  isAI: boolean;
  difficulty?: Difficulty;
  pieces: Piece[];
  isActive: boolean;
}

export interface GameState {
  id: string;
  mode: GameMode;
  status: GameStatus;
  players: Player[];
  currentPlayerIndex: number;
  diceValue: number | null;
  winner: string | null;
  startedAt: number | null;
  endedAt: number | null;
  stakeAmount: string; // cUSD amount as string
}
