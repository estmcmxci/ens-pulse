"use client";

import { cn } from "@/shared/lib/utils";
import {
  Widget,
  WidgetHeader,
  WidgetTitle,
  WidgetContent,
  WidgetFooter,
} from "./Widget";
import { Badge } from "@/shared/components/ui/Badge";
import {
  useTreasuryOverview,
  useGasPrices,
  useNews,
  useInfraStatus,
  useMarketData,
  useDuneQuery,
  type NewsItem,
} from "@/shared/hooks/use-api-data";
import { DUNE_QUERIES } from "@/shared/config/dune-queries";

/* ═══════════════════════════════════════════════════════════════════
   TIER 1: Live Data Widgets
   ═══════════════════════════════════════════════════════════════════ */

/* ───────────────────────────────────────────────────────────────────
   Total Treasury Widget
   ─────────────────────────────────────────────────────────────────── */

export function TotalTreasuryWidget({ className }: { className?: string }) {
  const { data, isLoading, error } = useTreasuryOverview();
  const { data: marketData } = useMarketData();

  if (isLoading) return <WidgetSkeleton className={className} />;
  if (error || !data) return <WidgetError message="Failed to load treasury" className={className} />;

  const ethPrice = marketData?.prices?.ethereum?.current_price || 3000;
  const ensPrice = marketData?.prices?.["ethereum-name-service"]?.current_price || 10;

  const ethBalance = Number(data.totals.ethBalance) / 1e18;
  const ensBalance = Number(data.totals.ensBalance) / 1e18;
  const usdcBalance = Number(data.totals.usdcBalance) / 1e6;

  const totalUsd = ethBalance * ethPrice + ensBalance * ensPrice + usdcBalance;

  return (
    <Widget className={className}>
      <WidgetHeader>
        <WidgetTitle>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Total Treasury
        </WidgetTitle>
        <Badge variant="success" size="sm" dot>Live</Badge>
      </WidgetHeader>
      <WidgetContent>
        <div className="text-3xl font-bold text-[var(--color-text-primary)] tabular-nums tracking-tight">
          ${formatLargeNumber(totalUsd)}
        </div>
        <div className="mt-3 space-y-1.5 text-xs">
          <TreasuryRow label="ETH" value={ethBalance} usd={ethBalance * ethPrice} />
          <TreasuryRow label="ENS" value={ensBalance} usd={ensBalance * ensPrice} />
          <TreasuryRow label="USDC" value={usdcBalance} usd={usdcBalance} />
        </div>
      </WidgetContent>
      <WidgetFooter>
        <span>{data.totals.multisigCount} wallets</span>
        <span className="text-[var(--color-text-muted)]">
          ETH: ${data.ethPrice?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "—"}
        </span>
      </WidgetFooter>
    </Widget>
  );
}

function TreasuryRow({ label, value, usd }: { label: string; value: number; usd: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--color-text-tertiary)]">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-[var(--color-text-secondary)] tabular-nums">
          {formatTokenAmount(value)}
        </span>
        <span className="text-[var(--color-text-muted)] tabular-nums w-20 text-right">
          ${formatLargeNumber(usd)}
        </span>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────
   Treasury Grid Widget (All Multisigs)
   ─────────────────────────────────────────────────────────────────── */

