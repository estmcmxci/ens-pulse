"use client";

import { Widget, WidgetContent } from "@/shared/components/widgets";
import { useMarketData } from "@/shared/hooks/use-api-data";
import { formatLargeNumber, formatRangePrice } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════════
   PRICE WIDGET — Arkham-style token price with range bar
   ═══════════════════════════════════════════════════════════════════════════ */

export interface PriceWidgetProps {
  symbol: "ETH" | "ENS";
}

export function PriceWidget({ symbol }: PriceWidgetProps) {
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
    <Widget className="hero-card card-depth-hero">
      <WidgetContent padding="md">
        {isLoading ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <div className="skeleton w-9 h-9 rounded-full" />
              <div className="skeleton h-2.5 w-16 rounded" />
            </div>
            <div className="skeleton h-9 w-32 rounded" />
            <div className="flex justify-between">
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton h-4 w-16 rounded" />
            </div>
            <div className="skeleton h-1.5 rounded-full" />
          </div>
        ) : (
          <>
            {/* Token Header: Icon + Name */}
            <div className="flex items-center gap-3 mb-4">
              {icon ? (
                <img src={icon} alt={symbol} className="w-9 h-9 rounded-full ring-1 ring-[var(--color-border-default)]" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-ens-blue)] to-[var(--color-ens-purple)] flex items-center justify-center text-sm font-bold text-white shadow-[0_0_12px_rgba(82,152,255,0.3)]">
                  {symbol.charAt(0)}
                </div>
              )}
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                {tokenName}
              </span>
            </div>

            {/* Price — hero treatment */}
            <div className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums tracking-tight mb-5">
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
              <div className="flex items-end gap-5">
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

  return (
    <div>
      <div className="relative h-1.5 bg-[var(--color-bg-overlay)] rounded-full overflow-hidden">
        <div
          className="absolute h-full rounded-full"
          style={{
            width: `${clampedPosition}%`,
            background: 'linear-gradient(90deg, #5298ff, #a099ff)',
            opacity: 0.7,
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full"
          style={{
            left: `${clampedPosition}%`,
            marginLeft: "-5px",
            boxShadow: '0 0 8px rgba(82,152,255,0.6), 0 0 2px rgba(255,255,255,0.8)',
          }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-xs text-[var(--color-text-muted)] tabular-nums">
        <span>{formatRangePrice(low)}</span>
        <span>{formatRangePrice(high)}</span>
      </div>
    </div>
  );
}

export default PriceWidget;
