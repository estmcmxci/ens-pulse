/**
 * Tally API Client
 * GraphQL client for fetching governance data from Tally.xyz
 */

import { ENS_CONFIG } from "@/shared/config/ens";

const TALLY_API_URL = "https://api.tally.xyz/query";
const ENS_GOVERNOR_ID = `eip155:1:${ENS_CONFIG.GOVERNOR}`;
const ENS_ORGANIZATION_SLUG = "ens";

// Cache for API responses
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute cache

function getTallyApiKey(): string {
  const apiKey = process.env.TALLY_API_KEY;
  if (!apiKey) {
    throw new Error("TALLY_API_KEY environment variable is not set");
  }
  return apiKey;
}

async function tallyGraphQL<T>(
  query: string,
  variables: Record<string, unknown> = {},
  cacheKey?: string
): Promise<T> {
  // Check cache first
  if (cacheKey) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T;
    }
  }

  const response = await fetch(TALLY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": getTallyApiKey(),
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tally API error: ${response.status} - ${errorText}`);
  }

  const json = await response.json();

  if (json.errors) {
    throw new Error(`Tally GraphQL error: ${JSON.stringify(json.errors)}`);
  }

  // Cache the result
  if (cacheKey) {
    cache.set(cacheKey, { data: json.data, timestamp: Date.now() });
  }

  return json.data as T;
}

// ============================================================================
// Types
// ============================================================================

export interface TallyAccount {
  id: string;
  address: string;
  ens: string | null;
  name: string | null;
  bio: string | null;
  picture: string | null;
}

export interface TallyVoteStats {
  type: "for" | "against" | "abstain";
  votesCount: string;
  votersCount: number;
  percent: number;
}

export interface TallyBlock {
  number: number;
  timestamp: string;
}

export interface TallyProposal {
  id: string;
  onchainId: string;
  chainId: string;
  status: string;
  quorum: string;
  proposer: TallyAccount;
  metadata: {
    title: string;
    description: string;
    eta: number | null;
    discourseURL: string | null;
  };
  start: TallyBlock | null;
  end: TallyBlock | null;
  voteStats: TallyVoteStats[];
  governor: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface TallyDelegate {
  id: string;
  account: TallyAccount;
  delegatorsCount: number;
  votesCount: string;
  statement: {
    statement: string | null;
    statementSummary: string | null;
    isSeekingDelegation: boolean;
  } | null;
}

export interface TallyGovernor {
  id: string;
  name: string;
  slug: string;
  chainId: string;
  proposalStats: {
    total: number;
    active: number;
    failed: number;
    passed: number;
  };
  delegatesCount: number;
  delegatesVotesCount: string;
  tokenOwnersCount: number;
  quorum: string;
  token: {
    name: string;
    symbol: string;
    supply: string;
    decimals: number;
  };
}

// ============================================================================
// Queries
// ============================================================================

const PROPOSALS_QUERY = `
  query Proposals($input: ProposalsInput!) {
    proposals(input: $input) {
      nodes {
        ... on Proposal {
          id
          onchainId
          chainId
          status
          quorum
          proposer {
            id
            address
            ens
            name
          }
          metadata {
            title
            description
            eta
            discourseURL
          }
          start {
            ... on Block {
              number
              timestamp
            }
          }
          end {
            ... on Block {
              number
              timestamp
            }
          }
          voteStats {
            type
            votesCount
            votersCount
            percent
          }
          governor {
            id
            name
            slug
          }
        }
      }
      pageInfo {
        firstCursor
        lastCursor
        count
      }
    }
  }
`;

const DELEGATES_QUERY = `
  query Delegates($input: DelegatesInput!) {
    delegates(input: $input) {
      nodes {
        ... on Delegate {
          id
          account {
            id
            address
            ens
            name
            bio
            picture
          }
          delegatorsCount
          votesCount
          statement {
            statement
            statementSummary
            isSeekingDelegation
          }
        }
      }
      pageInfo {
        firstCursor
        lastCursor
        count
      }
    }
  }
`;

const GOVERNOR_QUERY = `
  query Governor($input: GovernorInput!) {
    governor(input: $input) {
      id
      name
      slug
      chainId
      proposalStats {
        total
        active
        failed
        passed
      }
      delegatesCount
      delegatesVotesCount
      tokenOwnersCount
      quorum
      token {
        name
        symbol
        supply
        decimals
      }
    }
  }
`;

// ============================================================================
// API Functions
// ============================================================================

export interface FetchProposalsOptions {
  limit?: number;
  afterCursor?: string;
  includeArchived?: boolean;
}

export interface FetchProposalsResult {
  proposals: TallyProposal[];
  pageInfo: {
    firstCursor: string | null;
    lastCursor: string | null;
    count: number;
  };
}

export async function fetchTallyProposals(
  options: FetchProposalsOptions = {}
): Promise<FetchProposalsResult> {
  const { limit = 20, afterCursor, includeArchived = true } = options;

  const input = {
    filters: {
      governorId: ENS_GOVERNOR_ID,
      includeArchived,
    },
    page: {
      limit,
      ...(afterCursor && { afterCursor }),
    },
    sort: {
      isDescending: true,
      sortBy: "id",
    },
  };

  const data = await tallyGraphQL<{
    proposals: {
      nodes: TallyProposal[];
      pageInfo: { firstCursor: string | null; lastCursor: string | null; count: number };
    };
  }>(PROPOSALS_QUERY, { input }, `proposals:${limit}:${afterCursor || "start"}`);

  return {
    proposals: data.proposals.nodes,
    pageInfo: data.proposals.pageInfo,
  };
}

export interface FetchDelegatesOptions {
  limit?: number;
  afterCursor?: string;
}

export interface FetchDelegatesResult {
  delegates: TallyDelegate[];
  pageInfo: {
    firstCursor: string | null;
    lastCursor: string | null;
    count: number;
  };
}

export async function fetchTallyDelegates(
  options: FetchDelegatesOptions = {}
): Promise<FetchDelegatesResult> {
  const { limit = 20, afterCursor } = options;

  // Tally API has a max page size of 20, so we need to paginate for larger requests
  const PAGE_SIZE = 20;

  if (limit <= PAGE_SIZE && !afterCursor) {
    // Simple case: single page request
    const input = {
      filters: {
        governorId: ENS_GOVERNOR_ID,
        hasVotes: true,
      },
      page: {
        limit,
      },
      sort: {
        isDescending: true,
        sortBy: "votes",
      },
    };

    const data = await tallyGraphQL<{
      delegates: {
        nodes: TallyDelegate[];
        pageInfo: { firstCursor: string | null; lastCursor: string | null; count: number };
      };
    }>(DELEGATES_QUERY, { input }, `delegates:${limit}:start`);

    return {
      delegates: data.delegates.nodes,
      pageInfo: data.delegates.pageInfo,
    };
  }

  // Paginate to fetch more delegates
  const allDelegates: TallyDelegate[] = [];
  let cursor: string | undefined = afterCursor;
  let lastPageInfo: { firstCursor: string | null; lastCursor: string | null; count: number } = {
    firstCursor: null,
    lastCursor: null,
    count: 0,
  };

  while (allDelegates.length < limit) {
    const pageLimit = Math.min(PAGE_SIZE, limit - allDelegates.length);

    const input = {
      filters: {
        governorId: ENS_GOVERNOR_ID,
        hasVotes: true,
      },
      page: {
        limit: pageLimit,
        ...(cursor && { afterCursor: cursor }),
      },
      sort: {
        isDescending: true,
        sortBy: "votes",
      },
    };

    const data = await tallyGraphQL<{
      delegates: {
        nodes: TallyDelegate[];
        pageInfo: { firstCursor: string | null; lastCursor: string | null; count: number };
      };
    }>(DELEGATES_QUERY, { input }); // Don't cache paginated requests

    allDelegates.push(...data.delegates.nodes);
    lastPageInfo = data.delegates.pageInfo;
    cursor = data.delegates.pageInfo.lastCursor || undefined;

    // No more pages
    if (!cursor || data.delegates.nodes.length < pageLimit) {
      break;
    }
  }

  return {
    delegates: allDelegates.slice(0, limit),
    pageInfo: lastPageInfo,
  };
}

export async function fetchTallyGovernor(): Promise<TallyGovernor> {
  const input = {
    id: ENS_GOVERNOR_ID,
  };

  const data = await tallyGraphQL<{ governor: TallyGovernor }>(
    GOVERNOR_QUERY,
    { input },
    "governor"
  );

  return data.governor;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps Tally status to our internal status type
 */
export function mapTallyStatus(
  tallyStatus: string
): "pending" | "active" | "canceled" | "defeated" | "succeeded" | "queued" | "expired" | "executed" {
  const statusMap: Record<string, "pending" | "active" | "canceled" | "defeated" | "succeeded" | "queued" | "expired" | "executed"> = {
    pending: "pending",
    active: "active",
    canceled: "canceled",
    cancelled: "canceled",
    defeated: "defeated",
    succeeded: "succeeded",
    queued: "queued",
    expired: "expired",
    executed: "executed",
  };

  return statusMap[tallyStatus.toLowerCase()] || "pending";
}

/**
 * Extract vote counts from Tally vote stats
 */
export function extractVoteCounts(voteStats: TallyVoteStats[]): {
  for: string;
  against: string;
  abstain: string;
} {
  const result = { for: "0", against: "0", abstain: "0" };

  for (const stat of voteStats) {
    if (stat.type === "for") result.for = stat.votesCount;
    if (stat.type === "against") result.against = stat.votesCount;
    if (stat.type === "abstain") result.abstain = stat.votesCount;
  }

  return result;
}

/**
 * Clear the cache (useful for testing or force refresh)
 */
export function clearTallyCache(): void {
  cache.clear();
}
