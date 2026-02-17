"use client";

import dynamic from "next/dynamic";
import {
  Widget,
  WidgetHeader,
  WidgetTitle,
  WidgetContent,
} from "@/shared/components/widgets";
import { Badge } from "@/shared/components/ui/Badge";
import { useMarketData } from "@/shared/hooks/use-api-data";
import {
  PriceWidgetSkeleton,
  TableWidgetSkeleton,
  AnalysisWidgetSkeleton,
  WidgetSkeleton,
} from "@/features/dashboard/WidgetSkeleton";

/* ═══════════════════════════════════════════════════════════════════════════
   DYNAMIC IMPORTS — Code splitting for optimized loading
   Each widget loads independently, reducing initial bundle size
   ═══════════════════════════════════════════════════════════════════════════ */

const PriceWidget = dynamic(
  () => import("@/features/dashboard/PriceWidget"),
  { loading: () => <PriceWidgetSkeleton /> }
);

const TotalAssetsWidget = dynamic(
  () => import("@/features/dashboard/TotalAssetsWidget"),
  { loading: () => <PriceWidgetSkeleton /> }
);

const ActiveProposalsWidget = dynamic(
  () => import("@/features/dashboard/ActiveProposalsWidget"),
  { loading: () => <WidgetSkeleton rows={5} height="456px" /> }
);

const DelegatesWidget = dynamic(
  () => import("@/features/dashboard/DelegatesWidget"),
  { loading: () => <TableWidgetSkeleton rows={10} /> }
);

const AttackAnalysisWidget = dynamic(
  () => import("@/features/dashboard/AttackAnalysisWidget"),
  { loading: () => <AnalysisWidgetSkeleton /> }
);

const TreasuryWidget = dynamic(
  () => import("@/features/dashboard/TreasuryWidget"),
  { loading: () => <TableWidgetSkeleton rows={5} /> }
);

const MeetingsWidget = dynamic(
  () => import("@/features/dashboard/MeetingsWidget"),
  { loading: () => <TableWidgetSkeleton rows={5} /> }
);

const DiscourseFeedWidget = dynamic(
  () => import("@/features/dashboard/DiscourseFeedWidget"),
  { loading: () => <TableWidgetSkeleton rows={5} /> }
);

const SocialFeedWidget = dynamic(
  () => import("@/features/dashboard/SocialFeedWidget"),
  { loading: () => <TableWidgetSkeleton rows={5} /> }
);

const SignalsTicker = dynamic(
  () => import("@/features/dashboard/SignalsTicker"),
  { ssr: false }
);

const ENSStatsGrid = dynamic(
  () => import("@/features/dashboard/ProtocolMetricsWidget").then(mod => ({ default: mod.ENSStatsGrid })),
  { loading: () => <div className="h-24 animate-pulse bg-[var(--color-bg-raised)] rounded" /> }
);

const FinancialsGrid = dynamic(
  () => import("@/features/dashboard/ProtocolMetricsWidget").then(mod => ({ default: mod.FinancialsGrid })),
  { loading: () => <div className="h-24 animate-pulse bg-[var(--color-bg-raised)] rounded" /> }
);

/* ═══════════════════════════════════════════════════════════════════════════
   WORLD MONITOR CLIENT — Client component with SWR data fetching

   Each widget fetches its own data via SWR hooks, providing:
   - Instant UI with loading skeletons
   - Parallel data fetching (no waterfalls)
   - Automatic caching and background refresh
   - Request deduplication across components
   ═══════════════════════════════════════════════════════════════════════════ */

export default function WorldMonitorClient() {
  return (
    <>
      <div className="space-y-4 pb-10">
        {/* ════════════════════════════════════════════════════════════════════
            HEADER — Logo left, prices right
            ════════════════════════════════════════════════════════════════════ */}
        <div className="animate-in stagger-1">
          <Header />
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            ROW 1: ETH | ENS | TREASURY — Hero metrics
            ════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in stagger-2">
          <PriceWidget symbol="ETH" />
          <PriceWidget symbol="ENS" />
          <TotalAssetsWidget />
        </div>

        {/* Gradient section divider */}
        <div className="divider-ens animate-in stagger-3" />

        {/* ════════════════════════════════════════════════════════════════════
            ROW 2: PROPOSALS | DELEGATES
            ════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 animate-in stagger-3">
          <ActiveProposalsWidget />
          <div className="lg:col-span-3">
            <DelegatesWidget />
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            ROW 3: ATTACK PROFITABILITY ANALYSIS
            ════════════════════════════════════════════════════════════════════ */}
        <div className="widget-row-deferred animate-in stagger-4">
          <AttackAnalysisWidget />
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            ROW 4: PROTOCOL METRICS
            ════════════════════════════════════════════════════════════════════ */}
        <div className="widget-row-deferred animate-in stagger-5">
          <Widget className="widget-contained">
            <WidgetHeader>
              <WidgetTitle>PROTOCOL METRICS</WidgetTitle>
              <span className="label">
                30D = 30-day change vs previous period
              </span>
            </WidgetHeader>
            <WidgetContent padding="sm">
              <div className="space-y-3">
                <ENSStatsGrid />
                <FinancialsGrid />
              </div>
            </WidgetContent>
          </Widget>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            ROW 5: TREASURY | MEETINGS
            ════════════════════════════════════════════════════════════════════ */}
        <div className="widget-row-deferred animate-in stagger-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TreasuryWidget />
            <MeetingsWidget />
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            ROW 6: DISCOURSE FEED | SOCIAL FEED
            ════════════════════════════════════════════════════════════════════ */}
        <div className="widget-row-deferred animate-in stagger-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DiscourseFeedWidget />
            <SocialFeedWidget />
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            FLOATING SIGNALS TICKER
            ════════════════════════════════════════════════════════════════════ */}
        <SignalsTicker />
      </div>
    </>
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
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 py-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[var(--color-ens-blue)] to-[var(--color-ens-purple)] flex items-center justify-center p-1.5 shadow-[0_0_20px_rgba(82,152,255,0.25)]">
          <img src="/ens-icon.svg" alt="ENS" className="w-full h-full" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold tracking-tight text-ens-gradient">
            PULSE
          </span>
          <span className="label" style={{ color: 'var(--color-text-primary)' }}>DAO Monitor</span>
        </div>
      </div>

      <div className="flex items-center gap-5 sm:gap-6">
        <div className="flex items-center gap-1.5">
          <span className="label">ETH</span>
          <span className="data-value text-sm text-[var(--color-text-primary)]">${ethPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="label">ENS</span>
          <span className="data-value text-sm text-[var(--color-text-primary)]">${ensPrice.toFixed(2)}</span>
        </div>
        <Badge variant="success" size="sm" dot>Live</Badge>
      </div>
    </div>
  );
}
