'use client';

import { Suspense, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Dices } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { GameUIState, GameConfig } from '@/game/LudoScene';
import type { PlayerColor } from '@/game/constants';

// Dynamically import the canvas so Phaser never runs on the server.
const GameCanvas = dynamic(
  () => import('@/components/game-canvas').then((m) => ({ default: m.GameCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="w-[360px] h-[360px] mx-auto rounded-xl bg-surface-raised animate-pulse" />
    ),
  }
);

const COLOR_LABEL: Record<PlayerColor, string> = {
  red: 'Red',
  green: 'Green',
  yellow: 'Yellow',
  blue: 'Blue',
};
const COLOR_CLASS: Record<PlayerColor, string> = {
  red: 'bg-piece-red',
  green: 'bg-piece-green',
  yellow: 'bg-piece-yellow',
  blue: 'bg-piece-blue',
};

const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

function GameContent() {
  const router = useRouter();
  const params = useSearchParams();

  const mode = (params.get('mode') ?? 'computer') as GameConfig['mode'];
  const difficulty = params.get('difficulty') ?? 'rookie';
  const stake = params.get('stake') ?? undefined;
  const gameId = params.get('gameId') ?? undefined;

  const config: GameConfig = { mode, difficulty, stake, gameId };

  const [uiState, setUiState] = useState<GameUIState>({
    phase: 'rolling',
    currentPlayer: 'red',
    diceValue: 0,
    selectablePieces: [],
    winner: null,
    scores: { red: 0, green: 0, yellow: 0, blue: 0 },
  });

  const [rollTrigger, setRollTrigger] = useState(0);
  const [rolling, setRolling] = useState(false);
  const rollTimeout = useRef<ReturnType<typeof setTimeout>>();

  const handleStateChange = useCallback(
    (s: GameUIState) => {
      setUiState(s);
      if (s.phase !== 'rolling') {
        setRolling(false);
      }
      if (s.phase === 'gameover' && s.winner) {
        const isWin = s.winner === 'red';
        const result = isWin ? 'win' : 'loss';
        setTimeout(() => {
          router.push(
            `/result?result=${result}&mode=${mode}&difficulty=${difficulty}${stake ? `&stake=${stake}` : ''}`
          );
        }, 1800);
      }
    },
    [router, mode, difficulty, stake]
  );

  const handleRoll = () => {
    if (uiState.phase !== 'rolling' || rolling) return;
    setRolling(true);
    clearTimeout(rollTimeout.current);
    rollTimeout.current = setTimeout(() => setRolling(false), 700);
    setRollTrigger((t) => t + 1);
  };

  const isHumanTurn = uiState.currentPlayer === 'red';
  const canRoll = uiState.phase === 'rolling' && isHumanTurn && !rolling;

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
        <button
          onClick={() => router.push('/')}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-raised border border-surface-border active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold">
          {mode === 'computer' ? `vs Computer · ${difficulty}` : 'vs Player'}
        </span>
        <div className="w-9" />
      </div>

      {/* Player score dots */}
      <div className="flex items-center justify-center gap-6 py-2 px-4">
        {(['red', 'green'] as PlayerColor[]).map((c) => (
          <div
            key={c}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
              uiState.currentPlayer === c
                ? 'bg-surface-overlay border border-surface-border'
                : 'opacity-40'
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${COLOR_CLASS[c]}`} />
            <span className="text-xs font-medium">{COLOR_LABEL[c]}</span>
            <span className="text-xs font-bold text-muted-foreground">{uiState.scores[c]}/4</span>
          </div>
        ))}
      </div>

      {/* Board canvas */}
      <div className="flex-1 flex items-center justify-center py-2">
        <GameCanvas config={config} rollTrigger={rollTrigger} onStateChange={handleStateChange} />
      </div>

      {/* Dice + turn info */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-raised border border-surface-border">
          {/* Dice face */}
          <motion.button
            onClick={handleRoll}
            disabled={!canRoll}
            whileTap={{ scale: 0.9 }}
            animate={rolling ? { rotate: [0, -20, 20, -15, 15, 0] } : {}}
            transition={{ duration: 0.4 }}
            className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl font-bold transition-all shrink-0 ${
              canRoll
                ? 'bg-primary text-white shadow-glow active:scale-95'
                : 'bg-surface-overlay text-muted-foreground cursor-not-allowed'
            }`}
          >
            {uiState.diceValue > 0 ? DICE_FACES[uiState.diceValue] : <Dices className="w-6 h-6" />}
          </motion.button>

          {/* Status text */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${uiState.phase}-${uiState.currentPlayer}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <p className="font-semibold text-sm">
                  {uiState.phase === 'gameover'
                    ? uiState.winner === 'red'
                      ? '🎉 You win!'
                      : 'You lost'
                    : isHumanTurn
                      ? 'Your turn'
                      : `${COLOR_LABEL[uiState.currentPlayer]} is thinking…`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {uiState.phase === 'rolling' && isHumanTurn && 'Tap the dice to roll'}
                  {uiState.phase === 'selecting' &&
                    isHumanTurn &&
                    'Tap a highlighted piece to move'}
                  {uiState.phase === 'moving' && 'Moving…'}
                  {!isHumanTurn && uiState.phase !== 'gameover' && 'AI is making a move'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <GameContent />
    </Suspense>
  );
}
