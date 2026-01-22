"use client";

import { cn } from "@/shared/lib/utils";
import {
  Widget,
  WidgetContent,
} from "./Widget";

/* ═══════════════════════════════════════════════════════════════════
   Price Card Widget — Arkham-style token price display
   Shows: icon, name, price, 24h volume, 1D/7D changes, price range bar
   ═══════════════════════════════════════════════════════════════════ */

interface PriceCardProps {
  token: {
    symbol: string;
    name: string;
    icon?: string;
    price: number;
    volume24h?: number;
    change1d: number;
    change7d: number;
    high24h?: number;
    low24h?: number;
  };
  className?: string;
}

export function PriceCard({ token, className }: PriceCardProps) {
  const change1dPositive = token.change1d >= 0;
  const change7dPositive = token.change7d >= 0;

  return (
    <Widget className={className}>
      <WidgetContent padding="md">
        {/* Token Header: Icon + Name */}
        <div className="flex items-center gap-3 mb-2">
          {token.icon ? (
            <img
              src={token.icon}
              alt={token.symbol}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-ens-blue)] to-[var(--color-ens-purple)] flex items-center justify-center text-sm font-bold text-white">
              {token.symbol.charAt(0)}
            </div>
          )}
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            {token.name}
          </span>
        </div>

        {/* Price */}
        <div className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums tracking-tight mb-4">
          ${formatPrice(token.price)}
        </div>

        {/* Volume & Change Indicators Row */}
        <div className="flex items-end justify-between mb-4">
          {/* 24h Volume */}
          <div>
            <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-0.5">
              24h volume
            </div>
            <div className="text-sm font-medium text-[var(--color-text-primary)] tabular-nums">
              ${token.volume24h !== undefined ? formatVolume(token.volume24h) : "—"}
            </div>
          </div>

          {/* 1D & 7D Change Indicators (stacked labels) */}
          <div className="flex items-end gap-6">
            <ChangeIndicator value={token.change1d} label="1D" />
            <ChangeIndicator value={token.change7d} label="7D" />
          </div>
        </div>

        {/* Price Range Bar */}
        {token.high24h !== undefined && token.low24h !== undefined && (
          <PriceRangeBar
            current={token.price}
            high={token.high24h}
            low={token.low24h}
          />
        )}
      </WidgetContent>
    </Widget>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Change Indicator — Stacked label above value
   ═══════════════════════════════════════════════════════════════════ */

interface ChangeIndicatorProps {
  value: number;
  label: string;
}

function ChangeIndicator({ value, label }: ChangeIndicatorProps) {
  const isPositive = value >= 0;
  return (
    <div className="text-right">
      <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-0.5">
        {label}
      </div>
      <div
        className={cn(
          "text-sm font-medium tabular-nums",
          isPositive ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]"
        )}
      >
        {isPositive ? "+" : ""}{value.toFixed(1)}%
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Price Range Bar — Shows current price position within 24h range
   ═══════════════════════════════════════════════════════════════════ */

interface PriceRangeBarProps {
  current: number;
  high: number;
  low: number;
}

function PriceRangeBar({ current, high, low }: PriceRangeBarProps) {
  // Calculate position percentage (0-100)
  const range = high - low;
  const position = range > 0 ? ((current - low) / range) * 100 : 50;
  // Clamp to 0-100
  const clampedPosition = Math.max(0, Math.min(100, position));

  return (
    <div>
      {/* Range bar */}
      <div className="relative h-1.5 bg-[var(--color-bg-overlay)] rounded-full">
        {/* Filled portion from low to current */}
        <div
          className="absolute h-full bg-gradient-to-r from-[var(--color-text-tertiary)] to-[var(--color-text-secondary)] rounded-full"
          style={{ width: `${clampedPosition}%` }}
        />
        {/* Current price marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[var(--color-text-primary)] rounded-full border-2 border-[var(--color-bg-raised)]"
          style={{ left: `${clampedPosition}%`, marginLeft: "-5px" }}
        />
      </div>

      {/* Low/High labels */}
      <div className="flex justify-between mt-1.5 text-xs text-[var(--color-text-muted)] tabular-nums">
        <span>{formatPrice(low)}</span>
        <span>{formatPrice(high)}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Formatters
   ═══════════════════════════════════════════════════════════════════ */

function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (price >= 1) {
    return price.toFixed(2);
  }
  return price.toFixed(4);
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(1)}B`;
  }
  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(1)}M`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(0)}K`;
  }
  return volume.toFixed(0);
}
