"use client";

import {
  Widget,
  WidgetHeader,
  WidgetTitle,
  WidgetContent,
  WidgetFooter,
} from "./Widget";
import {
  useProtocolHealth,
  type ChainIndexingStatus,
  type IndexingStatus,
} from "@/shared/hooks/use-api-data";
import { cn } from "@/shared/lib/utils";

/* ═══════════════════════════════════════════════════════════════════
   Protocol Health Widget
   Displays ENS Node indexing status and protocol health
   ═══════════════════════════════════════════════════════════════════ */

function getStatusColor(
  status: IndexingStatus | ChainIndexingStatus["status"]
): string {
  switch (status) {
    case "following":
    case "completed":
      return "bg-green-500";
    case "backfill":
      return "bg-yellow-500";
    case "queued":
    case "unstarted":
      return "bg-gray-400";
    case "error":
      return "bg-red-500";
    default:
      return "bg-gray-400";
  }
}

function getStatusTextColor(
  status: IndexingStatus | ChainIndexingStatus["status"]
): string {
  switch (status) {
    case "following":
    case "completed":
      return "text-green-500";
    case "backfill":
      return "text-yellow-500";
    case "queued":
    case "unstarted":
      return "text-[var(--color-text-tertiary)]";
    case "error":
      return "text-red-500";
    default:
      return "text-[var(--color-text-tertiary)]";
  }
}

function getStatusLabel(
  status: IndexingStatus | ChainIndexingStatus["status"]
): string {
  switch (status) {
    case "following":
      return "Synced";
    case "completed":
      return "Complete";
    case "backfill":
      return "Syncing";
    case "queued":
      return "Queued";
    case "unstarted":
      return "Not Started";
    case "error":
      return "Error";
    default:
      return "Unknown";
  }
}

function formatBlockNumber(block: number): string {
  return block.toLocaleString();
}

/* ═══════════════════════════════════════════════════════════════════
   Chain Status Row
   ═══════════════════════════════════════════════════════════════════ */

function ChainStatusRow({ chain }: { chain: ChainIndexingStatus }) {
  const showProgress =
    chain.status === "backfill" && chain.progressPercent !== undefined;

  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--color-border-subtle)] last:border-0">
      <div className="flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full", getStatusColor(chain.status))} />
        <span className="text-sm text-[var(--color-text-primary)]">
          {chain.chainName}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {showProgress && (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-[var(--color-bg-overlay)] rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 rounded-full transition-all"
                style={{ width: `${chain.progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-[var(--color-text-tertiary)]">
              {chain.progressPercent}%
            </span>
          </div>
        )}
        {chain.latestIndexedBlock && (
          <span className="text-xs text-[var(--color-text-tertiary)] font-mono">
            #{formatBlockNumber(chain.latestIndexedBlock.number)}
          </span>
        )}
        <span
          className={cn("text-xs font-medium", getStatusTextColor(chain.status))}
        >
          {getStatusLabel(chain.status)}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Loading State
   ═══════════════════════════════════════════════════════════════════ */

function LoadingState() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--color-bg-overlay)] animate-pulse" />
            <div className="w-20 h-4 bg-[var(--color-bg-overlay)] rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-4 bg-[var(--color-bg-overlay)] rounded animate-pulse" />
            <div className="w-12 h-4 bg-[var(--color-bg-overlay)] rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Error State
   ═══════════════════════════════════════════════════════════════════ */

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
        <svg
          className="w-5 h-5 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Unable to fetch protocol status
      </p>
      <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
        ENS Node API may be unavailable
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main Widget
   ═══════════════════════════════════════════════════════════════════ */

interface ProtocolHealthWidgetProps {
  colSpan?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2 | 3;
}

export function ProtocolHealthWidget({
  colSpan = 1,
  rowSpan = 1,
}: ProtocolHealthWidgetProps) {
  const { data, error, isLoading } = useProtocolHealth();

  const overallStatus = data?.indexingStatus?.status || "error";
  const isHealthy = data?.isHealthy ?? false;

  return (
    <Widget colSpan={colSpan} rowSpan={rowSpan}>
      <WidgetHeader>
        <WidgetTitle
          icon={
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          }
        >
          Protocol Health
        </WidgetTitle>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              isHealthy ? "bg-green-500" : "bg-red-500"
            )}
          />
          <span
            className={cn(
              "text-xs font-medium",
              isHealthy ? "text-green-500" : "text-red-500"
            )}
          >
            {isHealthy ? "Healthy" : "Degraded"}
          </span>
        </div>
      </WidgetHeader>

      <WidgetContent>
        {isLoading && <LoadingState />}
        {error && <ErrorState />}
        {data && !error && (
          <div className="space-y-1">
            {/* Overall Status Banner */}
            <div
              className={cn(
                "flex items-center justify-between p-2 rounded-md mb-3",
                overallStatus === "following" || overallStatus === "completed"
                  ? "bg-green-500/10"
                  : overallStatus === "backfill"
                    ? "bg-yellow-500/10"
                    : "bg-red-500/10"
              )}
            >
              <span className="text-xs text-[var(--color-text-secondary)]">
                ENS Node Status
              </span>
              <span
                className={cn("text-xs font-medium", getStatusTextColor(overallStatus))}
              >
                {getStatusLabel(overallStatus)}
              </span>
            </div>

            {/* Chain Status List */}
            {data.indexingStatus?.chains.map((chain) => (
              <ChainStatusRow key={chain.chainId} chain={chain} />
            ))}

            {/* Config Info */}
            {data.config && (
              <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-text-tertiary)]">Version</span>
                  <span className="text-[var(--color-text-secondary)] font-mono">
                    {data.config.version}
                  </span>
                </div>
                {data.config.features.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {data.config.features.slice(0, 3).map((feature) => (
                      <span
                        key={feature}
                        className="px-1.5 py-0.5 text-[10px] bg-[var(--color-bg-overlay)] text-[var(--color-text-tertiary)] rounded"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </WidgetContent>

      <WidgetFooter>
        <span>ENS Node</span>
        {data && (
          <span className="text-[var(--color-text-tertiary)]">
            {data.latency}ms latency
          </span>
        )}
      </WidgetFooter>
    </Widget>
  );
}
