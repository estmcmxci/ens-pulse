"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  Widget,
  WidgetHeader,
  WidgetTitle,
  WidgetContent,
} from "@/shared/components/widgets";
import { Badge } from "@/shared/components/ui/Badge";
import {
  useTreasuryOverview,
  useMarketData,
  useUpcomingMeetings,
  useEnsStats,
  useFinancials,
  useProposals,
  useDelegates,
  useDiscourseFeed,
  useSocialFeed,
  useSignalsTicker,
} from "@/shared/hooks/use-api-data";
import { cn } from "@/shared/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════════
   ENS PULSE — World Monitor
   Single-page real-time context dashboard for ENS governance decisions
   ═══════════════════════════════════════════════════════════════════════════ */

export default function WorldMonitor() {
  return (
    <div className="space-y-3 pb-10"> {/* pb-10 for ticker clearance */}
      {/* ════════════════════════════════════════════════════════════════════
          HEADER — Logo left, prices right
          ════════════════════════════════════════════════════════════════════ */}
      <Header />

      {/* ════════════════════════════════════════════════════════════════════
          ROW 1: ETH | ENS | TREASURY (3 columns)
          ════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-3 gap-3">
        <PriceWidget symbol="ETH" />
        <PriceWidget symbol="ENS" />
        <TotalAssetsWidget />
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ROW 2: PROPOSALS (1 col) | DELEGATES (3 cols)
          ════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-4 gap-3">
        <ActiveProposalsWidget />
        <div className="col-span-3">
          <DelegatesWidget />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ROW 3: ATTACK PROFITABILITY ANALYSIS (full width)
          ════════════════════════════════════════════════════════════════════ */}
      <AttackAnalysisWidget />

      {/* ════════════════════════════════════════════════════════════════════
          ROW 4: PROTOCOL METRICS (ENS Stats + Financials)
          ════════════════════════════════════════════════════════════════════ */}
      <Widget>
        <WidgetHeader>
          <WidgetTitle>PROTOCOL METRICS</WidgetTitle>
          <span className="text-xs text-[var(--color-text-tertiary)]">
            30D = 30-day change compared to previous period
          </span>
        </WidgetHeader>
        <WidgetContent padding="sm">
          <div className="space-y-3">
            <ENSStatsGrid />
            <FinancialsGrid />
          </div>
        </WidgetContent>
      </Widget>

      {/* ════════════════════════════════════════════════════════════════════
          ROW 3: TREASURY (2 col) | UPCOMING MEETINGS (2 col)
          ════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3">
        <TreasuryWidget />
        <MeetingsWidget />
      </div>


      {/* ════════════════════════════════════════════════════════════════════
          ROW: DISCOURSE FEED (1 col) | SOCIAL FEED (1 col)
          ════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3">
        <DiscourseFeedWidget />
        <SocialFeedWidget />
      </div>


      {/* ════════════════════════════════════════════════════════════════════
          FLOATING SIGNALS TICKER
          ════════════════════════════════════════════════════════════════════ */}
      <SignalsTicker />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HEADER — ENS PULSE left, prices right
   ═══════════════════════════════════════════════════════════════════════════ */

function Header() {
  const { data: marketData } = useMarketData();

  const ethPrice = marketData?.prices?.eth?.current_price || 0;
  const ensPrice = marketData?.prices?.ens?.current_price || 0;

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-md bg-gradient-to-br from-[var(--color-ens-blue)] to-[var(--color-ens-purple)] flex items-center justify-center p-1.5">
          <img src="/ens-icon.svg" alt="ENS" className="w-full h-full" />
        </div>
        <span className="text-lg font-bold text-[var(--color-text-primary)]">
          PULSE
        </span>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <span className="text-[var(--color-text-secondary)]">
          ETH <span className="font-medium text-[var(--color-text-primary)]">${ethPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </span>
        <span className="text-[var(--color-text-secondary)]">
          ENS <span className="font-medium text-[var(--color-text-primary)]">${ensPrice.toFixed(2)}</span>
        </span>
        <Badge variant="success" size="sm" dot>Live</Badge>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRICE WIDGET — Arkham-style token price with range bar
   ═══════════════════════════════════════════════════════════════════════════ */

function PriceWidget({ symbol }: { symbol: "ETH" | "ENS" }) {
  const { data, isLoading } = useMarketData();

  const tokenId = symbol === "ETH" ? "eth" : "ens";
  const tokenName = symbol === "ETH" ? "Ethereum" : "ENS";
  const priceData = data?.prices?.[tokenId as keyof typeof data.prices];

  const price = priceData?.current_price || 0;
  const change1d = priceData?.price_change_percentage_24h || 0;
  const change7d = priceData?.price_change_percentage_7d || 0;
  const volume = priceData?.total_volume || 0;
  const high24h = priceData?.high_24h || 0;
  const low24h = priceData?.low_24h || 0;
  const icon = priceData?.image;

  return (
    <Widget>
      <WidgetContent padding="md">
        {isLoading ? (
          <div className="h-32 flex items-center justify-center text-[var(--color-text-muted)]">...</div>
        ) : (
          <>
            {/* Token Header: Icon + Name */}
            <div className="flex items-center gap-3 mb-2">
              {icon ? (
                <img src={icon} alt={symbol} className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-ens-blue)] to-[var(--color-ens-purple)] flex items-center justify-center text-sm font-bold text-white">
                  {symbol.charAt(0)}
                </div>
              )}
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                {tokenName}
              </span>
            </div>

            {/* Price */}
            <div className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums tracking-tight mb-4">
              ${symbol === "ETH"
                ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : price.toFixed(2)}
            </div>

            {/* Volume & Change Indicators Row */}
            <div className="flex items-end justify-between mb-4">
              {/* 24h Volume */}
              <div>
                <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-0.5">
                  24h volume
                </div>
                <div className="text-sm font-medium text-[var(--color-text-primary)] tabular-nums">
                  ${formatLargeNumber(volume)}
                </div>
              </div>

              {/* 1D & 7D Change Indicators */}
              <div className="flex items-end gap-6">
                <div className="text-right">
                  <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-0.5">1D</div>
                  <div className={cn(
                    "text-sm font-medium tabular-nums",
                    change1d >= 0 ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]"
                  )}>
                    {change1d >= 0 ? "+" : ""}{change1d.toFixed(1)}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-0.5">7D</div>
                  <div className={cn(
                    "text-sm font-medium tabular-nums",
                    change7d >= 0 ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]"
                  )}>
                    {change7d >= 0 ? "+" : ""}{change7d.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Price Range Bar */}
            {high24h > 0 && low24h > 0 && (
              <PriceRangeBar current={price} high={high24h} low={low24h} />
            )}
          </>
        )}
      </WidgetContent>
    </Widget>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Price Range Bar — Shows current price position within 24h range
   ═══════════════════════════════════════════════════════════════════════════ */

function PriceRangeBar({ current, high, low }: { current: number; high: number; low: number }) {
  const range = high - low;
  const position = range > 0 ? ((current - low) / range) * 100 : 50;
  const clampedPosition = Math.max(0, Math.min(100, position));

  const formatRangePrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(4);
  };

  return (
    <div>
      <div className="relative h-1.5 bg-[var(--color-bg-raised)] rounded-full">
        <div
          className="absolute h-full bg-gradient-to-r from-[var(--color-text-tertiary)] to-[var(--color-text-secondary)] rounded-full"
          style={{ width: `${clampedPosition}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[var(--color-text-primary)] rounded-full border-2 border-[var(--color-bg-raised)]"
          style={{ left: `${clampedPosition}%`, marginLeft: "-5px" }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-xs text-[var(--color-text-muted)] tabular-nums">
        <span>{formatRangePrice(low)}</span>
        <span>{formatRangePrice(high)}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Change Bar — Shows delta from center (negative left, positive right)
   ═══════════════════════════════════════════════════════════════════════════ */

function ChangeBar({ deltaPercent }: { deltaPercent: number }) {
  // Clamp to -50% to +50% for visualization
  const clampedDelta = Math.max(-50, Math.min(50, deltaPercent));
  const isPositive = deltaPercent >= 0;

  // Calculate bar width (percentage of half the bar)
  const barWidth = Math.abs(clampedDelta) * 2; // Scale so 50% change = full half

  return (
    <div>
      <div className="relative h-1.5 bg-[var(--color-bg-raised)] rounded-full overflow-hidden">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--color-border-default)]" />

        {/* Change bar */}
        <div
          className={cn(
            "absolute h-full rounded-full",
            isPositive ? "bg-[var(--color-positive)]" : "bg-[var(--color-negative)]"
          )}
          style={{
            width: `${barWidth}%`,
            left: isPositive ? "50%" : `${50 - barWidth}%`,
          }}
        />

        {/* Marker dot */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-[var(--color-bg-raised)]",
            isPositive ? "bg-[var(--color-positive)]" : "bg-[var(--color-negative)]"
          )}
          style={{
            left: `${50 + clampedDelta}%`,
            marginLeft: "-5px"
          }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-1.5 text-xs text-[var(--color-text-muted)] tabular-nums">
        <span>-50%</span>
        <span>0%</span>
        <span>+50%</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TOTAL ASSETS WIDGET — Treasury AUM from Steakhouse Dune
   ═══════════════════════════════════════════════════════════════════════════ */

function TotalAssetsWidget() {
  const { data, isLoading } = useFinancials();

  const totalAssets = data?.totalAssets?.value || 0;
  const deltaPercent = data?.totalAssets?.deltaPercent || 0;
  const isPositive = deltaPercent >= 0;

  // Format large numbers
  const formatValue = (value: number) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toFixed(0);
  };

  return (
    <Widget>
      <WidgetContent padding="md">
        {isLoading ? (
          <div className="h-32 flex items-center justify-center text-[var(--color-text-muted)]">...</div>
        ) : (
          <>
            {/* Header with icon */}
            <div className="flex items-center gap-3 mb-2">
              <img
                src="/dao-icon.svg"
                alt="DAO"
                className="w-10 h-10 rounded-full"
              />
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                Treasury AUM
              </span>
            </div>

            {/* Total Assets Value */}
            <div className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums tracking-tight mb-4">
              ${formatValue(totalAssets)}
            </div>

            {/* Change indicators row */}
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-0.5">
                  30d change
                </div>
                <div className={cn(
                  "text-sm font-medium tabular-nums",
                  isPositive ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]"
                )}>
                  {isPositive ? "+" : ""}{deltaPercent.toFixed(1)}%
                </div>
              </div>

              {/* Source badge */}
              <div className="text-[10px] text-[var(--color-text-muted)]">
                via Steakhouse
              </div>
            </div>

            {/* Change bar - centered with +/- from middle */}
            <ChangeBar deltaPercent={deltaPercent} />
          </>
        )}
      </WidgetContent>
    </Widget>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROPOSALS WIDGET — Arkham-style scrollable feed with AI summaries
   ═══════════════════════════════════════════════════════════════════════════ */

function ActiveProposalsWidget() {
  const { data, isLoading, error } = useProposals(undefined, 20);

  const proposals = data?.proposals ?? [];
  const totalCount = data?.totalCount ?? 0;

  // Sort: active/pending first, then by date
  const sortedProposals = [...proposals].sort((a, b) => {
    const activeStates = ["active", "pending", "queued"];
    const aActive = activeStates.includes(a.status);
    const bActive = activeStates.includes(b.status);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    // Then by createdAt (newest first)
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  // Status badge colors and labels
  const statusConfig: Record<string, { color: string; label: string }> = {
    active: { color: "bg-[var(--color-info)] text-white", label: "Active" },
    pending: { color: "bg-[var(--color-warning)] text-black", label: "Pending" },
    executed: { color: "bg-[var(--color-positive)] text-white", label: "Executed" },
    succeeded: { color: "bg-[var(--color-positive)] text-white", label: "Passed" },
    defeated: { color: "bg-[var(--color-negative)] text-white", label: "Failed" },
    canceled: { color: "bg-[var(--color-text-tertiary)] text-white", label: "Canceled" },
    expired: { color: "bg-[var(--color-text-tertiary)] text-white", label: "Expired" },
    queued: { color: "bg-[var(--color-warning)] text-black", label: "Queued" },
  };

  // Calculate vote percentages
  const getVotePercent = (proposal: typeof proposals[0]) => {
    const forVotes = BigInt(proposal.votes.for);
    const againstVotes = BigInt(proposal.votes.against);
    const total = forVotes + againstVotes;
    if (total === 0n) return { for: 0, against: 0 };
    return {
      for: Number((forVotes * 100n) / total),
      against: Number((againstVotes * 100n) / total),
    };
  };

  // Format time ago
  const formatTimeAgo = (dateString: string | null) => {
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
  };

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
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-[var(--color-border-subtle)]">
                {sortedProposals.map((proposal) => {
                  const votes = getVotePercent(proposal);
                  const isActive = ["active", "pending", "queued"].includes(proposal.status);

                  return (
                    <Link
                      key={proposal.id}
                      href={`https://tally.xyz/gov/ens/proposal/${proposal.onchainId}`}
                      target="_blank"
                      className="block p-3 hover:bg-[var(--color-bg-raised)] transition-colors"
                    >
                      {/* Status label */}
                      <div className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
                        {statusConfig[proposal.status]?.label}
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
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", statusConfig[proposal.status]?.color)}>
                          {statusConfig[proposal.status]?.label}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          {formatTimeAgo(proposal.createdAt)}
                        </span>
                      </div>

                      {/* Vote bar for active proposals */}
                      {isActive && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1 bg-[var(--color-bg-base)] rounded-full overflow-hidden flex">
                            <div className="h-full bg-[var(--color-positive)]" style={{ width: `${votes.for}%` }} />
                            <div className="h-full bg-[var(--color-negative)]" style={{ width: `${votes.against}%` }} />
                          </div>
                          <span className="text-[10px] text-[var(--color-text-tertiary)] tabular-nums">
                            {votes.for}% For
                          </span>
                        </div>
                      )}
                    </Link>
                  );
                })}
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

