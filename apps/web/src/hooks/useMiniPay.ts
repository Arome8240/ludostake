'use client';

import { useEffect, useState } from 'react';
import { useAccount, useBalance, useConnect, useDisconnect } from 'wagmi';

// cUSD contract addresses per network
const CUSD_ADDRESS: Record<number, `0x${string}`> = {
  42220: '0x765DE816845861e75A25fCA122bb6898B8B1282a', // Celo mainnet
  44787: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1', // Celo Alfajores testnet
};

const FALLBACK_CUSD = CUSD_ADDRESS[44787]; // default to testnet during dev

export interface MiniPayState {
  address: `0x${string}` | undefined;
  truncatedAddress: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isMiniPay: boolean;
  cUSDBalance: { value: bigint; formatted: string; symbol: string } | undefined;
  celoBalance: { value: bigint; formatted: string; symbol: string } | undefined;
  isBalanceLoading: boolean;
  chainId: number | undefined;
  connect: () => void;
  disconnect: () => void;
}

export function useMiniPay(): MiniPayState {
  const [isMiniPay, setIsMiniPay] = useState(false);

  const { address, isConnected, isConnecting, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const chainId = chain?.id;
  const cUSDAddress = chainId ? (CUSD_ADDRESS[chainId] ?? FALLBACK_CUSD) : FALLBACK_CUSD;

  const { data: cUSDData, isLoading: isLoadingCUSD } = useBalance({
    address,
    token: cUSDAddress,
    query: { enabled: isConnected && !!address },
  });

  const { data: celoData, isLoading: isLoadingCelo } = useBalance({
    address,
    query: { enabled: isConnected && !!address },
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum?.isMiniPay) {
      setIsMiniPay(true);
    }
  }, []);

  const connectWallet = () => {
    const injected = connectors.find((c) => c.id === 'injected');
    if (injected) connect({ connector: injected });
  };

  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  return {
    address,
    truncatedAddress,
    isConnected,
    isConnecting,
    isMiniPay,
    cUSDBalance: cUSDData
      ? { value: cUSDData.value, formatted: cUSDData.formatted, symbol: cUSDData.symbol }
      : undefined,
    celoBalance: celoData
      ? { value: celoData.value, formatted: celoData.formatted, symbol: celoData.symbol }
      : undefined,
    isBalanceLoading: isLoadingCUSD || isLoadingCelo,
    chainId,
    connect: connectWallet,
    disconnect,
  };
}
