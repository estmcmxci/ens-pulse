// Dune Analytics Query IDs for ENS DAO metrics
// Queries sourced from:
// - avsa/governancerisk
// - kpk/ens-dao-governance
// - ethereumnameservice/ens
//
// Query IDs were categorized by fetching results and analyzing column names.
// Last updated: 2026-01-19
export const DUNE_QUERIES = {
  // === Governance ===
  // Quorum metrics: rank, cum_onchain_quorum (1 row)
  GOVERNANCE_OVERVIEW: 2772488,
  // Governance risk metrics from avsa/governancerisk
  // Columns: period, total_assets, delegated_market_cap, ActiveDelegators, risk_factor
  GOVERNANCE_RISK: 3613359,
  // Proposal submission counts: onchain_submits, offchain_submits
  PROPOSAL_HISTORY: 2772373,
  // Monthly voting activity: month, votes (51 rows)
  DAO_GOVERNANCE_SUMMARY: 3223327,

  // === Delegates ===
  // Time series: date, delegates, votes_delegated (1532 rows)
  VOTING_POWER_DISTRIBUTION: 2687659,
  // Top delegates with full details: rank, delegate, name, votes, delegators, share
  // 2673903 has 1000 rows, 2750116 has 9281 rows (full list)
  DELEGATE_CONCENTRATION: 2750116,
  // Delegation changes over time: date, user_action, delta, cum_delta
  DELEGATE_ACTIVITY: 2677413,
  // Summary stats: #_delegates, token_holders, delegators, delegated_votes, quorum thresholds
  DELEGATE_SUMMARY: 2673729,
  // Voting power by group over time: date, group, voting_power (7660 rows)
  VOTING_POWER_BY_GROUP: 3235182,
  // Recent delegation changes: delegate, name, bal_delta, change_over_current
  RECENT_DELEGATION_CHANGES: 2756190,

  // === Treasury ===
  // Monthly revenue: period, amount, amount_m, amount_prev_month, amount_prev_year
  ENS_REVENUE: 3522362,
  // Token holder balances: rank, address, balance, balance_usd, circ_share, name, ens_name
  TREASURY_BALANCE_HISTORY: 2759082,
  // Same as TREASURY_BALANCE_HISTORY - shows top token holders
  TOKEN_HOLDER_DISTRIBUTION: 2759082,

  // === Steakhouse Financial Queries ===
  // From https://dune.com/steakhouse/ens-steakhouse
  // ENS Price Evolution over time
  STEAKHOUSE_ENS_PRICE: 1355395,
  // Total Assets excluding ENS tokens (treasury value in USD)
  STEAKHOUSE_TOTAL_ASSETS: 2840252,
  // Daily protocol revenues from registrations/renewals
  STEAKHOUSE_DAILY_REVENUES: 3069494,
  // .eth registrations per day
  STEAKHOUSE_DAILY_REGISTRATIONS: 1347864,
  // Endowment composition breakdown by asset type
  STEAKHOUSE_ENDOWMENT_COMPOSITION: 3446265,

  // === Registrations ===
  // From ethereumnameservice/ens dashboard - Core Counters
  // Total active ENS names: 1,503,255
  TOTAL_ENS_NAMES: 5768,
  // Unique participants: 656,835
  UNIQUE_PARTICIPANTS: 6491,
  // Primary names set count (from our original query)
  PRIMARY_NAMES_SET: 2101527,

  // From ethereumnameservice/ens dashboard - Record Counters
  // Total avatar set: 232,016
  TOTAL_AVATAR_SET: 675898,
  // Total Dweb (contenthash) set: 32,291
  TOTAL_DWEB_SET: 675909,
  // Total cointype set (except ETH): 22,074
  TOTAL_COINTYPE_SET: 675916,

  // From ethereumnameservice/ens dashboard - Time Series
  // Monthly .eth registrations (81 rows)
  MONTHLY_REGISTRATIONS: 5676,
  // Monthly new addresses (69 rows)
  MONTHLY_NEW_ADDRESSES: 650661,
  // Monthly primary names (72 rows)
  MONTHLY_PRIMARY_NAMES: 675116,

  // ENS price history: period, ENS Price (366 rows)
  ENS_PRICE_HISTORY: 3690384,

  // Legacy aliases for backwards compatibility
  ENS_REGISTRATIONS: 5768,
  DOMAIN_STATISTICS: 5676,
  DELEGATING_HOLDERS: 2776350,
} as const;

export type DuneQueryKey = keyof typeof DUNE_QUERIES;
export type DuneQueryId = (typeof DUNE_QUERIES)[DuneQueryKey];

export interface DuneQueryConfig {
  key: DuneQueryKey;
  id: DuneQueryId;
  name: string;
  description: string;
  category: "governance" | "treasury" | "registrations" | "delegates";
  refreshInterval: number; // in hours
  isActive: boolean;
}

