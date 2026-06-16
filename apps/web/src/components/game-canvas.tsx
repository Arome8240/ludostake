'use client';

import { useEffect, useRef } from 'react';
import type { GameBridge, GameUIState, GameConfig } from '@/game/LudoScene';

interface GameCanvasProps {
  config: GameConfig;
  /** Increment this number to trigger a dice roll. */
  rollTrigger: number;
  onStateChange: (s: GameUIState) => void;
}

export function GameCanvas({ config, rollTrigger, onStateChange }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Bridge is stable across renders; we mutate its callbacks instead of recreating.
  const bridgeRef = useRef<GameBridge>({ rollDice: () => {}, onStateChange: () => {} });

  // Keep onStateChange fresh without reinitialising the game.
  useEffect(() => {
    bridgeRef.current.onStateChange = onStateChange;
  }, [onStateChange]);

  // Forward external roll triggers into the Phaser scene.
  const prevTrigger = useRef(0);
  useEffect(() => {
    if (rollTrigger > prevTrigger.current) {
      prevTrigger.current = rollTrigger;
      bridgeRef.current.rollDice();
    }
  }, [rollTrigger]);

  // Initialise Phaser once on mount.
  useEffect(() => {
    if (!containerRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let game: any = null;

    const init = async () => {
      const Phaser = (await import('phaser')).default;
      const { LudoScene } = await import('@/game/LudoScene');

      const scene = new LudoScene(bridgeRef.current, config);

      game = new Phaser.Game({
        type: Phaser.CANVAS,
        width: 360,
        height: 360,
        backgroundColor: 0x0a0a0a,
        parent: containerRef.current!,
        scene,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        input: { mouse: { preventDefaultDown: false } },
      });

      // Wire bridge.rollDice after scene is ready.
      game.events.once('ready', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = game!.scene.getScene('LudoScene') as any;
        bridgeRef.current.rollDice = () => s.rollDice();
      });
    };

    init();

    return () => {
      game?.destroy(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only once — config is captured at init time

  return (
    <div
      ref={containerRef}
      className="w-[360px] h-[360px] mx-auto overflow-hidden rounded-xl"
      style={{ touchAction: 'none' }}
    />
  );
}
