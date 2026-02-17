"use client";

import { cn } from "@/shared/lib/utils";

interface WidgetSkeletonProps {
  className?: string;
  rows?: number;
  showHeader?: boolean;
  height?: string;
}

/**
 * Skeleton loading state for dashboard widgets
 * Uses ENS-branded gradient shimmer via .skeleton class
 */
export function WidgetSkeleton({
  className,
  rows = 3,
  showHeader = true,
  height,
}: WidgetSkeletonProps) {
  return (
    <div
      className={cn(
        "bg-[var(--color-bg-raised)] border border-[var(--color-border-default)]",
        "rounded-lg overflow-hidden card-depth",
        className
      )}
      style={height ? { height } : undefined}
    >
      {showHeader && (
        <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
          <div className="skeleton h-3 w-24 rounded" />
        </div>
      )}
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="skeleton h-4 rounded" />
            <div className="skeleton h-3 w-3/4 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Compact skeleton for price/stat cards — matches hero card styling
 */
export function PriceWidgetSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-[var(--color-bg-raised)] border border-[var(--color-border-default)]",
        "rounded-lg overflow-hidden p-3 hero-card card-depth-hero",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="skeleton w-9 h-9 rounded-full" />
        <div className="skeleton h-2.5 w-16 rounded" />
      </div>
      <div className="skeleton h-9 w-32 rounded mb-6" />
      <div className="flex justify-between mb-4">
        <div className="skeleton h-4 w-20 rounded" />
        <div className="skeleton h-4 w-16 rounded" />
      </div>
      <div className="skeleton h-1.5 rounded-full" />
    </div>
  );
}

/**
 * Table-style skeleton for lists
 */
export function TableWidgetSkeleton({
  className,
  rows = 5,
}: {
  className?: string;
  rows?: number;
}) {
  return (
    <div
      className={cn(
        "bg-[var(--color-bg-raised)] border border-[var(--color-border-default)]",
        "rounded-lg overflow-hidden card-depth",
        className
      )}
    >
      <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <div className="skeleton h-3 w-24 rounded" />
      </div>
      <div className="p-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-2 px-2"
          >
            <div className="skeleton w-5 h-5 rounded-full shrink-0" />
            <div className="skeleton flex-1 h-3 rounded" />
            <div className="skeleton w-16 h-3 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Full-width skeleton for analysis widgets
 */
export function AnalysisWidgetSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-[var(--color-bg-raised)] border border-[var(--color-border-default)]",
        "rounded-lg overflow-hidden card-depth",
        className
      )}
    >
      <div className="px-4 py-3 border-b border-[var(--color-border-subtle)] flex justify-between">
        <div className="skeleton h-3 w-40 rounded" />
        <div className="skeleton h-5 w-32 rounded" />
      </div>
      <div className="p-4">
        <div className="grid grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton h-2 w-20 rounded mb-2" />
              <div className="skeleton h-6 w-24 rounded mb-1" />
              <div className="skeleton h-2 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WidgetSkeleton;
