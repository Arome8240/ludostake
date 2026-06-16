import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import { WalletProvider } from '@/components/wallet-provider';
import { WalletGuard } from '@/components/wallet-guard';
import { BottomNav } from '@/components/bottom-nav';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Ludo Stakes',
  description: 'Stake cUSD and play Ludo on Celo — powered by MiniPay',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Ludo Stakes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta
          name="talentapp:project_verification"
          content="bde349558f9008b6abe452bd0629bec9a741fb1a633166164d2592ebf380bac230c3998648a195da853b0e24049a25e96439c0e70df2bfc201120e0882e44b68"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <WalletProvider>
          <WalletGuard>
            {/*
             * AppShell: full-height container that accounts for iOS safe areas.
             * pt-safe-top ensures content clears the status bar notch.
             * pb-nav-height leaves room for the bottom navigation bar.
             */}
            <div
              id="app-shell"
              className="
                relative flex flex-col
                min-h-dvh
                w-full max-w-[390px] mx-auto
                bg-surface text-foreground
                pt-safe-top pb-[calc(4rem+env(safe-area-inset-bottom))]
                pl-safe-left pr-safe-right
                overflow-x-hidden
              "
            >
              <main className="flex-1 flex flex-col">{children}</main>
              <BottomNav />
            </div>
          </WalletGuard>
        </WalletProvider>
      </body>
    </html>
  );
}
