'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { parseAbiItem, formatUnits } from 'viem';
import {
  LUDO_STATS_ABI,
  LUDO_STATS_ADDRESS,
  LUDO_STATS_DEPLOY_BLOCK,
  LUDO_STAKES_ABI,
  LUDO_STAKES_ADDRESS,
} from '@/lib/contract';
import { getGameHistory, saveGameResult, getGameStats } from '@/lib/game-history';
import type { GameHistoryEntry } from '@/types/history';

const RESULT_EVENT = parseAbiItem(
  'event ResultRecorded(address indexed player, bool indexed won, uint8 mode, uint32 durationSecs, uint256 stakeAmount, uint256 timestamp)'
);

const COMPLETED_EVENT = parseAbiItem(
  'event GameCompleted(bytes32 indexed gameId, address indexed winner, uint256 reward)'
);

export interface GameHistoryHook {
  history: GameHistoryEntry[];
  stats: ReturnType<typeof getGameStats>;
  loading: boolean;
  isOnChain: boolean; // true when data came from the blockchain
  refresh: () => void;
}

export function useGameHistory(): GameHistoryHook {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnChain, setIsOnChain] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    // No wallet — use localStorage only
    if (!address || !chainId || !publicClient) {
      setHistory(getGameHistory());
      setIsOnChain(false);
      setLoading(false);
      return;
    }

    const statsAddr = LUDO_STATS_ADDRESS[chainId];
    const stakesAddr = LUDO_STAKES_ADDRESS[chainId];
    const fromBlock = LUDO_STATS_DEPLOY_BLOCK[chainId] ?? 0n;

    try {
      const [resultLogs, completedLogs] = await Promise.all([
        // All ResultRecorded events for this player (free + staked games)
        statsAddr && statsAddr !== '0x0000000000000000000000000000000000000000'
          ? publicClient.getLogs({
              address: statsAddr,
              event: RESULT_EVENT,
              args: { player: address },
              fromBlock,
              toBlock: 'latest',
            })
          : Promise.resolve([]),

        // GameCompleted events where the winner is this player (staked PvP)
        stakesAddr && stakesAddr !== '0x0000000000000000000000000000000000000000'
          ? publicClient.getLogs({
              address: stakesAddr,
              event: COMPLETED_EVENT,
              args: { winner: address },
              fromBlock: fromBlock > 0n ? fromBlock - 1_000_000n : 0n,
              toBlock: 'latest',
            })
          : Promise.resolve([]),
      ]);

      // Map ResultRecorded logs → GameHistoryEntry
      const fromStats: GameHistoryEntry[] = resultLogs.map((log) => ({
        gameId: log.transactionHash ?? `chain-${log.blockNumber}-${log.logIndex}`,
        mode: (log.args.mode ?? 0) === 0 ? 'vs-computer' : 'vs-players',
        result: log.args.won ? 'win' : 'loss',
        durationSeconds: Number(log.args.durationSecs ?? 0),
        stakeAmount: formatUnits(log.args.stakeAmount ?? 0n, 18),
        rewardAmount: '0',
        opponentType: (log.args.mode ?? 0) === 0 ? 'ai' : 'human',
        playedAt: Number(log.args.timestamp ?? 0n) * 1000,
        moves: [],
        txHash: log.transactionHash ?? undefined,
      }));

      // Map GameCompleted logs → GameHistoryEntry (staked PvP wins)
      const onChainIds = new Set(fromStats.map((e) => e.txHash).filter(Boolean));
      const fromStakes: GameHistoryEntry[] = completedLogs
        .filter((log) => !onChainIds.has(log.transactionHash ?? ''))
        .map((log) => ({
          gameId: log.transactionHash ?? `stake-${log.blockNumber}`,
          mode: 'vs-players',
          result: 'win', // GameCompleted only fires for the winner
          durationSeconds: 0,
          stakeAmount: formatUnits((log.args.reward ?? 0n) / 2n, 18),
          rewardAmount: formatUnits(log.args.reward ?? 0n, 18),
          opponentType: 'human',
          playedAt: 0, // block timestamp not directly available from this event
          moves: [],
          txHash: log.transactionHash ?? undefined,
        }));

      // Merge on-chain entries and sort newest first
      const allOnChain = [...fromStats, ...fromStakes].sort((a, b) => b.playedAt - a.playedAt);

      // Merge localStorage entries that have no on-chain equivalent
      // (recorded while wallet was disconnected)
      const localHistory = getGameHistory();
      const onChainTxSet = new Set(allOnChain.map((e) => e.txHash).filter(Boolean));
      const localOnly = localHistory.filter((e) => !e.txHash || !onChainTxSet.has(e.txHash));

      const merged = [...allOnChain, ...localOnly].sort((a, b) => b.playedAt - a.playedAt);

      setHistory(merged);
      setIsOnChain(true);
    } catch (err) {
      // RPC failure — fall back to localStorage
      console.warn('useGameHistory: chain query failed, using localStorage', err);
      setHistory(getGameHistory());
      setIsOnChain(false);
    } finally {
      setLoading(false);
    }
  }, [address, chainId, publicClient]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    history,
    stats: getGameStats(history),
    loading,
    isOnChain,
    refresh: load,
  };
}
