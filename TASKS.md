# Ludo Stakes — Build Tasks

## Phase 1: Project Setup
- [x] Initialize Next.js 14 project with TypeScript and Tailwind CSS
- [x] Configure ESLint, Prettier, and git hooks
- [x] Set up folder structure (components, hooks, lib, types, contracts, styles)
- [x] Install and configure wagmi, viem for Celo/MiniPay wallet connection
- [x] Install Phaser.js for game rendering
- [x] Install Colyseus client for realtime multiplayer
- [x] Set up environment variables structure (.env.example)
- [x] Configure Tailwind with custom design tokens (colors, fonts, spacing)
- [x] Create base layout component with mobile-safe areas
- [x] Set up global CSS with dark theme defaults

## Phase 2: MiniPay Integration
- [x] Detect MiniPay wallet provider (window.ethereum with isMiniPay flag)
- [x] Build wallet connection hook (useMiniPay)
- [x] Display connected wallet address (truncated)
- [x] Fetch and display cUSD balance from Celo
- [x] Handle wallet disconnection and error states
- [x] Build WalletGuard component (blocks app if no wallet connected)
- [ ] Test connection on MiniPay testnet

## Phase 3: UI Shell & Navigation
- [ ] Build bottom navigation bar (Home, Play, History, Profile)
- [ ] Build Home screen with game mode cards
- [ ] Build mode selection screen (vs Computer / vs Players)
- [ ] Build difficulty selection screen with stake slider (vs Computer)
- [ ] Build stake amount screen with preset buttons ($0.10, $0.50, $1, $2, $5)
- [ ] Build lobby/waiting screen for PvP matchmaking
- [ ] Build game result screen (win/lose) with reward display
- [ ] Build profile screen with stats (games played, win rate, total earned)
- [ ] Add page transitions with Framer Motion
- [ ] Ensure all screens are optimized for 390px mobile viewport

## Phase 4: Ludo Game Engine
- [ ] Set up Phaser.js game canvas inside React component
- [ ] Draw Ludo board (15x15 grid, colored zones, safe squares)
- [ ] Render 4 player home bases with correct colors
- [ ] Render player pieces (4 per player) with correct starting positions
- [ ] Implement dice roll mechanic (animated 3D dice)
- [ ] Implement piece selection logic (highlight valid moves)
- [ ] Implement piece movement along correct Ludo path
- [ ] Implement capturing logic (send opponent piece home)
- [ ] Implement safe square logic (no capturing on safe tiles)
- [ ] Implement home column entry logic (piece-specific paths)
- [ ] Implement win condition detection (all 4 pieces home)
- [ ] Implement turn management (skip if no valid moves)
- [ ] Add piece animation (smooth movement between tiles)
- [ ] Add dice roll animation (shake + reveal)
- [ ] Add capture animation (piece flies back to base)

## Phase 5: AI Computer Opponent
- [ ] Build base AI class with move evaluation interface
- [ ] Implement Rookie AI (random valid move selection)
- [ ] Implement Hustler AI (prefer advancing, basic blocking)
- [ ] Implement Shark AI (aggressive cutting, safe zone priority)
- [ ] Implement Legend AI (minimax board evaluation)
- [ ] Build AI turn manager (delay + thinking animation)
- [ ] Add "AI is thinking..." indicator with pulse animation
- [ ] Seed AI decisions with verifiable random values
- [ ] Test all 4 difficulty levels for correct behavior
- [ ] Add AI personality messages per difficulty (taunts, reactions)

## Phase 6: Game Modes
- [ ] Build vs Computer game initializer (2 player: human + AI)
- [ ] Wire difficulty selection to correct AI class
- [ ] Build vs Players quick match screen (stake-matched rooms)
- [ ] Build private room creation (generate shareable room code)
- [ ] Build private room join flow (enter room code)
- [ ] Build 2-player PvP game initializer
- [ ] Build 4-player PvP game initializer
- [ ] Add practice mode (vs Computer, free, no stakes)

## Phase 7: Staking & Smart Contract
- [x] Write Solidity staking contract (LudoStakes.sol) on Celo
- [x] Implement createGame() — locks stake from both players
- [x] Implement joinGame() — second player stakes to join
- [x] Implement declareWinner() — called by game server, releases pot
- [x] Implement cancelGame() — refund if opponent never joins
- [x] Implement protocol fee (8% to treasury address)
- [ ] Deploy contract to Celo Alfajores testnet
- [x] Write contract ABI and type-safe wrapper in /lib/contract.ts
- [x] Build useStaking hook (createGame, joinGame, claimReward)
- [x] Build stake confirmation modal (show amount, fee, net reward)
- [x] Add transaction pending state (spinner + hash link)
- [x] Add transaction success state (confetti + reward amount)
- [x] Add transaction failed state (error message + retry)
- [ ] Test full stake → play → reward flow on testnet

## Phase 8: Game History
- [ ] Design game history data schema (gameId, mode, difficulty, stake, result, duration, date, opponent, moves)
- [ ] Build useGameHistory hook (store results in localStorage + onchain index)
- [ ] Save game result onchain after every completed staked game
- [ ] Build History screen with tab filter (All / vs Computer / vs Players / Tournaments)
- [ ] Build game history card component (result badge, stake, reward, date, duration)
- [ ] Build game detail screen (full move-by-move replay viewer)
- [ ] Add search and date filter to history screen
- [ ] Add stats summary bar at top of history (total games, win rate, total earned)
- [ ] Add empty state for new users with CTA to play first game
- [ ] Paginate history (20 per page, load more on scroll)

## Phase 9: Leaderboard & Social
- [ ] Build global leaderboard screen (top 50 by earnings)
- [ ] Build weekly leaderboard (resets every Monday)
- [ ] Show current user rank even if outside top 50
- [ ] Add friend leaderboard (filter to wallet addresses you've played)
- [ ] Build share result card (shareable image with game result + stats)
- [ ] Add "Challenge friend" deep link from profile

## Phase 10: Polish & Launch
- [ ] Add haptic feedback on dice roll, capture, win
- [ ] Add sound effects (dice, move, capture, win, lose)
- [ ] Add mute toggle in game header
- [ ] Optimize Phaser canvas for 60fps on low-end Android
- [ ] Add loading skeleton screens for all data-fetching states
- [ ] Add offline detection banner
- [ ] Write README with setup, env vars, and deployment guide
- [ ] Deploy to Vercel with Celo mainnet contract
- [ ] Submit to MiniPay app store
