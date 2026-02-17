/**
 * Formatter utilities for the ENS Pulse dashboard
 * Hoisted to module scope for performance (avoid recreation on every render)
 */

/**
 * Formats large numbers with B/M/K suffixes
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

/**
 * Formats numbers in compact form with appropriate decimal places
 */
export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  if (value >= 1) return value.toFixed(1);
  return value.toFixed(2);
}

/**
 * Formats a date string as relative time (e.g., "5m ago", "2d ago")
 */
export function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 30) return `${Math.floor(diffDays / 30)}mo ago`;
  if (diffDays > 0) return `${diffDays}d ago`;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours > 0) return `${diffHours}h ago`;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  return `${diffMins}m ago`;
}

/**
 * Formats price for range display with appropriate decimal places
 */
export function formatRangePrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
}

/**
 * Formats voting power for display with M/K suffixes
 */
export function formatVotingPower(power: string): string {
  const num = parseFloat(power);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(0);
}

/**
 * Formats a value with optional B/M/K suffix
 */
export function formatValue(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toFixed(0);
}

/**
 * Extracts a summary from markdown description
 */
export function extractSummary(description: string): string {
  if (!description) return "";

  // Remove markdown headers and clean up
  let text = description
    .replace(/^#+\s+.+$/gm, "") // Remove headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Convert links to text
    .replace(/\|[^\n]+\|/g, "") // Remove table rows
    .replace(/[-|]+/g, "") // Remove table separators
    .replace(/[*_`]/g, "") // Remove markdown formatting
    .replace(/\n+/g, " ") // Replace newlines with spaces
    .trim();

  // Find the abstract or first meaningful paragraph
  const abstractMatch = description.match(
    /##\s*Abstract\s*\n+([\s\S]*?)(?=\n##|\n\n\n|$)/i
  );
  if (abstractMatch) {
    text = abstractMatch[1]
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[*_`]/g, "")
      .replace(/\n+/g, " ")
      .trim();
  }

  // Truncate to reasonable length
  if (text.length > 200) {
    text = text.slice(0, 200).trim() + "...";
  }

  return text;
}

/**
 * Calculates vote percentages from proposal votes
 */
export function getVotePercent(votes: {
  for: string;
  against: string;
}): { for: number; against: number } {
  const forVotes = BigInt(votes.for);
  const againstVotes = BigInt(votes.against);
  const total = forVotes + againstVotes;
  if (total === 0n) return { for: 0, against: 0 };
  return {
    for: Number((forVotes * 100n) / total),
    against: Number((againstVotes * 100n) / total),
  };
}

/**
 * Status configuration for proposals
 */
export const PROPOSAL_STATUS_CONFIG: Record<
  string,
  { color: string; label: string }
> = {
  active: { color: "bg-[var(--color-info)] text-white", label: "Active" },
  pending: { color: "bg-[var(--color-warning)] text-black", label: "Pending" },
  executed: { color: "bg-[var(--color-positive)] text-white", label: "Executed" },
  succeeded: { color: "bg-[var(--color-positive)] text-white", label: "Passed" },
  defeated: { color: "bg-[var(--color-negative)] text-white", label: "Failed" },
  canceled: { color: "bg-[var(--color-text-tertiary)] text-white", label: "Canceled" },
  expired: { color: "bg-[var(--color-text-tertiary)] text-white", label: "Expired" },
  queued: { color: "bg-[var(--color-warning)] text-black", label: "Queued" },
};

/**
 * Active proposal states for filtering
 */
export const ACTIVE_PROPOSAL_STATES = ["active", "pending", "queued"] as const;

/**
 * Checks if a proposal status is considered active
 */
export function isActiveProposalStatus(status: string): boolean {
  return ACTIVE_PROPOSAL_STATES.includes(
    status as (typeof ACTIVE_PROPOSAL_STATES)[number]
  );
}
