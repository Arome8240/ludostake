'use client';

import { Suspense, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
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

// Pip positions per face value — [col, row] in a 3×3 grid (0-indexed)
const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [
    [2, 0],
    [0, 2],
  ],
  3: [
    [2, 0],
    [1, 1],
    [0, 2],
  ],
  4: [
    [0, 0],
    [2, 0],
    [0, 2],
    [2, 2],
  ],
  5: [
    [0, 0],
    [2, 0],
    [1, 1],
    [0, 2],
    [2, 2],
  ],
  6: [
    [0, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [2, 2],
  ],
};

function EmptyDie({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <rect
        x={1}
        y={1}
        width={size - 2}
        height={size - 2}
        rx={size * 0.18}
        fill="transparent"
        stroke="#334155"
        strokeWidth={2}
        strokeDasharray="4 3"
      />
    </svg>
  );
}

function DiceFace({
  value,
  size = 72,
  active = false,
}: {
  value: number;
  size?: number;
  active?: boolean;
}) {
  const pad = size * 0.14;
  const cell = (size - pad * 2) / 3;
  const r = size * 0.085;
  const pips = value > 0 ? PIPS[value] : [];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {/* Active glow ring */}
      {active && (
        <rect
          x={-2}
          y={-2}
          width={size + 4}
          height={size + 4}
          rx={size * 0.22}
          fill="none"
          stroke="#22c55e"
          strokeWidth={3}
          opacity={0.85}
        />
      )}
      {/* Die body */}
      <rect
        x={1}
        y={1}
        width={size - 2}
        height={size - 2}
        rx={size * 0.18}
        fill={active ? '#f0fdf4' : '#fafafa'}
        stroke={active ? '#86efac' : '#e2e8f0'}
        strokeWidth={2}
      />
      {/* Pips */}
      {pips.map(([col, row], i) => (
        <circle
          key={i}
          cx={pad + col * cell + cell / 2}
          cy={pad + row * cell + cell / 2}
          r={r}
          fill="#111827"
        />
      ))}
    </svg>
  );
}

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
    diceValues: [0, 0],
    movesLeft: 0,
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

      {/* Dice panel — naija ludo style: two dice prominent, active die highlighted */}
      <div className="px-4 pb-4">
        {(() => {
          const d0 = uiState.diceValues[0];
          const d1 = uiState.diceValues[1];
          const activeDie = uiState.activeDie;
          const movesLeft = uiState.movesLeft ?? 0;

          // Determine which die position is active
          let leftActive = false;
          let rightActive = false;
          if (activeDie != null && d0 > 0) {
            if (d0 === d1) {
              // Doubles: left is active on first move, right on second
              leftActive = movesLeft === 2;
              rightActive = movesLeft === 1;
            } else {
              // Whichever die matches the activeDie value is highlighted
              // remainingMoves is sorted descending, so activeDie is the larger value
              const larger = Math.max(d0, d1);
              leftActive = d0 === larger ? activeDie === larger : activeDie !== larger;
              rightActive = !leftActive;
            }
          }

          const moveLabel =
            uiState.phase === 'selecting' && activeDie != null && isHumanTurn
              ? movesLeft === 2
                ? `Move 1 · play your ${activeDie}`
                : `Move 2 · play your ${activeDie}`
              : null;

          const statusText = uiState.forfeited
            ? 'Turn forfeited!'
            : uiState.phase === 'gameover'
              ? uiState.winner === 'red'
                ? '🎉 You win!'
                : 'You lost'
              : uiState.phase === 'rolling' && isHumanTurn
                ? 'Tap to roll'
                : moveLabel
                  ? moveLabel
                  : uiState.phase === 'selecting' && isHumanTurn
                    ? 'Pick a piece'
                    : uiState.phase === 'moving'
                      ? 'Moving…'
                      : `${COLOR_LABEL[uiState.currentPlayer]} thinking…`;

          return (
            <motion.button
              onClick={handleRoll}
              disabled={!canRoll}
              whileTap={canRoll ? { scale: 0.93 } : {}}
              className={`w-full rounded-2xl border transition-all ${
                canRoll
                  ? 'bg-surface-raised border-primary/40 shadow-glow active:scale-95 cursor-pointer'
                  : 'bg-surface-raised border-surface-border cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Die 1 */}
                <motion.div
                  animate={rolling ? { rotate: [0, -30, 30, -20, 20, 0] } : {}}
                  transition={{ duration: 0.45 }}
                >
                  {d0 > 0 ? (
                    <DiceFace value={d0} size={64} active={leftActive} />
                  ) : (
                    <EmptyDie size={64} />
                  )}
                </motion.div>

                {/* Die 2 */}
                <motion.div
                  animate={rolling ? { rotate: [0, 25, -25, 18, -18, 0] } : {}}
                  transition={{ duration: 0.45, delay: 0.05 }}
                >
                  {d1 > 0 ? (
                    <DiceFace value={d1} size={64} active={rightActive} />
                  ) : (
                    <EmptyDie size={64} />
                  )}
                </motion.div>

                {/* Divider */}
                <div className="w-px h-12 bg-surface-border mx-1" />

                {/* Active die value + status */}
                <div className="flex-1 flex flex-col items-center gap-0.5">
                  <AnimatePresence mode="wait">
                    {d0 > 0 ? (
                      <motion.span
                        key={`${d0}-${d1}-${movesLeft}`}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.4 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                        className="text-5xl font-black leading-none text-foreground"
                      >
                        {activeDie ?? d0 + d1}
                      </motion.span>
                    ) : (
                      <motion.span
                        key="empty"
                        className="text-5xl font-black leading-none text-surface-border"
                      >
                        —
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Doubles badge */}
                  {d0 > 0 && d0 === d1 && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] font-bold text-primary uppercase tracking-wide"
                    >
                      Doubles!
                    </motion.span>
                  )}

                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`${uiState.phase}-${uiState.currentPlayer}-${movesLeft}`}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -3 }}
                      transition={{ duration: 0.15 }}
                      className="text-[11px] font-semibold text-muted-foreground text-center leading-tight uppercase tracking-wide"
                    >
                      {statusText}
                    </motion.span>
                  </AnimatePresence>
                </div>

                {/* Pulse dot */}
                <div className="flex flex-col items-center gap-1 w-6">
                  {canRoll && (
                    <motion.div
                      animate={{ opacity: [1, 0.2, 1] }}
                      transition={{ duration: 0.9, repeat: Infinity }}
                      className="w-2.5 h-2.5 rounded-full bg-primary"
                    />
                  )}
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide ${canRoll ? 'text-primary' : 'text-muted-foreground/40'}`}
                  >
                    {canRoll ? 'Roll' : isHumanTurn ? '' : 'Wait'}
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })()}
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
