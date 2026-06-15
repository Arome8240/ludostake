export type StakeAmount = '0.10' | '0.50' | '1.00' | '2.00' | '5.00';

export type TransactionStatus = 'idle' | 'pending' | 'confirmed' | 'failed';

export interface Transaction {
  hash?: `0x${string}`;
  status: TransactionStatus;
  error?: string;
}

export interface StakingState {
  gameId?: string;
  stakeAmount: StakeAmount;
  transaction: Transaction;
  netReward: string; // after 8% protocol fee
}
