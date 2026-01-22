// Common types used across the ENS Pulse application

export type Address = `0x${string}`;

export interface Proposal {
  id: string;
  proposalId: bigint;
  proposer: Address;
  status: ProposalStatus;
  description: string;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  startBlock: bigint;
  endBlock: bigint;
  createdAt: bigint;
  executedAt?: bigint;
  canceledAt?: bigint;
}

export type ProposalStatus =
  | "pending"
  | "active"
  | "canceled"
  | "defeated"
  | "succeeded"
  | "queued"
  | "expired"
  | "executed";

export interface Delegate {
  address: Address;
  ensName: string | null;
  votingPower: bigint;
  delegatorsCount: number;
  votesCount: number;
  proposalsCreated: number;
}

export interface Vote {
  proposalId: bigint;
  voter: Address;
  support: VoteSupport;
  weight: bigint;
  reason?: string;
}

export type VoteSupport = 0 | 1 | 2; // Against, For, Abstain

export interface MultisigBalance {
  address: Address;
  name: string;
  workingGroup: WorkingGroup;
  ethBalance: bigint;
  ensBalance: bigint;
  usdcBalance: bigint;
  pendingTransactions: number;
}

export type WorkingGroup = "DAO" | "Ecosystem" | "Metagov" | "Public Goods";

export interface TreasurySnapshot {
  timestamp: bigint;
  totalValueUsd: bigint;
  ethBalance: bigint;
  ensBalance: bigint;
  usdcBalance: bigint;
  ethPrice: bigint;
  eventLabel?: string;
}

export interface ProposalContext {
  proposalId: bigint;
  createdBlock: bigint;
  createdTimestamp: bigint;
  createdEthPrice: bigint;
  createdEnsPrice: bigint;
  createdGasPrice: bigint;
  createdTreasuryUsd: bigint;
}

export interface NewsletterItem {
  id: string;
  title: string;
  date: bigint;
  content: string;
  url: string;
  source: string;
  proposalsMentioned?: string[];
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  workingGroup?: WorkingGroup;
}

export interface MarketData {
  eth: TokenPrice | null;
  ens: TokenPrice | null;
  btc: TokenPrice | null;
}

export interface TokenPrice {
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
}

export interface GasPrice {
  low: number;
  average: number;
  high: number;
  baseFee: number;
}

export interface InfrastructureStatus {
  overall: StatusLevel;
  components: StatusComponent[];
}

export type StatusLevel = "operational" | "degraded" | "outage" | "unknown";

export interface StatusComponent {
  name: string;
  status: StatusLevel;
  description?: string;
}
