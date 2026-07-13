'use client';

import { useCallback, useState } from 'react';
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import {
  USDM_ABI,
  USDM_ADDRESS,
  LUDO_STAKES_ABI,
  LUDO_STAKES_ADDRESS,
  calcNetReward,
  generateGameId,
  stakeBreakdown,
  stakeToWei,
  weiToStake,
} from '@/lib/contract';

// ── Types ──────────────────────────────────────────────────────────────────────

export type StakingStatus =
  | 'idle'
  | 'checking-allowance'
  | 'approving'
  | 'approval-pending'
  | 'creating'
  | 'create-pending'
  | 'joining'
  | 'join-pending'
  | 'success'
  | 'error';

export interface StakingState {
  status: StakingStatus;
  gameId: `0x${string}` | null;
  stakeAmountWei: bigint | null;
  approveTxHash: `0x${string}` | undefined;
  gameTxHash: `0x${string}` | undefined;
  error: string | null;
  netRewardWei: bigint | null;
  netRewardFormatted: string | null;
}

const INITIAL_STATE: StakingState = {
  status: 'idle',
  gameId: null,
  stakeAmountWei: null,
  approveTxHash: undefined,
  gameTxHash: undefined,
  error: null,
  netRewardWei: null,
  netRewardFormatted: null,
};

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useStaking() {
  const { address, chainId } = useAccount();
  const [state, setState] = useState<StakingState>(INITIAL_STATE);

  const contractAddress = chainId ? LUDO_STAKES_ADDRESS[chainId] : undefined;
  const usdmAddress = chainId ? USDM_ADDRESS[chainId] : undefined;

  // ── wagmi write hooks ────────────────────────────────────────────────────────

  const { writeContractAsync: approveWrite } = useWriteContract();
  const { writeContractAsync: gameWrite } = useWriteContract();

  // Watch approval transaction
  const { isLoading: isApprovalMining } = useWaitForTransactionReceipt({
    hash: state.approveTxHash,
    query: { enabled: !!state.approveTxHash },
  });

  // Watch game transaction
  const { isLoading: isGameMining } = useWaitForTransactionReceipt({
    hash: state.gameTxHash,
    query: { enabled: !!state.gameTxHash },
  });

  // ── Allowance read ────────────────────────────────────────────────────────────

  const { refetch: refetchAllowance } = useReadContract({
    address: usdmAddress,
    abi: USDM_ABI,
    functionName: 'allowance',
    args: address && contractAddress ? [address, contractAddress] : undefined,
    query: { enabled: false }, // manual trigger only
  });

  // ── createGame ────────────────────────────────────────────────────────────────

  const createGame = useCallback(
    async (cusdAmount: string) => {
      if (!address || !contractAddress || !usdmAddress) {
        setState((s) => ({ ...s, status: 'error', error: 'Wallet not connected' }));
        return;
      }

      const stakeAmountWei = stakeToWei(cusdAmount);
      const netRewardWei = calcNetReward(stakeAmountWei);
      const gameId = generateGameId();

      setState({
        ...INITIAL_STATE,
        status: 'checking-allowance',
        gameId,
        stakeAmountWei,
        netRewardWei,
        netRewardFormatted: weiToStake(netRewardWei),
      });

      try {
        // 1. Check existing allowance
        const { data: allowance } = await refetchAllowance();
        const currentAllowance = (allowance as bigint | undefined) ?? 0n;

        // 2. Approve if needed
        if (currentAllowance < stakeAmountWei) {
          setState((s) => ({ ...s, status: 'approving' }));

          const approveTxHash = await approveWrite({
            address: usdmAddress,
            abi: USDM_ABI,
            functionName: 'approve',
            args: [contractAddress, stakeAmountWei],
          });

          setState((s) => ({ ...s, status: 'approval-pending', approveTxHash }));

          // Wait for approval confirmation by polling the hash
          await waitForReceipt(approveTxHash);
        }

        // 3. Create game
        setState((s) => ({ ...s, status: 'creating' }));

        const gameTxHash = await gameWrite({
          address: contractAddress,
          abi: LUDO_STAKES_ABI,
          functionName: 'createGame',
          args: [gameId as `0x${string}`, stakeAmountWei],
        });

        setState((s) => ({ ...s, status: 'create-pending', gameTxHash }));
        await waitForReceipt(gameTxHash);

        setState((s) => ({ ...s, status: 'success' }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Transaction failed';
        setState((s) => ({ ...s, status: 'error', error: message }));
      }
    },
    [address, contractAddress, usdmAddress, approveWrite, gameWrite, refetchAllowance]
  );

  // ── joinGame ──────────────────────────────────────────────────────────────────

  const joinGame = useCallback(
    async (gameId: `0x${string}`, cusdAmount: string) => {
      if (!address || !contractAddress || !usdmAddress) {
        setState((s) => ({ ...s, status: 'error', error: 'Wallet not connected' }));
        return;
      }

      const stakeAmountWei = stakeToWei(cusdAmount);
      const netRewardWei = calcNetReward(stakeAmountWei);

      setState({
        ...INITIAL_STATE,
        status: 'checking-allowance',
        gameId,
        stakeAmountWei,
        netRewardWei,
        netRewardFormatted: weiToStake(netRewardWei),
      });

      try {
        const { data: allowance } = await refetchAllowance();
        const currentAllowance = (allowance as bigint | undefined) ?? 0n;

        if (currentAllowance < stakeAmountWei) {
          setState((s) => ({ ...s, status: 'approving' }));
          const approveTxHash = await approveWrite({
            address: usdmAddress,
            abi: USDM_ABI,
            functionName: 'approve',
            args: [contractAddress, stakeAmountWei],
          });
          setState((s) => ({ ...s, status: 'approval-pending', approveTxHash }));
          await waitForReceipt(approveTxHash);
        }

        setState((s) => ({ ...s, status: 'joining' }));
        const gameTxHash = await gameWrite({
          address: contractAddress,
          abi: LUDO_STAKES_ABI,
          functionName: 'joinGame',
          args: [gameId],
        });

        setState((s) => ({ ...s, status: 'join-pending', gameTxHash }));
        await waitForReceipt(gameTxHash);

        setState((s) => ({ ...s, status: 'success' }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Transaction failed';
        setState((s) => ({ ...s, status: 'error', error: message }));
      }
    },
    [address, contractAddress, usdmAddress, approveWrite, gameWrite, refetchAllowance]
  );

  // ── cancelGame ────────────────────────────────────────────────────────────────

  const cancelGame = useCallback(
    async (gameId: `0x${string}`) => {
      if (!contractAddress) return;
      try {
        const gameTxHash = await gameWrite({
          address: contractAddress,
          abi: LUDO_STAKES_ABI,
          functionName: 'cancelGame',
          args: [gameId],
        });
        setState((s) => ({ ...s, gameTxHash }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Cancel failed';
        setState((s) => ({ ...s, status: 'error', error: message }));
      }
    },
    [contractAddress, gameWrite]
  );

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  // Computed booleans for convenience
  const isPending =
    state.status === 'checking-allowance' ||
    state.status === 'approving' ||
    state.status === 'approval-pending' ||
    state.status === 'creating' ||
    state.status === 'create-pending' ||
    state.status === 'joining' ||
    state.status === 'join-pending' ||
    isApprovalMining ||
    isGameMining;

  return {
    ...state,
    isPending,
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    createGame,
    joinGame,
    cancelGame,
    reset,
    stakeBreakdown,
  };
}

// ── Internal helpers ───────────────────────────────────────────────────────────

/** Poll publicClient until the tx hash has a receipt (max 90 s). */
async function waitForReceipt(hash: `0x${string}`): Promise<void> {
  // wagmi's useWaitForTransactionReceipt is reactive; for the imperative flow
  // we use a simple polling loop against the RPC via the global window provider.
  const POLL_MS = 2_000;
  const MAX_ATTEMPTS = 45;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      const result = await (window.ethereum as any)?.request({
        method: 'eth_getTransactionReceipt',
        params: [hash],
      });
      if (result?.status === '0x1') return;
      if (result?.status === '0x0') throw new Error('Transaction reverted');
    } catch {
      // receipt not yet available — continue polling
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  throw new Error('Transaction confirmation timeout');
}