export const DUNE_QUERY_CONFIGS: DuneQueryConfig[] = [
  // === Governance ===
  {
    key: "GOVERNANCE_OVERVIEW",
    id: DUNE_QUERIES.GOVERNANCE_OVERVIEW,
    name: "Governance Overview",
    description: "Quorum metrics and governance thresholds",
    category: "governance",
    refreshInterval: 24,
    isActive: true,
  },
  {
    key: "GOVERNANCE_RISK",
    id: DUNE_QUERIES.GOVERNANCE_RISK,
    name: "Governance Risk Metrics",
    description: "Risk indicators including delegated market cap and active delegators over time",
    category: "governance",
    refreshInterval: 24,
    isActive: true,
  },
  {
    key: "PROPOSAL_HISTORY",
    id: DUNE_QUERIES.PROPOSAL_HISTORY,
    name: "Proposal Submissions",
    description: "On-chain and off-chain proposal submission counts",
    category: "governance",
    refreshInterval: 24,
    isActive: true,
  },
  {
    key: "DAO_GOVERNANCE_SUMMARY",
    id: DUNE_QUERIES.DAO_GOVERNANCE_SUMMARY,
    name: "Monthly Voting Activity",
    description: "Historical monthly voting activity across all proposals",
    category: "governance",
    refreshInterval: 24,
    isActive: true,
  },

  // === Delegates ===
  {
    key: "VOTING_POWER_DISTRIBUTION",
    id: DUNE_QUERIES.VOTING_POWER_DISTRIBUTION,
    name: "Voting Power Over Time",
    description: "Time series of delegates and delegated votes",
    category: "delegates",
    refreshInterval: 12,
    isActive: true,
  },
  {
    key: "DELEGATE_CONCENTRATION",
    id: DUNE_QUERIES.DELEGATE_CONCENTRATION,
    name: "Delegate Leaderboard",
    description: "Full list of delegates with voting power, delegators, and quorum share",
    category: "delegates",
    refreshInterval: 24,
    isActive: true,
  },
  {
    key: "DELEGATE_ACTIVITY",
    id: DUNE_QUERIES.DELEGATE_ACTIVITY,
    name: "Delegation Changes",
    description: "Historical delegation changes with cumulative deltas",
    category: "delegates",
    refreshInterval: 12,
    isActive: true,
  },
  {
    key: "DELEGATE_SUMMARY",
    id: DUNE_QUERIES.DELEGATE_SUMMARY,
    name: "Delegate Summary Stats",
    description: "Summary statistics including delegate count, holders, quorum thresholds",
    category: "delegates",
    refreshInterval: 24,
    isActive: true,
  },
  {
    key: "VOTING_POWER_BY_GROUP",
    id: DUNE_QUERIES.VOTING_POWER_BY_GROUP,
    name: "Voting Power by Group",
    description: "Voting power distribution across groups over time",
    category: "delegates",
    refreshInterval: 24,
    isActive: true,
  },
  {
    key: "RECENT_DELEGATION_CHANGES",
    id: DUNE_QUERIES.RECENT_DELEGATION_CHANGES,
    name: "Recent Delegation Changes",
    description: "Recent changes in delegate balances and voting power",
    category: "delegates",
    refreshInterval: 6,
    isActive: true,
  },

  // === Treasury ===
  {
    key: "ENS_REVENUE",
    id: DUNE_QUERIES.ENS_REVENUE,
    name: "ENS Revenue",
    description: "Monthly protocol revenue with year-over-year comparisons",
    category: "treasury",
    refreshInterval: 24,
    isActive: true,
  },
  {
    key: "TREASURY_BALANCE_HISTORY",
    id: DUNE_QUERIES.TREASURY_BALANCE_HISTORY,
    name: "Token Holder Balances",
    description: "Top token holders with balances, USD value, and circulating share",
    category: "treasury",
    refreshInterval: 24,
    isActive: true,
  },
  {
    key: "TOKEN_HOLDER_DISTRIBUTION",
    id: DUNE_QUERIES.TOKEN_HOLDER_DISTRIBUTION,
    name: "Token Holder Distribution",
    description: "ENS token holder distribution by balance",
    category: "treasury",
    refreshInterval: 24,
    isActive: true,
  },

  // === Steakhouse Financial Queries ===
  {
    key: "STEAKHOUSE_ENS_PRICE",
    id: DUNE_QUERIES.STEAKHOUSE_ENS_PRICE,
    name: "ENS Price Evolution",
    description: "Historical ENS token price from Steakhouse",
    category: "treasury",
    refreshInterval: 24,
    isActive: true,
  },
  {
    key: "STEAKHOUSE_TOTAL_ASSETS",
    id: DUNE_QUERIES.STEAKHOUSE_TOTAL_ASSETS,
    name: "Total Assets (excl. ENS)",
    description: "Total treasury assets excluding ENS tokens",
    category: "treasury",
    refreshInterval: 24,
    isActive: true,
  },
  {
    key: "STEAKHOUSE_DAILY_REVENUES",
    id: DUNE_QUERIES.STEAKHOUSE_DAILY_REVENUES,
    name: "Daily Revenues",
    description: "Daily protocol revenue from registrations and renewals",
    category: "treasury",
    refreshInterval: 12,
    isActive: true,
  },
  {
    key: "STEAKHOUSE_DAILY_REGISTRATIONS",
    id: DUNE_QUERIES.STEAKHOUSE_DAILY_REGISTRATIONS,
    name: "Daily Registrations",
    description: ".eth domain registrations per day",
    category: "treasury",
    refreshInterval: 12,
    isActive: true,
  },
  {
    key: "STEAKHOUSE_ENDOWMENT_COMPOSITION",
    id: DUNE_QUERIES.STEAKHOUSE_ENDOWMENT_COMPOSITION,
    name: "Endowment Composition",
    description: "Treasury asset composition breakdown",
    category: "treasury",
    refreshInterval: 24,
    isActive: true,
  },

  // === Registrations - Core Counters ===
  {
    key: "TOTAL_ENS_NAMES",
    id: DUNE_QUERIES.TOTAL_ENS_NAMES,
    name: "Total ENS Names",
    description: "Total active ENS names created (1.5M+)",
    category: "registrations",
    refreshInterval: 24,
    isActive: true,
  },
  {
    key: "UNIQUE_PARTICIPANTS",
    id: DUNE_QUERIES.UNIQUE_PARTICIPANTS,
    name: "Unique Participants",
    description: "All ENS participating addresses (656K+)",
    category: "registrations",
    refreshInterval: 24,
    isActive: true,
  },
  {
    key: "PRIMARY_NAMES_SET",
    id: DUNE_QUERIES.PRIMARY_NAMES_SET,
    name: "Primary Names Set",
    description: "Count of primary names set by users",
    category: "registrations",
    refreshInterval: 24,
    isActive: true,
  },

  // === Registrations - Record Counters ===
  {
    key: "TOTAL_AVATAR_SET",
    id: DUNE_QUERIES.TOTAL_AVATAR_SET,
    name: "Total Avatar Records",
    description: "Total avatar records set (232K+)",
    category: "registrations",
    refreshInterval: 24,
    isActive: true,
  },
  {
    key: "TOTAL_DWEB_SET",
    id: DUNE_QUERIES.TOTAL_DWEB_SET,
    name: "Total Dweb Records",
    description: "Total contenthash/dweb records set (32K+)",
    category: "registrations",
    refreshInterval: 24,
    isActive: true,
  },
  {
    key: "TOTAL_COINTYPE_SET",
    id: DUNE_QUERIES.TOTAL_COINTYPE_SET,
    name: "Total Cointype Records",
    description: "Total cointype records set except ETH (22K+)",
    category: "registrations",
    refreshInterval: 24,
    isActive: true,
  },

  // === Registrations - Time Series ===
  {
    key: "MONTHLY_REGISTRATIONS",
    id: DUNE_QUERIES.MONTHLY_REGISTRATIONS,
    name: "Monthly Registrations",
    description: "Monthly .eth registration counts over time",
    category: "registrations",
    refreshInterval: 24,
    isActive: true,
  },
  {
    key: "MONTHLY_NEW_ADDRESSES",
    id: DUNE_QUERIES.MONTHLY_NEW_ADDRESSES,
    name: "Monthly New Addresses",
    description: "New addresses participating in ENS each month",
    category: "registrations",
    refreshInterval: 24,
    isActive: true,
  },
  {
    key: "MONTHLY_PRIMARY_NAMES",
    id: DUNE_QUERIES.MONTHLY_PRIMARY_NAMES,
    name: "Monthly Primary Names",
    description: "Primary names set each month",
    category: "registrations",
    refreshInterval: 24,
    isActive: true,
  },
  {
    key: "ENS_PRICE_HISTORY",
    id: DUNE_QUERIES.ENS_PRICE_HISTORY,
    name: "ENS Price History",
    description: "Historical ENS token price data",
    category: "registrations",
    refreshInterval: 24,
    isActive: true,
  },

  // === Delegates - Additional ===
  {
    key: "DELEGATING_HOLDERS",
    id: DUNE_QUERIES.DELEGATING_HOLDERS,
    name: "Delegating Holders",
    description: "Count of token holders who have delegated",
    category: "delegates",
    refreshInterval: 24,
    isActive: true,
  },

  // Legacy aliases (same data, different keys for backwards compatibility)
  {
    key: "ENS_REGISTRATIONS",
    id: DUNE_QUERIES.ENS_REGISTRATIONS,
    name: "ENS Registrations",
    description: "Alias for TOTAL_ENS_NAMES",
    category: "registrations",
    refreshInterval: 24,
    isActive: false,
  },
  {
    key: "DOMAIN_STATISTICS",
    id: DUNE_QUERIES.DOMAIN_STATISTICS,
    name: "Domain Statistics",
    description: "Alias for MONTHLY_REGISTRATIONS",
    category: "registrations",
    refreshInterval: 24,
    isActive: false,
  },
];

export function getActiveQueries(): DuneQueryConfig[] {
  return DUNE_QUERY_CONFIGS.filter((config) => config.isActive && config.id > 0);
}

export function getQueriesByCategory(
  category: DuneQueryConfig["category"]
): DuneQueryConfig[] {
  return DUNE_QUERY_CONFIGS.filter((config) => config.category === category);
}
