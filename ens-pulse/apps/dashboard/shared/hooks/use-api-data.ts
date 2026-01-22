"use client";

import useSWR from "swr";

/* ═══════════════════════════════════════════════════════════════════
   API Data Fetching Hooks
   SWR-based hooks for all dashboard data sources
   ═══════════════════════════════════════════════════════════════════ */

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "API error");
  return json.data;
};

/* ═══════════════════════════════════════════════════════════════════
   Treasury Hooks
   ═══════════════════════════════════════════════════════════════════ */

export interface MultisigData {
  address: string;
  name: string;
  workingGroup: string;
  description: string;
  isMultisig: boolean;
  threshold: number;
  owners: string[];
  ownerCount: number;
  calculatedBalances: {
    ethBalance: string;
    ensBalance: string;
    usdcBalance: string;
  };
  rawBalances: Array<{
    tokenAddress: string | null;
    token: {
      name: string;
      symbol: string;
      decimals: number;
      logoUri: string;
    } | null;
    balance: string;
  }>;
}

export interface TreasuryOverview {
  multisigs: MultisigData[];
  totals: {
    ethBalance: string;
    ensBalance: string;
    usdcBalance: string;
    multisigCount: number;
  };
  ethPrice: number;
  lastUpdated: string;
}

export function useTreasuryOverview() {
  return useSWR<TreasuryOverview>("/api/treasury/overview", fetcher, {
    refreshInterval: 300000, // 5 minutes
    revalidateOnFocus: true,
  });
}

export function useTreasuryAddress(address: string) {
  return useSWR<MultisigData>(
    address ? `/api/treasury/${address}` : null,
    fetcher,
    { refreshInterval: 300000 } // 5 minutes
  );
}

export function usePendingTransactions() {
  return useSWR("/api/treasury/pending", fetcher, {
    refreshInterval: 120000, // 2 minutes
  });
}

/* ═══════════════════════════════════════════════════════════════════
   Market Hooks
   ═══════════════════════════════════════════════════════════════════ */

export interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d?: number;
  market_cap: number;
  total_volume: number;
  sparkline_in_7d?: { price: number[] };
}

export interface MarketData {
  prices: Record<string, TokenPrice>;
  lastUpdated: string;
}

export function useMarketData() {
  return useSWR<MarketData>("/api/context/market", fetcher, {
    refreshInterval: 300000, // 5 minutes
  });
}

/* ═══════════════════════════════════════════════════════════════════
   Gas Hooks
   ═══════════════════════════════════════════════════════════════════ */

export interface GasPrices {
  low: number;
  average: number;
  high: number;
  baseFee?: number;
}

export interface GasData {
  gas: GasPrices;
  lastUpdated: string;
}

export function useGasPrices() {
  return useSWR<GasData>("/api/context/gas", fetcher, {
    refreshInterval: 60000, // 1 minute
  });
}

/* ═══════════════════════════════════════════════════════════════════
   News/RSS Hooks
   ═══════════════════════════════════════════════════════════════════ */

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
  description?: string;
}

export interface NewsData {
  feeds: Array<{
    key: string;
    name: string;
    category: string;
    itemCount: number;
  }>;
  items: NewsItem[];
  totalItems: number;
  lastUpdated: string;
}

export function useNews(category?: string, limit = 20) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  params.set("limit", limit.toString());

  return useSWR<NewsData>(`/api/context/news?${params}`, fetcher, {
    refreshInterval: 900000, // 15 minutes
  });
}

/* ═══════════════════════════════════════════════════════════════════
   Status Hooks
   ═══════════════════════════════════════════════════════════════════ */

export interface StatusComponent {
  name: string;
  status: "operational" | "degraded" | "outage" | "unknown";
  description?: string;
}

export interface StatusData {
  overall: "operational" | "degraded" | "outage" | "unknown";
  components: StatusComponent[];
  lastUpdated: string;
}

export function useInfraStatus() {
  return useSWR<StatusData>("/api/context/status", fetcher, {
    refreshInterval: 300000, // 5 minutes
  });
}

/* ═══════════════════════════════════════════════════════════════════
   Dune Analytics Hooks
   ═══════════════════════════════════════════════════════════════════ */

export interface DuneResult<T = Record<string, unknown>> {
  result: {
    rows: T[];
    metadata: {
      column_names: string[];
      result_set_bytes: number;
      total_row_count: number;
    };
  };
  execution_id: string;
  query_id: number;
  state: string;
  lastUpdated: string;
}

