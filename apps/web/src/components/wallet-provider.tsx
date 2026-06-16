'use client';

import { RainbowKitProvider, connectorsForWallets } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { WagmiProvider, createConfig, http, useConnect } from 'wagmi';
import { celo, celoAlfajores } from 'wagmi/chains';

const connectors = connectorsForWallets([{ groupName: 'Recommended', wallets: [injectedWallet] }], {
  appName: 'Ludo Stakes',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? 'ludostakes',
});

export const wagmiConfig = createConfig({
  chains: [celo, celoAlfajores],
  connectors,
  transports: {
    [celo.id]: http(process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org'),
    [celoAlfajores.id]: http(
      process.env.NEXT_PUBLIC_CELO_TESTNET_RPC_URL || 'https://alfajores-forno.celo-testnet.org'
    ),
  },
  ssr: true,
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000 } },
});

// Auto-connects when running inside MiniPay
function MiniPayAutoConnect({ children }: { children: React.ReactNode }) {
  const { connect, connectors } = useConnect();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum?.isMiniPay) {
      const injected = connectors.find((c) => c.id === 'injected');
      if (injected) connect({ connector: injected });
    }
  }, [connect, connectors]);

  return <>{children}</>;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <MiniPayAutoConnect>{children}</MiniPayAutoConnect>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
