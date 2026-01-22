"use client";

import { cn } from "@/shared/lib/utils";
import {
  Widget,
  WidgetHeader,
  WidgetTitle,
  WidgetContent,
  WidgetFooter,
} from "./Widget";

/* ═══════════════════════════════════════════════════════════════════
   Treasury Widget — Multisig balance display
   Shows: total balance, token breakdown, pending transactions
   ═══════════════════════════════════════════════════════════════════ */

interface TokenBalance {
  symbol: string;
  icon?: string;
  balance: number;
  valueUsd: number;
}

interface TreasuryWidgetProps {
  name: string;
  address: string;
  totalValueUsd: number;
  tokens: TokenBalance[];
  pendingTxCount?: number;
  onClick?: () => void;
  className?: string;
}

export function TreasuryWidget({
  name,
  address,
  totalValueUsd,
  tokens,
  pendingTxCount = 0,
  onClick,
  className,
}: TreasuryWidgetProps) {
  return (
    <Widget
      className={cn(
        onClick && "cursor-pointer hover:bg-[var(--color-bg-elevated)] transition-colors",
        className
      )}
      onClick={onClick}
    >
      <WidgetHeader>
        <WidgetTitle>{name}</WidgetTitle>
        <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
          {shortenAddress(address)}
        </span>
      </WidgetHeader>

      <WidgetContent padding="md">
        {/* Total Value */}
        <div className="text-2xl font-semibold text-[var(--color-text-primary)] tabular-nums tracking-tight mb-4">
          ${formatCurrency(totalValueUsd)}
        </div>

        {/* Token Breakdown */}
        <div className="space-y-2">
          {tokens.slice(0, 4).map((token, index) => (
            <TokenRow key={token.symbol} token={token} isLast={index === Math.min(tokens.length - 1, 3)} />
          ))}
          {tokens.length > 4 && (
            <div className="text-xs text-[var(--color-text-tertiary)] pt-1">
              +{tokens.length - 4} more tokens
            </div>
          )}
        </div>
      </WidgetContent>

      {/* Pending Transactions */}
      {pendingTxCount > 0 && (
        <WidgetFooter>
          <div className="flex items-center gap-2 text-[var(--color-warning)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-xs font-medium">
              {pendingTxCount} pending transaction{pendingTxCount !== 1 ? "s" : ""}
            </span>
          </div>
        </WidgetFooter>
      )}
    </Widget>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Token Row
   ═══════════════════════════════════════════════════════════════════ */

interface TokenRowProps {
  token: TokenBalance;
  isLast?: boolean;
}

function TokenRow({ token, isLast }: TokenRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-1.5",
        !isLast && "border-b border-[var(--color-border-subtle)]"
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-[var(--color-text-tertiary)]">├─</span>
        {token.icon ? (
          <img src={token.icon} alt={token.symbol} className="w-4 h-4 rounded-full" />
        ) : (
          <div className="w-4 h-4 rounded-full bg-[var(--color-bg-overlay)] flex items-center justify-center text-[8px] font-medium">
            {token.symbol.charAt(0)}
          </div>
        )}
        <span className="text-xs text-[var(--color-text-secondary)]">
          {formatTokenBalance(token.balance)} {token.symbol}
        </span>
      </div>
      <span className="text-xs text-[var(--color-text-tertiary)] tabular-nums">
        ${formatCurrency(token.valueUsd)}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Compact Treasury Card (for grid overview)
   ═══════════════════════════════════════════════════════════════════ */

interface CompactTreasuryCardProps {
  name: string;
  totalValueUsd: number;
  changePercent?: number;
  onClick?: () => void;
  className?: string;
}

export function CompactTreasuryCard({
  name,
  totalValueUsd,
  changePercent,
  onClick,
  className,
}: CompactTreasuryCardProps) {
  return (
    <Widget
      className={cn(
        onClick && "cursor-pointer hover:bg-[var(--color-bg-elevated)] transition-colors",
        className
      )}
      onClick={onClick}
    >
      <WidgetContent padding="md">
        <div className="text-[11px] font-medium tracking-[0.05em] uppercase text-[var(--color-text-tertiary)] mb-1">
          {name}
        </div>
        <div className="text-xl font-semibold text-[var(--color-text-primary)] tabular-nums">
          ${formatCurrency(totalValueUsd)}
        </div>
        {changePercent !== undefined && (
          <div
            className={cn(
              "text-xs font-medium tabular-nums mt-1",
              changePercent >= 0 ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]"
            )}
          >
            {changePercent >= 0 ? "+" : ""}
            {changePercent.toFixed(1)}% (7d)
          </div>
        )}
      </WidgetContent>
    </Widget>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Formatters
   ═══════════════════════════════════════════════════════════════════ */

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(2);
}

function formatTokenBalance(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  if (value >= 1) {
    return value.toFixed(2);
  }
  return value.toFixed(4);
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