export function useDuneQuery<T = Record<string, unknown>>(queryId: number | null) {
  return useSWR<DuneResult<T>>(
    queryId ? `/api/dune/${queryId}` : null,
    fetcher,
    {
      refreshInterval: 3600000, // 1 hour (Dune data is cached)
      revalidateOnFocus: false,
    }
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Governance Hooks (Tally API)
   ═══════════════════════════════════════════════════════════════════ */

export interface Proposal {
  id: string;
  onchainId: string;
  title: string;
  description: string;
  summary: string | null;
  status: "active" | "pending" | "canceled" | "defeated" | "succeeded" | "queued" | "expired" | "executed";
  proposer: {
    address: string;
    ensName: string | null;
    name: string | null;
  };
  votes: {
    for: string;
    against: string;
    abstain: string;
  };
  quorum: string;
  startBlock: number | null;
  endBlock: number | null;
  startTime: string | null;
  endTime: string | null;
  discourseUrl: string | null;
  createdAt: string | null;
}

export interface ProposalsData {
  proposals: Proposal[];
  totalCount: number;
  activeCount: number;
  pendingCount: number;
  lastUpdated: string;
  source: string;
}

export function useProposals(status?: string, limit = 20) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("limit", limit.toString());

  return useSWR<ProposalsData>(
    `/api/governance/proposals?${params}`,
    fetcher,
    {
      refreshInterval: 60000, // 1 minute
      revalidateOnFocus: true,
    }
  );
}

export interface Delegate {
  address: string;
  ensName: string | null;
  name: string | null;
  bio: string | null;
  picture: string | null;
  votingPower: string;
  votingPowerFormatted: string;
  votingPowerPercent: number;
  delegatorsCount: number;
  statement: string | null;
  isSeekingDelegation: boolean;
}

export interface DelegatesData {
  delegates: Delegate[];
  totalSupply: string;
  totalSupplyFormatted: string;
  totalDelegates: number;
  totalDelegatesVotesCount: string;
  tokenOwnersCount: number;
  // Governance parameters for attack analysis
  quorum: string;
  quorumFormatted: string;
  proposalStats: {
    total: number;
    active: number;
    failed: number;
    passed: number;
  };
  lastUpdated: string;
  source: string;
}

export function useDelegates(limit = 20) {
  return useSWR<DelegatesData>(
    `/api/governance/delegates?limit=${limit}`,
    fetcher,
    {
      refreshInterval: 300000, // 5 minutes
      revalidateOnFocus: true,
    }
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Calendar Hooks
   ═══════════════════════════════════════════════════════════════════ */

export interface Meeting {
  id: string;
  title: string;
  start: string;
  end: string;
  workingGroup?: string;
  meetLink?: string;
  description?: string;
}

export function useUpcomingMeetings() {
  return useSWR<{ meetings: Meeting[] }>("/api/calendar/meetings", fetcher, {
    refreshInterval: 300000,
  });
}

/* ═══════════════════════════════════════════════════════════════════
   Protocol Health Hooks (ENS Node)
   ═══════════════════════════════════════════════════════════════════ */

export type IndexingStatus =
  | "unstarted"
  | "backfill"
  | "following"
  | "completed"
  | "error";

export type ChainStatus = "queued" | "backfill" | "following" | "completed";

export interface ChainIndexingStatus {
  chainId: string;
  chainName: string;
  status: ChainStatus;
  startBlock?: {
    number: number;
    timestamp: number;
  };
  latestIndexedBlock?: {
    number: number;
    timestamp: number;
  };
  latestKnownBlock?: {
    number: number;
    timestamp: number;
  };
  backfillEndBlock?: {
    number: number;
    timestamp: number;
  };
  progressPercent?: number;
  blocksRemaining?: number;
}

export interface ENSNodeConfig {
  version: string;
  networks: string[];
  features: string[];
}

export interface ENSNodeIndexingStatus {
  status: IndexingStatus;
  omnichainIndexingCursor?: number;
  slowestChainCursor?: number;
  chains: ChainIndexingStatus[];
  lastUpdated: string;
}

export interface ProtocolHealthData {
  config: ENSNodeConfig | null;
  indexingStatus: ENSNodeIndexingStatus | null;
  isHealthy: boolean;
  latency: number;
  lastUpdated: string;
}

export function useProtocolHealth() {
  return useSWR<ProtocolHealthData>("/api/context/protocol", fetcher, {
    refreshInterval: 60000, // 1 minute
  });
}

/* ═══════════════════════════════════════════════════════════════════
   Historical Context Hooks
   ═══════════════════════════════════════════════════════════════════ */

export interface ContextSnapshot {
  label: string;
  timestamp: string;
  ethPrice: number;
  ensPrice: number;
  treasuryValueUsd: number;
  gasPrice: number;
}

export interface HistoricalContextData {
  proposalId: string;
  hasIndexedContext: boolean;
  createdSnapshot: ContextSnapshot;
  currentSnapshot: ContextSnapshot;
}

export function useHistoricalContext(proposalId: string | null) {
  return useSWR<HistoricalContextData>(
    proposalId ? `/api/context/historical?proposalId=${proposalId}` : null,
    fetcher,
    {
      refreshInterval: 300000, // 5 minutes
      revalidateOnFocus: false,
    }
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ENS Stats Hooks (from Dune Analytics)
   ═══════════════════════════════════════════════════════════════════ */

export interface MetricWithDelta {
  value: number | null;
  previousValue: number | null;
  delta: number | null; // Absolute change
  deltaPercent: number | null; // Percentage change
}

export interface ENSStats {
  totalEnsCreated: MetricWithDelta;
  uniqueParticipants: MetricWithDelta;
  totalPrimaryNames: MetricWithDelta;
  monthlyRegistrations: MetricWithDelta;
  monthlyNewAddresses: MetricWithDelta;
  totalContentHash: MetricWithDelta;
  lastUpdated: string;
  hasHistoricalData: boolean;
  daysOfHistory: number;
  dataSource: "database" | "dune_estimate";
}

export function useEnsStats() {
  return useSWR<ENSStats>("/api/dune/ens-stats", fetcher, {
    refreshInterval: 3600000, // 1 hour (Dune data refreshes daily)
    revalidateOnFocus: false,
  });
}

/* ═══════════════════════════════════════════════════════════════════
   Financials Hooks (from Steakhouse Dune Analytics)
   ═══════════════════════════════════════════════════════════════════ */

export interface Financials {
  dailyRevenue: MetricWithDelta;
  monthlyRevenue: MetricWithDelta;
  yearlyRevenue: MetricWithDelta;
  totalAssets: MetricWithDelta;
  ensPrice: MetricWithDelta;
  dailyRegistrations: MetricWithDelta;
  endowment: {
    eth: number;
    usdc: number;
    other: number;
    total: number;
  } | null;
  lastUpdated: string;
  dataSource: string;
}

export function useFinancials() {
  return useSWR<Financials>("/api/dune/financials", fetcher, {
    refreshInterval: 3600000, // 1 hour
    revalidateOnFocus: false,
  });
}

/* ═══════════════════════════════════════════════════════════════════
   Discourse Feed Hooks
   ═══════════════════════════════════════════════════════════════════ */

export interface DiscourseItem {
  id: string;
  url: string;
  title: string;
  author: string;
  createdAt: string;
  lastActivityAt: string;
  category: string;
  categoryName: string;
  tags: string[];
  stats: { replies: number; views: number; likes: number };
  summary: string | null;
}

export interface DiscourseFeedData {
  items: DiscourseItem[];
  meta: { count: number; source: string; lastUpdated: string; daysFilter?: number };
}

export function useDiscourseFeed(limit = 5, days?: number) {
  const url = days
    ? `/api/feeds/discourse?limit=${limit}&days=${days}`
    : `/api/feeds/discourse?limit=${limit}`;
  return useSWR<DiscourseFeedData>(
    url,
    fetcher,
    { refreshInterval: 900000 } // 15 minutes
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Social Feed Hooks
   ═══════════════════════════════════════════════════════════════════ */

export interface SocialItem {
  id: string;
  url: string;
  platform: string;
  author: { handle: string; displayName: string; avatar: string };
  createdAt: string;
  content: { text: string };
  stats: { likes: number; retweets: number; replies: number };
  isRetweet: boolean;
  isAnnouncement: boolean;
  summary: string | null;
}

export interface SocialFeedData {
  items: SocialItem[];
  meta: { count: number; accounts: string[]; lastUpdated: string };
}

export function useSocialFeed(limit = 5) {
  return useSWR<SocialFeedData>(
    `/api/feeds/social?limit=${limit}`,
    fetcher,
    { refreshInterval: 300000 } // 5 minutes
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Newsletter Hooks
   ═══════════════════════════════════════════════════════════════════ */

export interface NewsletterItem {
  id: string;
  url: string;
  title: string;
  author: string;
  publishedAt: string;
  excerpt: string;
  summary: string | null;
}

export interface NewsletterFeedData {
  items: NewsletterItem[];
  meta: { count: number; source: string; feedTitle: string; lastUpdated: string };
}

export function useNewsletter(limit = 10) {
  return useSWR<NewsletterFeedData>(
    `/api/feeds/newsletter?limit=${limit}`,
    fetcher,
    { refreshInterval: 3600000 } // 1 hour
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Signals Ticker Hooks
   ═══════════════════════════════════════════════════════════════════ */

export interface TickerItem {
  id: string;
  headline: string;
  source: "x" | "discourse" | "other";
  author: string;
  score: number;
  url: string;
  publishedAt: string;
}

export interface TickerData {
  items: TickerItem[];
  count: number;
  lastUpdated: string;
}

export function useSignalsTicker() {
  return useSWR<TickerData>(
    `/api/signals/ticker`,
    fetcher,
    { refreshInterval: 900000 } // 15 minutes
  );
}
