export enum BetStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  RESOLVED = 'resolved'
}

export interface Bet {
  id: string; // 合约地址作为ID
  title: string;
  options: string[];
  totalAmount: number; // USDC金额
  status: BetStatus;
  creator: string; // 创建者地址
  winnerOptionIndex?: number; // 获胜选项的索引
}

export interface BetParticipation {
  userAddress: string;
  optionIndex: number;
  amount: number;
}

export interface CreateBetRequest {
  title: string;
  options: string[];
  telegramUserId: number;
}

export interface JoinBetRequest {
  betId: string; // 合约地址
  optionIndex: number;
  amount: number;
  telegramUserId: number;
}

export interface ResolveBetRequest {
  betId: string; // 合约地址
  winnerOptionIndex: number;
  telegramUserId: number;
}
