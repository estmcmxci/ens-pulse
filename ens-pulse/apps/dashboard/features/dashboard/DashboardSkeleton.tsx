"use client";

import {
  PriceWidgetSkeleton,
  TableWidgetSkeleton,
  AnalysisWidgetSkeleton,
  WidgetSkeleton,
} from "./WidgetSkeleton";

/**
 * Full dashboard loading skeleton
 * Used as Suspense fallback for the main dashboard
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-3 pb-10">
      {/* Header skeleton */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-[var(--color-bg-raised)] animate-pulse" />
          <div className="h-5 w-16 bg-[var(--color-bg-raised)] rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-6">
          <div className="h-4 w-20 bg-[var(--color-bg-raised)] rounded animate-pulse" />
          <div className="h-4 w-20 bg-[var(--color-bg-raised)] rounded animate-pulse" />
          <div className="h-5 w-12 bg-[var(--color-bg-raised)] rounded-full animate-pulse" />
        </div>
      </div>

      {/* ROW 1: Price widgets */}
      <div className="grid grid-cols-3 gap-3">
        <PriceWidgetSkeleton />
        <PriceWidgetSkeleton />
        <PriceWidgetSkeleton />
      </div>

      {/* ROW 2: Proposals + Delegates */}
      <div className="grid grid-cols-4 gap-3">
        <WidgetSkeleton rows={5} height="456px" />
        <div className="col-span-3">
          <TableWidgetSkeleton rows={10} />
        </div>
      </div>

      {/* ROW 3: Attack Analysis */}
      <AnalysisWidgetSkeleton />

      {/* ROW 4: Protocol Metrics */}
      <WidgetSkeleton rows={3} />

      {/* ROW 5: Treasury + Meetings */}
      <div className="grid grid-cols-2 gap-3">
        <TableWidgetSkeleton rows={5} />
        <TableWidgetSkeleton rows={5} />
      </div>

      {/* ROW 6: Feeds */}
      <div className="grid grid-cols-2 gap-3">
        <TableWidgetSkeleton rows={5} />
        <TableWidgetSkeleton rows={5} />
      </div>
    </div>
  );
}

export default DashboardSkeleton;
