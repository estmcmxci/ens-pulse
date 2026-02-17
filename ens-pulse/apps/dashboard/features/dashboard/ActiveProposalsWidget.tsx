"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  Widget,
  WidgetHeader,
  WidgetTitle,
  WidgetContent,
} from "@/shared/components/widgets";
import { useProposals } from "@/shared/hooks/use-api-data";
import {
  formatTimeAgo,
  extractSummary,
  getVotePercent,
  PROPOSAL_STATUS_CONFIG,
  isActiveProposalStatus,
} from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════════
   PROPOSALS WIDGET — Arkham-style scrollable feed with AI summaries
   ═══════════════════════════════════════════════════════════════════════════ */

export function ActiveProposalsWidget() {
  const { data, isLoading, error } = useProposals(undefined, 20);

  const proposals = data?.proposals ?? [];
  const totalCount = data?.totalCount ?? 0;

  // Memoized: Sort proposals and pre-calculate vote percentages
  const processedProposals = useMemo(() => {
    return [...proposals]
      .sort((a, b) => {
        const aActive = isActiveProposalStatus(a.status);
        const bActive = isActiveProposalStatus(b.status);
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        // Then by createdAt (newest first)
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .map((proposal) => ({
        ...proposal,
        votePercent: getVotePercent(proposal.votes),
        isActive: isActiveProposalStatus(proposal.status),
      }));
  }, [proposals]);

  return (
    <Widget>
      <WidgetHeader>
        <WidgetTitle>PROPOSALS</WidgetTitle>
        <div className="flex items-center gap-2">
          {/* Count badge */}
          <span className="text-xs font-medium text-[var(--color-text-tertiary)] bg-[var(--color-bg-raised)] px-2 py-0.5 rounded">
            {totalCount}
          </span>
          <Link href="https://tally.xyz/gov/ens" target="_blank" className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]">
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </WidgetHeader>
      <WidgetContent padding="none">
        {isLoading ? (
          <div className="p-3 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-3 w-16 bg-[var(--color-bg-raised)] rounded mb-2" />
                <div className="h-4 w-full bg-[var(--color-bg-raised)] rounded mb-1" />
                <div className="h-3 w-3/4 bg-[var(--color-bg-raised)] rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-3 text-sm text-[var(--color-negative)]">Failed to load proposals</div>
        ) : (
          <div className="flex flex-col h-[400px]">
            {/* Scrollable proposals list */}
            <div className="flex-1 overflow-y-auto scroll-container">
              <div className="divide-y divide-[var(--color-border-subtle)]">
                {processedProposals.map((proposal) => (
                  <Link
                    key={proposal.id}
                    href={`https://tally.xyz/gov/ens/proposal/${proposal.onchainId}`}
                    target="_blank"
                    className="block p-3 hover:bg-[var(--color-bg-raised)] transition-colors"
                  >
                    {/* Status label */}
                    <div className="label mb-1">
                      {PROPOSAL_STATUS_CONFIG[proposal.status]?.label}
                    </div>

                    {/* Title */}
                    <div className="text-sm font-medium text-[var(--color-text-primary)] line-clamp-2 mb-1">
                      {proposal.title}
                    </div>

                    {/* Summary or truncated description */}
                    <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mb-2">
                      {proposal.summary || extractSummary(proposal.description)}
                    </p>

                    {/* Bottom row: Status badge + Time ago */}
                    <div className="flex items-center justify-between">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", PROPOSAL_STATUS_CONFIG[proposal.status]?.color)}>
                        {PROPOSAL_STATUS_CONFIG[proposal.status]?.label}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {formatTimeAgo(proposal.createdAt)}
                      </span>
                    </div>

                    {/* Vote bar for active proposals */}
                    {proposal.isActive && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-[var(--color-bg-base)] rounded-full overflow-hidden flex">
                          <div className="h-full bg-[var(--color-positive)]" style={{ width: `${proposal.votePercent.for}%` }} />
                          <div className="h-full bg-[var(--color-negative)]" style={{ width: `${proposal.votePercent.against}%` }} />
                        </div>
                        <span className="text-[10px] text-[var(--color-text-tertiary)] tabular-nums">
                          {proposal.votePercent.for}% For
                        </span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Footer - fixed at bottom */}
            <Link
              href="https://tally.xyz/gov/ens"
              target="_blank"
              className="block text-center text-xs font-medium text-[var(--color-ens-blue)] hover:text-[var(--color-ens-blue)]/80 py-2 border-t border-[var(--color-border-subtle)] shrink-0"
            >
              View all proposals →
            </Link>
          </div>
        )}
      </WidgetContent>
    </Widget>
  );
}

export default ActiveProposalsWidget;