/* ═══════════════════════════════════════════════════════════════════════════
   DELEGATES WIDGET — Top delegates with voting power
   ═══════════════════════════════════════════════════════════════════════════ */

function DelegatesWidget() {
  const { data, isLoading, error } = useDelegates(100);

  const delegates = data?.delegates ?? [];
  const totalDelegates = data?.totalDelegates ?? 0;

  // Format voting power for display
  const formatVotingPower = (power: string) => {
    const num = parseFloat(power);
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  return (
    <Widget>
      <WidgetHeader>
        <WidgetTitle>TOP DELEGATES</WidgetTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {totalDelegates.toLocaleString()} total
          </span>
          <Link href="https://tally.xyz/gov/ens/delegates" target="_blank" className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]">
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </WidgetHeader>
      <WidgetContent padding="sm">
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 bg-[var(--color-bg-raised)] rounded" />
            ))}
          </div>
        ) : error ? (
          <div className="text-sm text-[var(--color-negative)]">Failed to load delegates</div>
        ) : (
          <div className="flex flex-col h-[400px]">
            {/* Header row - fixed */}
            <div className="grid grid-cols-12 gap-2 text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide px-2 pb-1 border-b border-[var(--color-border-subtle)] shrink-0">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Delegate</div>
              <div className="col-span-4 text-right">Voting Power</div>
              <div className="col-span-2 text-right">Delegators</div>
            </div>

            {/* Scrollable delegate rows */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-1 pt-1">
                {delegates.slice(0, 100).map((delegate, index) => (
                  <Link
                    key={delegate.address}
                    href={`https://tally.xyz/gov/ens/delegate/${delegate.address}`}
                    target="_blank"
                    className="grid grid-cols-12 gap-2 items-center py-1.5 px-2 rounded hover:bg-[var(--color-bg-raised)] transition-colors"
                  >
                    <div className="col-span-1 text-xs text-[var(--color-text-tertiary)]">
                      {index + 1}
                    </div>
                    <div className="col-span-5 flex items-center gap-2 min-w-0">
                      {delegate.picture ? (
                        <img
                          src={delegate.picture}
                          alt=""
                          className="w-5 h-5 rounded-full shrink-0"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--color-ens-blue)] to-[var(--color-ens-purple)] shrink-0" />
                      )}
                      <span className="text-xs text-[var(--color-text-primary)] truncate">
                        {delegate.ensName || delegate.name || `${delegate.address.slice(0, 6)}...${delegate.address.slice(-4)}`}
                      </span>
                    </div>
                    <div className="col-span-4 text-right">
                      <span className="text-xs font-medium text-[var(--color-text-primary)] tabular-nums">
                        {formatVotingPower(delegate.votingPowerFormatted)}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-tertiary)] ml-1">
                        ({delegate.votingPowerPercent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="col-span-2 text-right text-xs text-[var(--color-text-secondary)] tabular-nums">
                      {delegate.delegatorsCount.toLocaleString()}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* View all link - fixed at bottom */}
            <Link
              href="https://tally.xyz/gov/ens/delegates"
              target="_blank"
              className="block text-center text-xs font-medium text-[var(--color-ens-blue)] hover:text-[var(--color-ens-blue)]/80 py-2 border-t border-[var(--color-border-subtle)] shrink-0"
            >
              View all delegates →
            </Link>
          </div>
        )}
      </WidgetContent>
    </Widget>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ATTACK PROFITABILITY ANALYSIS WIDGET
   Calculates economic security of the DAO based on treasury value vs attack cost
   ═══════════════════════════════════════════════════════════════════════════ */

