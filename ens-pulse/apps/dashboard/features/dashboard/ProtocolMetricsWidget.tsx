"use client";

import {
  Widget,
  WidgetHeader,
  WidgetTitle,
  WidgetContent,
} from "@/shared/components/widgets";
import { useEnsStats, useFinancials } from "@/shared/hooks/use-api-data";
import { formatLargeNumber } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

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

export function ENSStatsGrid() {
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
          <div key={i} className="p-3 rounded-lg bg-[var(--color-bg-raised)] border border-[var(--color-border-default)]">
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
          <div key={stat.label} className="p-3 rounded-lg bg-[var(--color-bg-raised)] border border-[var(--color-border-default)]">
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

export function FinancialsGrid() {
  const { data, isLoading } = useFinancials();

  const metrics = [
    { label: "Daily Revenue", value: data?.dailyRevenue?.value, delta: data?.dailyRevenue?.deltaPercent, prefix: "$" },
    { label: "Monthly Revenue", value: data?.monthlyRevenue?.value, delta: data?.monthlyRevenue?.deltaPercent, prefix: "$" },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[1, 2].map((i) => (
          <div key={i} className="p-3 rounded-lg bg-[var(--color-bg-raised)] border border-[var(--color-border-default)]">
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
          <div key={metric.label} className="p-3 rounded-lg bg-[var(--color-bg-raised)] border border-[var(--color-border-default)]">
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
   PROTOCOL METRICS WIDGET — Combined ENS Stats and Financials
   ═══════════════════════════════════════════════════════════════════════════ */

export function ProtocolMetricsWidget() {
  return (
    <Widget>
      <WidgetHeader>
        <WidgetTitle>PROTOCOL METRICS</WidgetTitle>
      </WidgetHeader>
      <WidgetContent padding="sm">
        <div className="space-y-4">
          <ENSStatsGrid />
          <FinancialsGrid />
        </div>
      </WidgetContent>
    </Widget>
  );
}

export default ProtocolMetricsWidget;
