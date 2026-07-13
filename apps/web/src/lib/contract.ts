import { parseAbi, parseUnits, formatUnits } from 'viem';

// ── ABI ────────────────────────────────────────────────────────────────────────

export const LUDO_STAKES_ABI = parseAbi([
  // Core game functions
  'function createGame(bytes32 gameId, uint256 stakeAmount) external',
  'function joinGame(bytes32 gameId) external',
  'function declareWinner(bytes32 gameId, address winner) external',
  'function cancelGame(bytes32 gameId) external',

  // Views
  'function getGame(bytes32 gameId) external view returns (address player1, address player2, uint256 stakeAmount, uint8 state)',
  'function netReward(uint256 stakeAmount) external pure returns (uint256)',
  'function games(bytes32) external view returns (address player1, address player2, uint256 stakeAmount, uint8 state)',
  'function cUSD() external view returns (address)',
  'function gameServer() external view returns (address)',
  'function treasury() external view returns (address)',
  'function owner() external view returns (address)',
  'function FEE_BPS() external view returns (uint256)',

  // Admin
  'function setGameServer(address _gameServer) external',
  'function setTreasury(address _treasury) external',
  'function transferOwnership(address newOwner) external',

  // Events
  'event GameCreated(bytes32 indexed gameId, address indexed player1, uint256 stakeAmount)',
  'event GameJoined(bytes32 indexed gameId, address indexed player2)',
  'event GameCompleted(bytes32 indexed gameId, address indexed winner, uint256 reward)',
  'event GameCancelled(bytes32 indexed gameId, address indexed refundedTo)',
]);

// USDm ERC-20 ABI (only what we need: approve + allowance)
export const USDM_ABI = parseAbi([
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
]);

// ── Addresses ──────────────────────────────────────────────────────────────────

export const USDM_ADDRESS: Record<number, `0x${string}`> = {
  42220: '0x765DE816845861e75A25fCA122bb6898B8B1282a', // Celo mainnet (USDm / Mento Dollar)
  44787: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1', // Celo Alfajores
};

// Contract addresses — populated after deployment (set via env vars)
export const LUDO_STAKES_ADDRESS: Record<number, `0x${string}`> = {
  42220:
    (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET as `0x${string}`) ||
    '0x0000000000000000000000000000000000000000',
  44787:
    (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET as `0x${string}`) ||
    '0x0000000000000000000000000000000000000000',
};

// ── Constants ──────────────────────────────────────────────────────────────────

export const FEE_BPS = 800n; // 8%
export const BPS_DENOM = 10_000n;

/** USDm uses 18 decimals on Celo */
export const USDM_DECIMALS = 18;

// ── Preset stake amounts (human-readable USDm → bigint wei) ───────────────────

export const STAKE_PRESETS = ['0.10', '0.50', '1.00', '2.00', '5.00'] as const;
export type StakePreset = (typeof STAKE_PRESETS)[number];

export function stakeToWei(usdmAmount: string): bigint {
  return parseUnits(usdmAmount, USDM_DECIMALS);
}

export function weiToStake(wei: bigint): string {
  return formatUnits(wei, USDM_DECIMALS);
}

// ── Fee calculations ───────────────────────────────────────────────────────────

/**
 * Returns the net reward a winner receives given a per-player stake amount.
 * Mirrors the on-chain netReward() pure function.
 */
export function calcNetReward(stakeWei: bigint): bigint {
  const pot = stakeWei * 2n;
  const fee = (pot * FEE_BPS) / BPS_DENOM;
  return pot - fee;
}

/**
 * Returns human-readable breakdown: stake, pot, fee, and net reward.
 */
export function stakeBreakdown(usdmAmount: string) {
  const stakeWei = stakeToWei(usdmAmount);
  const potWei = stakeWei * 2n;
  const feeWei = (potWei * FEE_BPS) / BPS_DENOM;
  const rewardWei = potWei - feeWei;

  return {
    stake: usdmAmount,
    pot: weiToStake(potWei),
    fee: weiToStake(feeWei),
    reward: weiToStake(rewardWei),
    multiplier: Number(rewardWei) / Number(stakeWei), // ≈ 1.84
  };
}

// ── LudoStats ──────────────────────────────────────────────────────────────────

export const LUDO_STATS_ABI = parseAbi([
  'event ResultRecorded(address indexed player, bool indexed won, uint8 mode, uint32 durationSecs, uint256 stakeAmount, uint256 timestamp)',
  'function recordResult(bool won, uint8 mode, uint32 durationSecs, uint256 stakeAmount) external',
]);

export const LUDO_STATS_ADDRESS: Record<number, `0x${string}`> = {
  42220:
    (process.env.NEXT_PUBLIC_LUDO_STATS_ADDRESS_MAINNET as `0x${string}`) ||
    '0x0000000000000000000000000000000000000000',
};

// Block the contract was deployed — used as fromBlock for event queries
export const LUDO_STATS_DEPLOY_BLOCK: Record<number, bigint> = {
  42220: BigInt(process.env.NEXT_PUBLIC_LUDO_STATS_DEPLOY_BLOCK ?? '69782884'),
};

// ── Game ID generation ─────────────────────────────────────────────────────────

/** Generates a random 32-byte game ID suitable for use as a bytes32 key. */
export function generateGameId(): `0x${string}` {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return `0x${Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}`;
}

// ── Game state enum ────────────────────────────────────────────────────────────

export enum OnChainGameState {
  None = 0,
  Created = 1,
  Active = 2,
  Completed = 3,
  Cancelled = 4,
}