function AttackAnalysisWidget() {
  const { data: treasuryData, isLoading: treasuryLoading } = useTreasuryOverview();
  const { data: marketData, isLoading: marketLoading } = useMarketData();
  const { data: delegatesData, isLoading: delegatesLoading } = useDelegates(1);
  const { data: financialsData } = useFinancials();

  const isLoading = treasuryLoading || marketLoading || delegatesLoading;

  // Get prices
  const ethPrice = marketData?.prices?.eth?.current_price || 0;
  const ensPrice = marketData?.prices?.ens?.current_price || 0;

  // Calculate treasury value
  const treasuryTotals = treasuryData?.totals;
  const ethBalance = treasuryTotals ? Number(treasuryTotals.ethBalance) / 1e18 : 0;
  const ensBalance = treasuryTotals ? Number(treasuryTotals.ensBalance) / 1e18 : 0;
  const usdcBalance = treasuryTotals ? Number(treasuryTotals.usdcBalance) / 1e6 : 0;

  // Treasury value from our calculated balances
  const treasuryValueUsd = (ethBalance * ethPrice) + (ensBalance * ensPrice) + usdcBalance;

  // Use Steakhouse total assets if available (includes all assets)
  const totalAssetsUsd = financialsData?.totalAssets?.value || treasuryValueUsd;

  // Governance parameters
  const totalSupply = delegatesData?.totalSupply ? Number(delegatesData.totalSupply) / 1e18 : 0;
  const totalDelegatedVotes = delegatesData?.totalDelegatesVotesCount
    ? Number(delegatesData.totalDelegatesVotesCount) / 1e18
    : 0;
  const quorum = delegatesData?.quorum ? Number(delegatesData.quorum) / 1e18 : 0;

  // Calculate attack economics
  const MAJORITY_PCT = 0.5; // 50% needed to pass
  const quorumPct = totalSupply > 0 ? quorum / totalSupply : 0;

  // Votes needed = max(quorum, totalDelegatedVotes * majority)
  // This represents the worst case: either meet quorum OR beat majority of all possible votes
  const votesNeededWorstCase = Math.max(quorum, totalDelegatedVotes * MAJORITY_PCT);
  const votesNeededBestCase = quorum; // If no one else votes

  // Attack costs
  const attackCostWorstCase = votesNeededWorstCase * ensPrice;
  const attackCostBestCase = votesNeededBestCase * ensPrice;

  // Incentive multiples (how many times over the attack cost is the treasury)
  const incentiveMultipleWorstCase = attackCostWorstCase > 0 ? totalAssetsUsd / attackCostWorstCase : 0;
  const incentiveMultipleBestCase = attackCostBestCase > 0 ? totalAssetsUsd / attackCostBestCase : 0;

  // Risk assessment based on worst case
  const getRiskLabel = (multiple: number): { label: string; color: string; description: string } => {
    if (multiple > 1) {
      return {
        label: "Economically Attackable",
        color: "var(--color-negative)",
        description: `Treasury is ${multiple.toFixed(1)}× the attack cost`,
      };
    } else if (multiple === 1) {
      return {
        label: "Neutral",
        color: "var(--color-warning)",
        description: "Treasury equals attack cost",
      };
    } else {
      return {
        label: "Economically Secure",
        color: "var(--color-positive)",
        description: `Attack costs ${(1 / multiple).toFixed(1)}× the treasury value`,
      };
    }
  };

  const riskAssessment = getRiskLabel(incentiveMultipleWorstCase);

  return (
    <Widget>
      <WidgetHeader>
        <WidgetTitle>ATTACK PROFITABILITY ANALYSIS</WidgetTitle>
        <div
          className="text-xs font-medium px-2 py-0.5 rounded"
          style={{
            backgroundColor: `color-mix(in srgb, ${riskAssessment.color} 20%, transparent)`,
            color: riskAssessment.color
          }}
        >
          {riskAssessment.label}
        </div>
      </WidgetHeader>
      <WidgetContent padding="sm">
        {isLoading ? (
          <div className="h-20 flex items-center justify-center text-[var(--color-text-muted)]">
            Calculating attack economics...
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            {/* Treasury Value */}
            <div>
              <div className="text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-1">
                Treasury Value
              </div>
              <div className="text-xl font-bold text-[var(--color-text-primary)] tabular-nums">
                ${formatLargeNumber(totalAssetsUsd)}
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Total DAO assets
              </div>
            </div>

            {/* Attack Cost (Worst Case) */}
            <div>
              <div className="text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-1">
                Attack Cost (Worst Case)
              </div>
              <div className="text-xl font-bold text-[var(--color-text-primary)] tabular-nums">
                ${formatLargeNumber(attackCostWorstCase)}
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {formatLargeNumber(votesNeededWorstCase)} ENS @ ${ensPrice.toFixed(2)}
              </div>
            </div>

            {/* Incentive Multiple */}
            <div>
              <div className="text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-1">
                Incentive Multiple
              </div>
              <div
                className="text-xl font-bold tabular-nums"
                style={{ color: riskAssessment.color }}
              >
                {incentiveMultipleWorstCase.toFixed(2)}×
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Treasury ÷ Attack Cost
              </div>
            </div>

            {/* Governance Parameters */}
            <div>
              <div className="text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-1">
                Governance Parameters
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Quorum</span>
                  <span className="text-[var(--color-text-primary)] tabular-nums">
                    {formatLargeNumber(quorum)} ({(quorumPct * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Delegated</span>
                  <span className="text-[var(--color-text-primary)] tabular-nums">
                    {formatLargeNumber(totalDelegatedVotes)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Majority</span>
                  <span className="text-[var(--color-text-primary)] tabular-nums">50%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formula explanation */}
        {!isLoading && (
          <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-muted)]">
                Votes needed = max(quorum, delegated × 50%) = {formatLargeNumber(votesNeededWorstCase)} ENS
              </span>
              <span className="text-[var(--color-text-tertiary)]">
                Best case (quorum only): ${formatLargeNumber(attackCostBestCase)} ({incentiveMultipleBestCase.toFixed(2)}×)
              </span>
            </div>
          </div>
        )}
      </WidgetContent>
    </Widget>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ENS STATS WIDGET — Arkham-style stat cards from Dune Analytics
   ═══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════
   Mini Change Bar — Compact version of the change indicator
   ═══════════════════════════════════════════════════════════════════════════ */

function MiniChangeBar({ deltaPercent }: { deltaPercent: number }) {
  const clampedDelta = Math.max(-50, Math.min(50, deltaPercent));
  const isPositive = deltaPercent >= 0;
  const barWidth = Math.abs(clampedDelta) * 2;

  return (
    <div className="relative h-1 bg-[var(--color-bg-raised)] rounded-full overflow-hidden">
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--color-border-subtle)]" />
      <div
        className={cn(
          "absolute h-full rounded-full",
          isPositive ? "bg-[var(--color-positive)]" : "bg-[var(--color-negative)]"
        )}
        style={{
          width: `${barWidth}%`,
          left: isPositive ? "50%" : `${50 - barWidth}%`,
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ENS STATS GRID — For nesting inside Protocol Metrics widget
   ═══════════════════════════════════════════════════════════════════════════ */

function ENSStatsGrid() {
  const { data, isLoading } = useEnsStats();
  const { data: financialsData, isLoading: financialsLoading } = useFinancials();

  const stats = [
    { label: "Total Names", metric: data?.totalEnsCreated },
    { label: "Participants", metric: data?.uniqueParticipants },
    { label: "Primary Names", metric: data?.totalPrimaryNames },
    { label: "Monthly Regs", metric: data?.monthlyRegistrations },
    { label: "Daily Regs", metric: financialsData?.dailyRegistrations },
    { label: "New Addresses", metric: data?.monthlyNewAddresses },
  ];

  const allLoading = isLoading || financialsLoading;

  if (allLoading) {
    return (
      <div className="grid grid-cols-6 gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-3 rounded-lg bg-[var(--color-bg-raised)] border border-[var(--color-border-subtle)]">
            <div className="animate-pulse space-y-2">
              <div className="h-2 w-12 bg-[var(--color-bg-base)] rounded" />
              <div className="h-5 w-14 bg-[var(--color-bg-base)] rounded" />
              <div className="h-2 w-10 bg-[var(--color-bg-base)] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-6 gap-2">
      {stats.map((stat) => {
        const value = stat.metric?.value;
        const deltaPercent = stat.metric?.deltaPercent ?? null;
        const isPositive = deltaPercent !== null && deltaPercent >= 0;

        return (
          <div key={stat.label} className="p-3 rounded-lg bg-[var(--color-bg-raised)] border border-[var(--color-border-subtle)]">
            <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
              {stat.label}
            </div>
            <div className="text-lg font-bold text-[var(--color-text-primary)] tabular-nums tracking-tight mb-2">
              {value != null ? formatLargeNumber(value) : "—"}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-[9px] text-[var(--color-text-muted)] uppercase">30d</div>
              {deltaPercent !== null ? (
                <div className={cn(
                  "text-xs font-medium tabular-nums",
                  isPositive ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]"
                )}>
                  {isPositive ? "+" : ""}{deltaPercent.toFixed(1)}%
                </div>
              ) : (
                <div className="text-xs text-[var(--color-text-muted)]">—</div>
              )}
            </div>
            {deltaPercent !== null && (
              <div className="mt-1.5">
                <MiniChangeBar deltaPercent={deltaPercent} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FINANCIALS GRID — For nesting inside Protocol Metrics widget
   ═══════════════════════════════════════════════════════════════════════════ */

function FinancialsGrid() {
  const { data, isLoading } = useFinancials();

  const metrics = [
    { label: "Daily Revenue", value: data?.dailyRevenue?.value, delta: data?.dailyRevenue?.deltaPercent, prefix: "$" },
    { label: "Monthly Revenue", value: data?.monthlyRevenue?.value, delta: data?.monthlyRevenue?.deltaPercent, prefix: "$" },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[1, 2].map((i) => (
          <div key={i} className="p-3 rounded-lg bg-[var(--color-bg-raised)] border border-[var(--color-border-subtle)]">
            <div className="animate-pulse space-y-2">
              <div className="h-2 w-16 bg-[var(--color-bg-base)] rounded" />
              <div className="h-5 w-20 bg-[var(--color-bg-base)] rounded" />
              <div className="h-2 w-12 bg-[var(--color-bg-base)] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {metrics.map((metric) => {
        const isPositive = metric.delta !== null && metric.delta !== undefined && metric.delta >= 0;
        const displayValue = metric.value != null ? `${metric.prefix}${formatLargeNumber(metric.value)}` : "—";

        return (
          <div key={metric.label} className="p-3 rounded-lg bg-[var(--color-bg-raised)] border border-[var(--color-border-subtle)]">
            <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
              {metric.label}
            </div>
            <div className="text-lg font-bold text-[var(--color-text-primary)] tabular-nums tracking-tight mb-2">
              {displayValue}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-[9px] text-[var(--color-text-muted)] uppercase">30d</div>
              {metric.delta !== null && metric.delta !== undefined ? (
                <div className={cn(
                  "text-xs font-medium tabular-nums",
                  isPositive ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]"
                )}>
                  {isPositive ? "+" : ""}{metric.delta.toFixed(1)}%
                </div>
              ) : (
                <div className="text-xs text-[var(--color-text-muted)]">—</div>
              )}
            </div>
            {metric.delta !== null && metric.delta !== undefined && (
              <div className="mt-1.5">
                <MiniChangeBar deltaPercent={metric.delta} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TREASURY WIDGET — Asset breakdown table for 5 primary wallets
   ═══════════════════════════════════════════════════════════════════════════ */

function TreasuryWidget() {
  const { data, isLoading } = useTreasuryOverview();
  const { data: marketData } = useMarketData();

  const ethPrice = data?.ethPrice || marketData?.prices?.eth?.current_price || 3000;
  const ensPrice = marketData?.prices?.ens?.current_price || 10;

  // Process wallet data with asset breakdown
  const wallets = data?.multisigs || [];
  const walletData = wallets.map((ms) => {
    const eth = Number(ms.calculatedBalances?.ethBalance || 0) / 1e18;
    const ens = Number(ms.calculatedBalances?.ensBalance || 0) / 1e18;
    const usdc = Number(ms.calculatedBalances?.usdcBalance || 0) / 1e6;
    const total = eth * ethPrice + ens * ensPrice + usdc;

    return {
      name: ms.name || "Unknown",
      address: ms.address,
      addressShort: `${ms.address.slice(0, 6)}...${ms.address.slice(-4)}`,
      eth,
      ens,
      usdc,
      total,
    };
  });

  // Sort by total value descending
  walletData.sort((a, b) => b.total - a.total);

  const grandTotal = walletData.reduce((sum, w) => sum + w.total, 0);

  return (
    <Widget>
      <WidgetHeader>
        <WidgetTitle>TREASURY</WidgetTitle>
        <span className="text-lg font-bold text-[var(--color-text-primary)] tabular-nums">
          ${formatLargeNumber(grandTotal)}
        </span>
      </WidgetHeader>
      <WidgetContent padding="sm">
        {isLoading ? (
          <div className="h-32 flex items-center justify-center text-[var(--color-text-muted)]">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border-subtle)]">
                  <th className="text-left py-1.5 font-medium">Wallet</th>
                  <th className="text-right py-1.5 font-medium">ETH</th>
                  <th className="text-right py-1.5 font-medium">USDC</th>
                  <th className="text-right py-1.5 font-medium">ENS</th>
                  <th className="text-right py-1.5 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {walletData.map((wallet) => (
                  <tr key={wallet.address} className="border-b border-[var(--color-border-subtle)] last:border-0">
                    <td className="py-1.5">
                      <Link
                        href={`https://etherscan.io/address/${wallet.address}`}
                        target="_blank"
                        className="flex items-center gap-1.5 hover:text-[var(--color-ens-blue)] transition-colors"
                      >
                        <span className="text-[var(--color-text-secondary)]">{wallet.name}</span>
                        <span className="text-[var(--color-text-muted)] font-mono text-[10px]">{wallet.addressShort}</span>
                      </Link>
                    </td>
                    <td className="py-1.5 text-right text-[var(--color-text-primary)] tabular-nums">
                      {wallet.eth > 0 ? formatCompact(wallet.eth) : "—"}
                    </td>
                    <td className="py-1.5 text-right text-[var(--color-text-primary)] tabular-nums">
                      {wallet.usdc > 0 ? `$${formatCompact(wallet.usdc)}` : "—"}
                    </td>
                    <td className="py-1.5 text-right text-[var(--color-text-primary)] tabular-nums">
                      {wallet.ens > 0 ? formatCompact(wallet.ens) : "—"}
                    </td>
                    <td className="py-1.5 text-right text-[var(--color-text-primary)] tabular-nums font-medium">
                      ${formatLargeNumber(wallet.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </WidgetContent>
    </Widget>
  );
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  if (value >= 1) return value.toFixed(1);
  return value.toFixed(2);
}

/* ═══════════════════════════════════════════════════════════════════════════
   MEETINGS WIDGET
   ═══════════════════════════════════════════════════════════════════════════ */

function MeetingsWidget() {
  const { data, isLoading } = useUpcomingMeetings();

  const meetings = data?.meetings || [];

  return (
    <Widget>
      <WidgetHeader>
        <WidgetTitle>CALENDAR</WidgetTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-tertiary)]">Next 30 days</span>
          <Link
            href="https://calendar.google.com/calendar/embed?src=8im77u2b3euav0qjc067qb00ic%40group.calendar.google.com"
            target="_blank"
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </WidgetHeader>
      <WidgetContent padding="sm">
        {isLoading ? (
          <div className="h-32 flex items-center justify-center text-[var(--color-text-muted)]">Loading...</div>
        ) : meetings.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-sm text-[var(--color-text-muted)]">
            No upcoming meetings
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border-subtle)]">
                  <th className="text-left py-1.5 font-medium">Date</th>
                  <th className="text-right py-1.5 font-medium">Time (EST)</th>
                  <th className="text-right py-1.5 font-medium">Meeting</th>
                </tr>
              </thead>
              <tbody>
                {meetings.slice(0, 15).map((meeting: any) => {
                  const date = new Date(meeting.start);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isTomorrow = date.toDateString() === new Date(Date.now() + 86400000).toDateString();
                  const dayLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                  const timeLabel = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

                  return (
                    <tr key={meeting.id} className="border-b border-[var(--color-border-subtle)] last:border-0">
                      <td className="py-1.5 text-[var(--color-text-secondary)]">
                        {dayLabel}
                      </td>
                      <td className="py-1.5 text-right text-[var(--color-text-primary)] tabular-nums">
                        {timeLabel}
                      </td>
                      <td className="py-1.5 text-right text-[var(--color-text-primary)] truncate max-w-[150px]">
                        {meeting.title}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </WidgetContent>
    </Widget>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   DISCOURSE FEED WIDGET — Forum discussions from last 7 days (table format)
   ═══════════════════════════════════════════════════════════════════════════ */

function DiscourseFeedWidget() {
  const { data, isLoading, error } = useDiscourseFeed(10, 7); // Last 7 days of activity

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1d ago";
    return `${diffDays}d ago`;
  };

  return (
    <Widget>
      <WidgetHeader>
        <WidgetTitle>FORUM</WidgetTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-tertiary)]">Last 7 days</span>
          <Link
            href="https://discuss.ens.domains"
            target="_blank"
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </WidgetHeader>
      <WidgetContent padding="sm">
        {isLoading ? (
          <div className="h-32 flex items-center justify-center text-[var(--color-text-muted)]">Loading...</div>
        ) : error ? (
          <div className="text-sm text-[var(--color-negative)]">Failed to load</div>
        ) : data?.items.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-sm text-[var(--color-text-muted)]">
            No discussions in the last 7 days
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[var(--color-bg-raised)]">
                <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border-subtle)]">
                  <th className="text-left py-1.5 font-medium">Topic</th>
                  <th className="text-right py-1.5 font-medium w-16">Replies</th>
                  <th className="text-right py-1.5 font-medium w-16">Views</th>
                  <th className="text-right py-1.5 font-medium w-20">Activity</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.slice(0, 10).map((item) => (
                  <tr key={item.id} className="border-b border-[var(--color-border-subtle)] last:border-0 align-top">
                    <td className="py-1.5">
                      <Link
                        href={item.url}
                        target="_blank"
                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-ens-blue)] transition-colors line-clamp-1"
                        title={item.title}
                      >
                        {item.title}
                      </Link>
                      {item.summary && (
                        <p className="text-[10px] text-[var(--color-text-muted)] line-clamp-1 mt-0.5">
                          {item.summary}
                        </p>
                      )}
                    </td>
                    <td className="py-1.5 text-right text-[var(--color-text-primary)] tabular-nums">
                      {item.stats.replies}
                    </td>
                    <td className="py-1.5 text-right text-[var(--color-text-primary)] tabular-nums">
                      {item.stats.views}
                    </td>
                    <td className="py-1.5 text-right text-[var(--color-text-muted)] tabular-nums">
                      {formatTimeAgo(item.lastActivityAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </WidgetContent>
    </Widget>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SOCIAL FEED WIDGET — Twitter/X posts from @ensdomains and @ens_dao (table format)
   ═══════════════════════════════════════════════════════════════════════════ */

function SocialFeedWidget() {
  const { data, isLoading, error } = useSocialFeed(10); // 10 most recent tweets

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1d ago";
    return `${diffDays}d ago`;
  };

  return (
    <Widget>
      <WidgetHeader>
        <WidgetTitle>SOCIAL</WidgetTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-tertiary)]">@ensdomains · @ens_dao</span>
          <Link
            href="https://x.com/ensdomains"
            target="_blank"
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </WidgetHeader>
      <WidgetContent padding="sm">
        {isLoading ? (
          <div className="h-32 flex items-center justify-center text-[var(--color-text-muted)]">Loading...</div>
        ) : error ? (
          <div className="text-sm text-[var(--color-negative)]">Failed to load</div>
        ) : data?.items.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-sm text-[var(--color-text-muted)]">
            No recent tweets
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[var(--color-bg-raised)]">
                <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border-subtle)]">
                  <th className="text-left py-1.5 font-medium">Post</th>
                  <th className="text-right py-1.5 font-medium w-24">Author</th>
                  <th className="text-right py-1.5 font-medium w-12">Likes</th>
                  <th className="text-right py-1.5 font-medium w-12">RTs</th>
                  <th className="text-right py-1.5 font-medium w-20">Posted</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.slice(0, 10).map((item) => (
                  <tr key={item.id} className="border-b border-[var(--color-border-subtle)] last:border-0 align-top">
                    <td className="py-1.5">
                      <Link
                        href={item.url}
                        target="_blank"
                        className="block hover:text-[var(--color-ens-blue)] transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          {item.summary ? (
                            <span className="text-[var(--color-text-secondary)] line-clamp-1">
                              {item.summary}
                            </span>
                          ) : (
                            <span className="text-[var(--color-text-muted)] line-clamp-1">
                              {item.content?.text?.slice(0, 100) || "—"}
                            </span>
                          )}
                          {item.isRetweet && (
                            <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">RT</span>
                          )}
                          {item.isAnnouncement && (
                            <span className="text-[10px] px-1 py-0.5 rounded bg-[var(--color-info)]/20 text-[var(--color-info)] shrink-0">
                              Announce
                            </span>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="py-1.5 text-right text-[var(--color-text-muted)]">
                      @{item.author.handle}
                    </td>
                    <td className="py-1.5 text-right text-[var(--color-text-primary)] tabular-nums">
                      {item.stats.likes}
                    </td>
                    <td className="py-1.5 text-right text-[var(--color-text-primary)] tabular-nums">
                      {item.stats.retweets}
                    </td>
                    <td className="py-1.5 text-right text-[var(--color-text-muted)] tabular-nums">
                      {formatTimeAgo(item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </WidgetContent>
    </Widget>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SIGNALS TICKER — Floating marquee of ranked governance signals
   ═══════════════════════════════════════════════════════════════════════════ */

function SignalsTicker() {
  const { data, isLoading } = useSignalsTicker();

  if (isLoading || !data?.items?.length) {
    return null; // Don't show empty ticker
  }

  const items = data.items;

  // Duplicate items for seamless loop
  const tickerItems = [...items, ...items];

  // 8 minutes (480 seconds) to cycle through all signals
  const animationDuration = 480;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-bg-raised)] border-t border-[var(--color-border-subtle)]">
      <div className="relative overflow-hidden h-8">
        {/* Gradient fades on edges */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[var(--color-bg-raised)] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[var(--color-bg-raised)] to-transparent z-10" />

        {/* Scrolling content */}
        <div
          className="flex items-center h-full animate-ticker hover:pause-ticker"
          style={{ animationDuration: `${animationDuration}s`, width: 'max-content' }}
        >
          {tickerItems.map((item, index) => (
            <a
              key={`${item.id}-${index}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 shrink-0 hover:bg-[var(--color-bg-raised)] h-full transition-colors"
            >
              {/* Source icon */}
              <span className="text-[var(--color-text-muted)]">
                {item.source === "x" ? (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                ) : item.source === "discourse" ? (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.486 2 2 6.486 2 12c0 5.515 4.486 10 10 10s10-4.485 10-10c0-5.514-4.486-10-10-10zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                  </svg>
                ) : (
                  <span className="w-3 h-3 rounded-full bg-[var(--color-text-muted)]" />
                )}
              </span>

              {/* Headline */}
              <span className="text-[11px] text-[var(--color-text-secondary)] whitespace-nowrap">
                {item.headline}
              </span>

              {/* Separator */}
              <span className="text-[var(--color-border-default)] ml-2">|</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FORMATTERS
   ═══════════════════════════════════════════════════════════════════════════ */

function formatLargeNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

function extractSummary(description: string): string {
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
  const abstractMatch = description.match(/##\s*Abstract\s*\n+([\s\S]*?)(?=\n##|\n\n\n|$)/i);
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