export function TreasuryGridWidget({ className }: { className?: string }) {
  const { data, isLoading, error } = useTreasuryOverview();
  const { data: marketData } = useMarketData();

  if (isLoading) return <WidgetSkeleton className={className} rows={6} />;
  if (error || !data) return <WidgetError message="Failed to load treasury" className={className} />;

  const ethPrice = data.ethPrice || marketData?.prices?.ethereum?.current_price || 3000;
  const ensPrice = marketData?.prices?.["ethereum-name-service"]?.current_price || 10;

  return (
    <Widget className={className}>
      <WidgetHeader>
        <WidgetTitle>Working Group Wallets</WidgetTitle>
        <Badge variant="outline" size="sm">{data.multisigs.length}</Badge>
      </WidgetHeader>
      <WidgetContent padding="none">
        <div className="max-h-[300px] overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[var(--color-bg-raised)]">
              <tr className="border-b border-[var(--color-border-subtle)]">
                <th className="px-3 py-2 text-left font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Wallet</th>
                <th className="px-3 py-2 text-right font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Balance</th>
                <th className="px-3 py-2 text-right font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Signers</th>
              </tr>
            </thead>
            <tbody>
              {data.multisigs.map((ms) => {
                const eth = Number(ms.calculatedBalances.ethBalance) / 1e18;
                const ens = Number(ms.calculatedBalances.ensBalance) / 1e18;
                const usdc = Number(ms.calculatedBalances.usdcBalance) / 1e6;
                const total = eth * ethPrice + ens * ensPrice + usdc;

                return (
                  <tr
                    key={ms.address}
                    className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium text-[var(--color-text-primary)]">{ms.name}</div>
                      <div className="text-[var(--color-text-muted)]">{ms.workingGroup}</div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-[var(--color-text-secondary)]">
                      ${formatLargeNumber(total)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {ms.isMultisig && ms.threshold > 0 ? (
                        <Badge variant="outline" size="sm">{ms.threshold}/{ms.ownerCount}</Badge>
                      ) : (
                        <span className="text-[var(--color-text-muted)]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </WidgetContent>
    </Widget>
  );
}

/* ───────────────────────────────────────────────────────────────────
   Pending Transactions Widget
   ─────────────────────────────────────────────────────────────────── */

export function PendingTxWidget({ className }: { className?: string }) {
  return (
    <Widget className={className}>
      <WidgetHeader>
        <WidgetTitle>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pending Transactions
        </WidgetTitle>
      </WidgetHeader>
      <WidgetContent>
        <div className="text-center py-4 text-[var(--color-text-muted)] text-sm">
          No pending transactions
        </div>
      </WidgetContent>
    </Widget>
  );
}

/* ───────────────────────────────────────────────────────────────────
   Gas Tracker Widget
   ─────────────────────────────────────────────────────────────────── */

export function GasTrackerWidget({ className }: { className?: string }) {
  const { data, isLoading, error } = useGasPrices();

  if (isLoading) return <WidgetSkeleton className={className} />;
  if (error || !data) return <WidgetError message="Failed to load gas" className={className} />;

  return (
    <Widget className={className}>
      <WidgetHeader>
        <WidgetTitle>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Gas Tracker
        </WidgetTitle>
        <Badge variant="success" size="sm" dot>Live</Badge>
      </WidgetHeader>
      <WidgetContent>
        <div className="space-y-2">
          <GasRow label="Low" gwei={data.gas.low} speed="~10 min" variant="success" />
          <GasRow label="Average" gwei={data.gas.average} speed="~3 min" variant="warning" />
          <GasRow label="Fast" gwei={data.gas.high} speed="~30 sec" variant="danger" />
        </div>
        {data.gas.baseFee && (
          <div className="mt-3 pt-2 border-t border-[var(--color-border-subtle)] text-xs text-[var(--color-text-muted)]">
            Base fee: {data.gas.baseFee.toFixed(1)} gwei
          </div>
        )}
      </WidgetContent>
    </Widget>
  );
}

function GasRow({
  label,
  gwei,
  speed,
  variant,
}: {
  label: string;
  gwei: number;
  speed: string;
  variant: "success" | "warning" | "danger";
}) {
  const colors = {
    success: "text-[var(--color-positive)]",
    warning: "text-[var(--color-warning)]",
    danger: "text-[var(--color-negative)]",
  };

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-[var(--color-text-tertiary)]">{label}</span>
      <div className="flex items-center gap-3">
        <span className={cn("text-sm font-medium tabular-nums", colors[variant])}>
          {Math.round(gwei)} gwei
        </span>
        <span className="text-xs text-[var(--color-text-muted)] w-16 text-right">{speed}</span>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────
   News Feed Widget
   ─────────────────────────────────────────────────────────────────── */

export function NewsFeedWidget({ className, limit = 8 }: { className?: string; limit?: number }) {
  const { data, isLoading, error } = useNews(undefined, limit);

  if (isLoading) return <WidgetSkeleton className={className} rows={4} />;
  if (error || !data) return <WidgetError message="Failed to load news" className={className} />;

  return (
    <Widget className={className}>
      <WidgetHeader>
        <WidgetTitle>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          News Feed
        </WidgetTitle>
        <Badge variant="outline" size="sm">{data.totalItems}</Badge>
      </WidgetHeader>
      <WidgetContent padding="sm">
        <div className="space-y-1 max-h-[280px] overflow-auto">
          {data.items.map((item: NewsItem, i: number) => (
            <NewsRow key={`${item.link}-${i}`} item={item} />
          ))}
        </div>
      </WidgetContent>
    </Widget>
  );
}

function NewsRow({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-2 rounded hover:bg-[var(--color-bg-overlay)] transition-colors group"
    >
      <div className="text-sm text-[var(--color-text-primary)] line-clamp-2 group-hover:text-[var(--color-interactive)]">
        {item.title}
      </div>
      <div className="flex items-center gap-2 mt-1 text-xs">
        <span className="text-[var(--color-interactive)]">{item.source}</span>
        <span className="text-[var(--color-text-muted)]">{formatTimeAgo(item.pubDate)}</span>
      </div>
    </a>
  );
}

/* ───────────────────────────────────────────────────────────────────
   Infrastructure Status Widget
   ─────────────────────────────────────────────────────────────────── */

export function InfraStatusWidget({ className }: { className?: string }) {
  const { data, isLoading } = useInfraStatus();

  if (isLoading) return <WidgetSkeleton className={className} />;

  // Status config for different states
  const statusConfig = {
    operational: { variant: "success" as const, label: "Operational", dotClass: "bg-[var(--color-positive)]" },
    degraded: { variant: "warning" as const, label: "Degraded", dotClass: "bg-[var(--color-warning)]" },
    outage: { variant: "danger" as const, label: "Outage", dotClass: "bg-[var(--color-negative)]" },
    unknown: { variant: "outline" as const, label: "Unknown", dotClass: "bg-[var(--color-text-muted)]" },
  };

  // Use API data or fallback to defaults
  const components = data?.components || [
    { name: "Cloudflare", status: "operational" },
    { name: "Ethereum Network", status: "operational" },
    { name: "ENS Gateway", status: "operational" },
  ];

  return (
    <Widget className={className}>
      <WidgetHeader>
        <WidgetTitle>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Infrastructure
        </WidgetTitle>
      </WidgetHeader>
      <WidgetContent>
        <div className="space-y-3">
          {components.map((component: { name: string; status: string }) => {
            const config = statusConfig[component.status as keyof typeof statusConfig] || statusConfig.unknown;
            return (
              <div key={component.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", config.dotClass)} />
                  <span className="text-sm text-[var(--color-text-primary)]">{component.name}</span>
                </div>
                <Badge variant={config.variant} size="sm">{config.label}</Badge>
              </div>
            );
          })}
        </div>
      </WidgetContent>
    </Widget>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TIER 2: Dune-Powered Widgets
   ═══════════════════════════════════════════════════════════════════ */

/* ───────────────────────────────────────────────────────────────────
   Delegate Stats Widget
   ─────────────────────────────────────────────────────────────────── */

export function DelegateStatsWidget({ className }: { className?: string }) {
  const { data, isLoading, error } = useDuneQuery<{
    "#_delegates": number;
    token_holders: number;
    delegators: number;
    delegated_votes: number;
  }>(DUNE_QUERIES.DELEGATE_SUMMARY);

  if (isLoading) return <WidgetSkeleton className={className} />;
  if (error || !data?.result?.rows?.[0]) return <WidgetError message="Failed to load" className={className} />;

  const stats = data.result.rows[0];

  return (
    <Widget className={className}>
      <WidgetHeader>
        <WidgetTitle>Delegation Stats</WidgetTitle>
        <Badge variant="ens" size="sm">Dune</Badge>
      </WidgetHeader>
      <WidgetContent>
        <div className="grid grid-cols-2 gap-3">
          <StatBox label="Delegates" value={stats["#_delegates"]} />
          <StatBox label="Delegators" value={stats.delegators} />
          <StatBox label="Token Holders" value={stats.token_holders} />
          <StatBox label="Delegated Votes" value={stats.delegated_votes} format="votes" />
        </div>
      </WidgetContent>
    </Widget>
  );
}

/* ───────────────────────────────────────────────────────────────────
   ENS Revenue Widget
   ─────────────────────────────────────────────────────────────────── */

export function RevenueWidget({ className }: { className?: string }) {
  const { data, isLoading, error } = useDuneQuery<{
    period: string;
    amount: number;
    amount_m: number;
    amount_prev_month: number;
    amount_prev_year: number;
  }>(DUNE_QUERIES.ENS_REVENUE);

  if (isLoading) return <WidgetSkeleton className={className} />;
  if (error || !data?.result?.rows) return <WidgetError message="Failed to load" className={className} />;

  const latest = data.result.rows[data.result.rows.length - 1];
  const prev = data.result.rows[data.result.rows.length - 2];
  const change = prev ? ((latest.amount - prev.amount) / prev.amount) * 100 : 0;

  return (
    <Widget className={className}>
      <WidgetHeader>
        <WidgetTitle>Protocol Revenue</WidgetTitle>
        <Badge variant="ens" size="sm">Dune</Badge>
      </WidgetHeader>
      <WidgetContent>
        <div className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">
          ${formatLargeNumber(latest.amount)}
        </div>
        <div className="text-xs text-[var(--color-text-muted)] mt-1">
          {latest.period}
        </div>
        <div className={cn(
          "text-sm font-medium mt-2 tabular-nums",
          change >= 0 ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]"
        )}>
          {change >= 0 ? "+" : ""}{change.toFixed(1)}% vs prev month
        </div>
      </WidgetContent>
    </Widget>
  );
}

/* ───────────────────────────────────────────────────────────────────
   ENS Registrations Widget
   ─────────────────────────────────────────────────────────────────── */

export function RegistrationsWidget({ className }: { className?: string }) {
  const { data, isLoading, error } = useDuneQuery<{ count: number }>(DUNE_QUERIES.TOTAL_ENS_NAMES);

  if (isLoading) return <WidgetSkeleton className={className} />;
  if (error || !data?.result?.rows?.[0]) return <WidgetError message="Failed to load" className={className} />;

  const count = data.result.rows[0].count || Object.values(data.result.rows[0])[0];

  return (
    <Widget className={className}>
      <WidgetHeader>
        <WidgetTitle>Total ENS Names</WidgetTitle>
        <Badge variant="ens" size="sm">Dune</Badge>
      </WidgetHeader>
      <WidgetContent>
        <div className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">
          {formatLargeNumber(Number(count))}
        </div>
        <div className="text-xs text-[var(--color-text-muted)] mt-1">
          Active .eth names
        </div>
      </WidgetContent>
    </Widget>
  );
}

/* ───────────────────────────────────────────────────────────────────
   Governance Risk Widget
   ─────────────────────────────────────────────────────────────────── */

export function GovernanceRiskWidget({ className }: { className?: string }) {
  const { data, isLoading, error } = useDuneQuery<{
    period: string;
    total_assets: number;
    delegated_market_cap: number;
    ActiveDelegators: number;
    risk_factor: number;
  }>(DUNE_QUERIES.GOVERNANCE_RISK);

  if (isLoading) return <WidgetSkeleton className={className} />;
  if (error || !data?.result?.rows) return <WidgetError message="Failed to load" className={className} />;

  const latest = data.result.rows[data.result.rows.length - 1];
  const riskLevel = latest.risk_factor < 0.3 ? "Low" : latest.risk_factor < 0.6 ? "Medium" : "High";
  const riskVariant = latest.risk_factor < 0.3 ? "success" : latest.risk_factor < 0.6 ? "warning" : "danger";

  return (
    <Widget className={className}>
      <WidgetHeader>
        <WidgetTitle>Governance Health</WidgetTitle>
        <Badge variant={riskVariant} size="sm">{riskLevel} Risk</Badge>
      </WidgetHeader>
      <WidgetContent>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-tertiary)]">Active Delegators</span>
            <span className="text-[var(--color-text-primary)] tabular-nums">{formatLargeNumber(latest.ActiveDelegators)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-tertiary)]">Delegated Market Cap</span>
            <span className="text-[var(--color-text-primary)] tabular-nums">${formatLargeNumber(latest.delegated_market_cap)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-tertiary)]">Risk Factor</span>
            <span className={cn("tabular-nums", riskVariant === "success" ? "text-[var(--color-positive)]" : riskVariant === "warning" ? "text-[var(--color-warning)]" : "text-[var(--color-negative)]")}>
              {(latest.risk_factor * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </WidgetContent>
    </Widget>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Helper Components
   ═══════════════════════════════════════════════════════════════════ */

function StatBox({ label, value, format }: { label: string; value: number; format?: "votes" }) {
  return (
    <div className="p-2 rounded bg-[var(--color-bg-overlay)] text-center">
      <div className="text-lg font-semibold text-[var(--color-text-primary)] tabular-nums">
        {format === "votes" ? formatLargeNumber(value) : value.toLocaleString()}
      </div>
      <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">{label}</div>
    </div>
  );
}

function WidgetSkeleton({ className, rows = 3 }: { className?: string; rows?: number }) {
  return (
    <Widget className={className}>
      <WidgetContent>
        <div className="space-y-3">
          <div className="skeleton h-4 w-1/3" />
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="skeleton h-3" style={{ width: `${100 - i * 15}%` }} />
          ))}
        </div>
      </WidgetContent>
    </Widget>
  );
}

function WidgetError({ message, className }: { message: string; className?: string }) {
  return (
    <Widget className={className}>
      <WidgetContent>
        <div className="text-center py-4">
          <div className="text-[var(--color-negative)] text-sm">{message}</div>
        </div>
      </WidgetContent>
    </Widget>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Formatters
   ═══════════════════════════════════════════════════════════════════ */

function formatLargeNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(2);
}

/* ═══════════════════════════════════════════════════════════════════
   Price Status Bars — Minimal Live Price Display
   ═══════════════════════════════════════════════════════════════════ */

interface PriceStatusBarProps {
  symbol: "ETH" | "ENS" | "BTC";
  className?: string;
}

export function PriceStatusBar({ symbol, className }: PriceStatusBarProps) {
  const { data, isLoading } = useMarketData();

  const tokenMap = {
    ETH: { id: "ethereum", name: "Ethereum", color: "var(--color-interactive)" },
    ENS: { id: "ethereum-name-service", name: "ENS", color: "var(--color-ens)" },
    BTC: { id: "bitcoin", name: "Bitcoin", color: "#f7931a" },
  };

  const token = tokenMap[symbol];
  const priceData = data?.prices?.[token.id];

  if (isLoading) {
    return (
      <Widget className={cn("min-h-[80px]", className)}>
        <WidgetContent>
          <div className="animate-pulse flex items-center justify-between">
            <div className="h-6 w-16 bg-[var(--color-bg-overlay)] rounded" />
            <div className="h-8 w-24 bg-[var(--color-bg-overlay)] rounded" />
          </div>
        </WidgetContent>
      </Widget>
    );
  }

  const price = priceData?.current_price || 0;
  const change24h = priceData?.price_change_percentage_24h || 0;
  const isPositive = change24h >= 0;

  return (
    <Widget className={cn("min-h-[80px]", className)}>
      <WidgetContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: token.color }}
            />
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              {symbol}/USD
            </span>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-[var(--color-text-primary)] tabular-nums">
              ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={cn(
              "text-xs font-medium tabular-nums",
              isPositive ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]"
            )}>
              {isPositive ? "+" : ""}{change24h.toFixed(2)}%
            </div>
          </div>
        </div>
      </WidgetContent>
    </Widget>
  );
}

/* ───────────────────────────────────────────────────────────────────
   Combined Price Ticker — All prices in one row
   ─────────────────────────────────────────────────────────────────── */

export function PriceTickerWidget({ className }: { className?: string }) {
  const { data, isLoading } = useMarketData();

  if (isLoading) {
    return (
      <Widget className={cn("col-span-full", className)}>
        <WidgetContent padding="sm">
          <div className="animate-pulse flex justify-around">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 w-32 bg-[var(--color-bg-overlay)] rounded" />
            ))}
          </div>
        </WidgetContent>
      </Widget>
    );
  }

  const tokens = [
    { id: "ethereum", symbol: "ETH", color: "var(--color-interactive)" },
    { id: "ethereum-name-service", symbol: "ENS", color: "var(--color-ens)" },
    { id: "bitcoin", symbol: "BTC", color: "#f7931a" },
  ];

  return (
    <Widget className={cn("col-span-full", className)}>
      <WidgetContent padding="sm">
        <div className="flex justify-around items-center divide-x divide-[var(--color-border-subtle)]">
          {tokens.map((token) => {
            const priceData = data?.prices?.[token.id];
            const price = priceData?.current_price || 0;
            const change = priceData?.price_change_percentage_24h || 0;
            const isPositive = change >= 0;

            return (
              <div key={token.id} className="flex items-center gap-3 px-4 first:pl-0 last:pr-0">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: token.color }}
                />
                <span className="text-xs text-[var(--color-text-muted)]">{token.symbol}</span>
                <span className="text-sm font-medium text-[var(--color-text-primary)] tabular-nums">
                  ${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className={cn(
                  "text-xs tabular-nums",
                  isPositive ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]"
                )}>
                  {isPositive ? "+" : ""}{change.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </WidgetContent>
    </Widget>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
   ═══════════════════════════════════════════════════════════════════ */

function formatTokenAmount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(2);
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
