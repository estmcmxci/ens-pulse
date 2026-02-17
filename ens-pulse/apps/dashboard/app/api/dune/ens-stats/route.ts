import { NextResponse } from "next/server";
import { getLatestQueryResults } from "@/shared/lib/dune/client";
import { DUNE_QUERIES } from "@/shared/config/dune-queries";

export const dynamic = "force-dynamic"; // Always fetch fresh — avoid baking stale/failed data at build time

interface MetricWithDelta {
  value: number | null;
  previousValue: number | null;
  delta: number | null;
  deltaPercent: number | null;
}

interface ENSStatsResponse {
  totalEnsCreated: MetricWithDelta;
  uniqueParticipants: MetricWithDelta;
  totalPrimaryNames: MetricWithDelta;
  monthlyRegistrations: MetricWithDelta;
  monthlyNewAddresses: MetricWithDelta;
  totalContentHash: MetricWithDelta;
  lastUpdated: string;
  hasHistoricalData: boolean;
  daysOfHistory: number;
  dataSource: "database" | "dune_estimate";
}

function makeMetric(value: number | null, previousValue: number | null): MetricWithDelta {
  if (value === null) {
    return { value: null, previousValue: null, delta: null, deltaPercent: null };
  }
  if (previousValue === null || previousValue === 0) {
    return { value, previousValue: null, delta: null, deltaPercent: null };
  }
  const delta = value - previousValue;
  const deltaPercent = (delta / previousValue) * 100;
  return { value, previousValue, delta, deltaPercent };
}

const nullMetric: MetricWithDelta = { value: null, previousValue: null, delta: null, deltaPercent: null };

export async function GET() {
  try {
    // Single consolidated query replaces 7 separate Dune API calls
    const result = await getLatestQueryResults(DUNE_QUERIES.PULSE_PROTOCOL_STATS).catch(() => null);

    if (!result?.rows?.[0]) {
      return NextResponse.json({
        success: true,
        data: {
          totalEnsCreated: nullMetric,
          uniqueParticipants: nullMetric,
          totalPrimaryNames: nullMetric,
          monthlyRegistrations: nullMetric,
          monthlyNewAddresses: nullMetric,
          totalContentHash: nullMetric,
          lastUpdated: new Date().toISOString(),
          hasHistoricalData: false,
          daysOfHistory: 0,
          dataSource: "dune_estimate",
        } satisfies ENSStatsResponse,
      });
    }

    const row = result.rows[0] as Record<string, unknown>;

    const totalNames = Number(row.total_active_names) || null;
    const participants = Number(row.unique_participants) || null;
    const primaryNames = Number(row.primary_names_set) || null;
    const currentMonthRegs = Number(row.current_month_registrations) || null;
    const prevMonthRegs = Number(row.prev_month_registrations) || null;
    const currentMonthNewAddrs = Number(row.current_month_new_addresses) || null;
    const prevMonthNewAddrs = Number(row.prev_month_new_addresses) || null;

    // For cumulative totals, estimate 30-day delta from monthly additions
    // previous_total ≈ current_total - this_month_additions
    const totalNamesPrev = totalNames && currentMonthRegs
      ? totalNames - currentMonthRegs : null;
    const participantsPrev = participants && currentMonthNewAddrs
      ? participants - currentMonthNewAddrs : null;

    const stats: ENSStatsResponse = {
      totalEnsCreated: makeMetric(totalNames, totalNamesPrev),
      uniqueParticipants: makeMetric(participants, participantsPrev),
      totalPrimaryNames: makeMetric(primaryNames, null), // No monthly breakdown available
      monthlyRegistrations: makeMetric(currentMonthRegs, prevMonthRegs),
      monthlyNewAddresses: makeMetric(currentMonthNewAddrs, prevMonthNewAddrs),
      totalContentHash: nullMetric, // Not included in consolidated query
      lastUpdated: new Date().toISOString(),
      hasHistoricalData: true,
      daysOfHistory: 30,
      dataSource: "dune_estimate",
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error("Error fetching ENS stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ENS stats" },
      { status: 500 }
    );
  }
}
