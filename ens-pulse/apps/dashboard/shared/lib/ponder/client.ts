/**
 * Ponder REST API client
 * Connects to the Ponder indexer for indexed blockchain data
 */

const PONDER_URL = process.env.PONDER_URL || "http://localhost:42069";

export interface PonderResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    limit: number;
    offset: number;
  };
  error?: string;
}

export interface PonderProposal {
  id: string;
  proposer: string;
  status: string;
  description: string | null;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  startBlock: string;
  endBlock: string;
  createdAt: string;
  executedAt: string | null;
  canceledAt: string | null;
}

export interface PonderDelegate {
  address: string;
  votingPower: string;
  delegatorsCount: number;
  votesCount: number;
  firstSeenAt: string;
  lastActiveAt: string | null;
}

export interface PonderVote {
  id: string;
  proposalId: string;
  voter: string;
  support: number;
  weight: string;
  reason: string | null;
  timestamp: string;
}

export interface PonderStats {
  totalProposals: number;
  activeProposals: number;
  executedProposals: number;
  totalDelegates: number;
  totalVotes: number;
}

/**
 * Fetches data from the Ponder REST API
 * @param endpoint - API endpoint path (e.g., "/proposals")
 * @param options - Optional fetch options
 * @returns Parsed JSON response
 * @throws Error if the request fails
 */
export async function fetchFromPonder<T>(
  endpoint: string,
  options?: RequestInit
): Promise<PonderResponse<T>> {
  const url = `${PONDER_URL}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    // Short timeout since Ponder is local/fast
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    throw new Error(`Ponder error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Checks if the Ponder indexer is available
 * @returns true if Ponder is reachable and responding
 */
export async function isPonderAvailable(): Promise<boolean> {
  try {
    const response = await fetchFromPonder<PonderStats>("/stats");
    return response.success === true;
  } catch {
    return false;
  }
}

/**
 * Fetches proposals from Ponder
 * @param options - Query options
 * @returns List of proposals
 */
export async function fetchProposals(options?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<PonderResponse<PonderProposal[]>> {
  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status);
  if (options?.limit) params.set("limit", options.limit.toString());
  if (options?.offset) params.set("offset", options.offset.toString());

  const queryString = params.toString();
  const endpoint = `/proposals${queryString ? `?${queryString}` : ""}`;

  return fetchFromPonder<PonderProposal[]>(endpoint);
}

/**
 * Fetches a single proposal with votes
 * @param proposalId - The proposal ID
 * @returns Proposal details with votes
 */
export async function fetchProposal(
  proposalId: string
): Promise<PonderResponse<{ proposal: PonderProposal; votes: PonderVote[] }>> {
  return fetchFromPonder(`/proposals/${proposalId}`);
}

/**
 * Fetches delegates from Ponder
 * @param options - Query options
 * @returns List of delegates
 */
export async function fetchDelegates(options?: {
  limit?: number;
  offset?: number;
  minVotingPower?: string;
}): Promise<PonderResponse<PonderDelegate[]>> {
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", options.limit.toString());
  if (options?.offset) params.set("offset", options.offset.toString());
  if (options?.minVotingPower) params.set("minVotingPower", options.minVotingPower);

  const queryString = params.toString();
  const endpoint = `/delegates${queryString ? `?${queryString}` : ""}`;

  return fetchFromPonder<PonderDelegate[]>(endpoint);
}

/**
 * Fetches a single delegate with votes and delegators
 * @param address - The delegate address
 * @returns Delegate details
 */
export async function fetchDelegate(address: string): Promise<
  PonderResponse<{
    delegate: PonderDelegate;
    recentVotes: PonderVote[];
    delegators: { address: string; amount: string }[];
  }>
> {
  return fetchFromPonder(`/delegates/${address.toLowerCase()}`);
}

/**
 * Fetches governance stats
 * @returns Overall governance statistics
 */
export async function fetchStats(): Promise<PonderResponse<PonderStats>> {
  return fetchFromPonder<PonderStats>("/stats");
}

/* ═══════════════════════════════════════════════════════════════════
   Historical Context Types and Functions
   ═══════════════════════════════════════════════════════════════════ */

export interface PonderTreasurySnapshot {
  id: string;
  timestamp: string;
  blockNumber: string;
  totalValueUsd: string;
  ethBalance: string;
  ensBalance: string;
  usdcBalance: string;
  ethPrice: string;
  ensPrice: string;
  eventLabel: string | null;
}

export interface PonderProposalContext {
  id: string;
  proposalId: string;
  createdBlock: string;
  createdTimestamp: string;
  createdEthPrice: string;
  createdEnsPrice: string;
  createdGasPrice: string;
  createdTreasuryUsd: string;
}

/**
 * Fetches treasury snapshots for historical analysis
 * @param options - Query options for filtering
 * @returns List of treasury snapshots
 */
export async function fetchTreasurySnapshots(options?: {
  limit?: number;
  offset?: number;
  startTime?: string;
  endTime?: string;
}): Promise<PonderResponse<PonderTreasurySnapshot[]>> {
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", options.limit.toString());
  if (options?.offset) params.set("offset", options.offset.toString());
  if (options?.startTime) params.set("startTime", options.startTime);
  if (options?.endTime) params.set("endTime", options.endTime);

  const queryString = params.toString();
  const endpoint = `/treasury-snapshots${queryString ? `?${queryString}` : ""}`;

  return fetchFromPonder<PonderTreasurySnapshot[]>(endpoint);
}

/**
 * Fetches context snapshot from when a proposal was created
 * @param proposalId - The proposal ID
 * @returns World state at proposal creation time
 */
export async function fetchProposalContext(
  proposalId: string
): Promise<
  PonderResponse<{
    hasContext: boolean;
    proposal: PonderProposal | null;
    context: PonderProposalContext | null;
  }>
> {
  return fetchFromPonder(`/proposal-context/${proposalId}`);
}
