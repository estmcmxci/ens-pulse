"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  Widget,
  WidgetHeader,
  WidgetTitle,
  WidgetContent,
} from "@/shared/components/widgets";
import { useDelegates } from "@/shared/hooks/use-api-data";
import { formatVotingPower } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════════
   DELEGATES WIDGET — Top delegates with voting power
   ═══════════════════════════════════════════════════════════════════════════ */

export function DelegatesWidget() {
  const { data, isLoading, error } = useDelegates(100);

  const delegates = data?.delegates ?? [];
  const totalDelegates = data?.totalDelegates ?? 0;

  return (
    <Widget tooltip="Top delegates by voting power and delegator count.">
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
            <div className="grid grid-cols-12 gap-2 text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide px-2 pb-1 border-b border-[var(--color-border-subtle)] shrink-0 min-w-[400px]">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Delegate</div>
              <div className="col-span-4 text-right">Voting Power</div>
              <div className="col-span-2 text-right hidden sm:block">Delegators</div>
            </div>

            {/* Scrollable delegate rows */}
            <div className="flex-1 overflow-y-auto overflow-x-auto scroll-container">
              <div className="space-y-1 pt-1 min-w-[400px]">
                {delegates.slice(0, 100).map((delegate, index) => (
                  <Link
                    key={delegate.address}
                    href={`https://tally.xyz/gov/ens/delegate/${delegate.address}`}
                    target="_blank"
                    className="grid grid-cols-12 gap-2 items-center py-1.5 px-2 rounded hover:bg-[var(--color-bg-elevated)] transition-all duration-200"
                  >
                    <div className={cn(
                      "col-span-1 text-xs tabular-nums",
                      index < 3 ? "rank-top" : "text-[var(--color-text-tertiary)]"
                    )}>
                      {index + 1}
                    </div>
                    <div className="col-span-5 sm:col-span-5 flex items-center gap-2 min-w-0">
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
                      <span className="text-[10px] text-[var(--color-text-tertiary)] ml-1 hidden sm:inline">
                        ({delegate.votingPowerPercent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="col-span-2 text-right text-xs text-[var(--color-text-secondary)] tabular-nums hidden sm:block">
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

export default DelegatesWidget;
