/**
 * ENS Node Client
 * Fetches protocol health and indexing status from ENS Node API
 *
 * @see https://ensnode.io for documentation
 */

// Public ENS Node API endpoint
const ENSNODE_API_BASE =
  process.env.ENSNODE_API_URL || "https://api.ensnode.io";

/* ═══════════════════════════════════════════════════════════════════
   Types
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

export interface ENSNodeHealth {
  config: ENSNodeConfig | null;
  indexingStatus: ENSNodeIndexingStatus | null;
  isHealthy: boolean;
  latency: number;
  lastUpdated: string;
}

/* ═══════════════════════════════════════════════════════════════════
   Chain ID to Name Mapping
   ═══════════════════════════════════════════════════════════════════ */

const CHAIN_NAMES: Record<string, string> = {
  "1": "Ethereum",
  "10": "Optimism",
  "137": "Polygon",
  "8453": "Base",
  "42161": "Arbitrum",
  "59144": "Linea",
  "11155111": "Sepolia",
};

function getChainName(chainId: string): string {
  return CHAIN_NAMES[chainId] || `Chain ${chainId}`;
}

/* ═══════════════════════════════════════════════════════════════════
   API Functions
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Fetch ENS Node configuration
 */
export async function fetchENSNodeConfig(): Promise<ENSNodeConfig | null> {
  try {
    const response = await fetch(`${ENSNODE_API_BASE}/v1/config`, {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`ENS Node config error: ${response.status}`);
    }

    const data = await response.json();
    return {
      version: data.version || "unknown",
      networks: data.networks || [],
      features: data.features || [],
    };
  } catch (error) {
    console.error("Error fetching ENS Node config:", error);
    return null;
  }
}

/**
 * Fetch ENS Node indexing status
 */
export async function fetchENSNodeIndexingStatus(): Promise<ENSNodeIndexingStatus | null> {
  try {
    const response = await fetch(`${ENSNODE_API_BASE}/v1/indexing-status`, {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`ENS Node indexing status error: ${response.status}`);
    }

    const data = await response.json();

    // Handle error response
    if (data.responseCode === "error") {
      return {
        status: "error",
        chains: [],
        lastUpdated: new Date().toISOString(),
      };
    }

    // Parse the indexing status response
    const projection = data.realtimeProjection;
    const snapshot = projection?.snapshot;
    const omnichainSnapshot = snapshot?.omnichainSnapshot;

    if (!omnichainSnapshot) {
      return {
        status: "error",
        chains: [],
        lastUpdated: new Date().toISOString(),
      };
    }

    // Map status ID to readable status
    const statusMap: Record<string, IndexingStatus> = {
      unstarted: "unstarted",
      backfill: "backfill",
      following: "following",
      completed: "completed",
    };

    const status = statusMap[omnichainSnapshot.omnichainStatus] || "error";

    // Parse chain statuses
    const chains: ChainIndexingStatus[] = [];
    const chainData = omnichainSnapshot.chains || {};

    for (const [chainId, chainInfo] of Object.entries(chainData)) {
      const info = chainInfo as {
        chainStatus: string;
        config?: {
          startBlock?: { number: number; timestamp: number };
        };
        latestIndexedBlock?: { number: number; timestamp: number };
        latestKnownBlock?: { number: number; timestamp: number };
        backfillEndBlock?: { number: number; timestamp: number };
      };

      const chainStatus: ChainIndexingStatus = {
        chainId,
        chainName: getChainName(chainId),
        status: info.chainStatus as ChainStatus,
        startBlock: info.config?.startBlock,
        latestIndexedBlock: info.latestIndexedBlock,
        latestKnownBlock: info.latestKnownBlock,
        backfillEndBlock: info.backfillEndBlock,
      };

      // Calculate progress for backfilling chains
      if (
        info.chainStatus === "backfill" &&
        info.latestIndexedBlock &&
        info.backfillEndBlock &&
        info.config?.startBlock
      ) {
        const totalBlocks =
          info.backfillEndBlock.number - info.config.startBlock.number;
        const indexedBlocks =
          info.latestIndexedBlock.number - info.config.startBlock.number;
        chainStatus.progressPercent = Math.round(
          (indexedBlocks / totalBlocks) * 100
        );
        chainStatus.blocksRemaining =
          info.backfillEndBlock.number - info.latestIndexedBlock.number;
      }

      // Calculate blocks behind for following chains
      if (
        info.chainStatus === "following" &&
        info.latestIndexedBlock &&
        info.latestKnownBlock
      ) {
        chainStatus.blocksRemaining =
          info.latestKnownBlock.number - info.latestIndexedBlock.number;
        chainStatus.progressPercent =
          chainStatus.blocksRemaining <= 10 ? 100 : 99;
      }

      chains.push(chainStatus);
    }

    // Sort chains by chain ID (Ethereum first)
    chains.sort((a, b) => {
      if (a.chainId === "1") return -1;
      if (b.chainId === "1") return 1;
      return parseInt(a.chainId) - parseInt(b.chainId);
    });

    return {
      status,
      omnichainIndexingCursor: omnichainSnapshot.omnichainIndexingCursor,
      slowestChainCursor: snapshot.slowestChainIndexingCursor,
      chains,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching ENS Node indexing status:", error);
    return null;
  }
}

/**
 * Fetch complete ENS Node health status
 */
export async function fetchENSNodeHealth(): Promise<ENSNodeHealth> {
  const startTime = Date.now();

  const [config, indexingStatus] = await Promise.all([
    fetchENSNodeConfig(),
    fetchENSNodeIndexingStatus(),
  ]);

  const latency = Date.now() - startTime;

  // Determine overall health
  const isHealthy =
    config !== null &&
    indexingStatus !== null &&
    indexingStatus.status !== "error" &&
    latency < 5000;

  return {
    config,
    indexingStatus,
    isHealthy,
    latency,
    lastUpdated: new Date().toISOString(),
  };
}

/* ═══════════════════════════════════════════════════════════════════
   Utility Functions
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Format block number with commas
 */
export function formatBlockNumber(block: number): string {
  return block.toLocaleString();
}

/**
 * Get status color for display
 */
export function getStatusColor(
  status: IndexingStatus | ChainStatus
): "success" | "warning" | "danger" | "muted" {
  switch (status) {
    case "following":
    case "completed":
      return "success";
    case "backfill":
      return "warning";
    case "queued":
    case "unstarted":
      return "muted";
    case "error":
      return "danger";
    default:
      return "muted";
  }
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: IndexingStatus | ChainStatus): string {
  switch (status) {
    case "following":
      return "Synced";
    case "completed":
      return "Complete";
    case "backfill":
      return "Syncing";
    case "queued":
      return "Queued";
    case "unstarted":
      return "Not Started";
    case "error":
      return "Error";
    default:
      return "Unknown";
  }
}

/**
 * Format time since last update
 */
export function formatTimeSince(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;

  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}
