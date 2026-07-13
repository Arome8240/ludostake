'use client';

import { useCallback } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { LUDO_STATS_ABI, LUDO_STATS_ADDRESS, stakeToWei } from '@/lib/contract';

/**
 * Returns a fire-and-forget function that writes one ResultRecorded event
 * to the LudoStats contract. Returns the tx hash on success, null otherwise.
 * Never throws — callers should treat null as "recording failed, use localStorage".
 */
export function useRecordResult() {
  const { address, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();

  return useCallback(
    async (
      won: boolean,
      mode: 'computer' | 'pvp',
      durationSecs: number,
      stakeAmountUSDm: string
    ): Promise<`0x${string}` | null> => {
      if (!address || !chainId) return null;
      const contractAddress = LUDO_STATS_ADDRESS[chainId];
      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000')
        return null;

      try {
        const txHash = await writeContractAsync({
          address: contractAddress,
          abi: LUDO_STATS_ABI,
          functionName: 'recordResult',
          args: [
            won,
            mode === 'computer' ? 0 : 1,
            durationSecs,
            stakeToWei(stakeAmountUSDm || '0'),
          ],
        });
        return txHash;
      } catch {
        // Wallet rejected, no gas, or contract not deployed on this chain — fail silently
        return null;
      }
    },
    [address, chainId, writeContractAsync]
  );
}
