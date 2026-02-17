import { NextResponse } from "next/server";
import { getLatestQueryResults } from "@/shared/lib/dune/client";
import { DUNE_QUERIES } from "@/shared/config/dune-queries";

// Helpers for flexible Steakhouse row parsing
function getDateFromRow(row: Record<string, unknown>): Date {
  for (const key of ["day", "date", "period", "time"]) {
    if (row[key]) return new Date(String(row[key]));
  }
  return new Date(0);
}

function getValueFromRow(row: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      const v = Number(row[key]);
      if (!isNaN(v)) return v;
    }
  }
  return null;
}

export const dynamic = "force-dynamic"; // Always fetch fresh — avoid baking stale/failed data at build time

interface MetricWithDelta {
  value: number | null;
  previousValue: number | null;
  delta: number | null;
  deltaPercent: number | null;
}

interface FinancialsResponse {
  dailyRevenue: MetricWithDelta;
  monthlyRevenue: MetricWithDelta;
  yearlyRevenue: MetricWithDelta;
  totalAssets: MetricWithDelta;
  ensPrice: MetricWithDelta;
  dailyRegistrations: MetricWithDelta;
  endowment: {
    eth: number;
    usdc: number;
    other: number;
    total: number;
  } | null;
  lastUpdated: string;
  dataSource: string;
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
    // Fetch consolidated revenue stats + Steakhouse total assets in parallel
    const [result, totalAssetsResult] = await Promise.all([
      getLatestQueryResults(DUNE_QUERIES.PULSE_REVENUE_STATS).catch(() => null),
      getLatestQueryResults(DUNE_QUERIES.STEAKHOUSE_TOTAL_ASSETS).catch(() => null),
    ]);

    // Parse Steakhouse total assets (time series rows sorted by date)
    let totalAssets: MetricWithDelta = nullMetric;
    if (totalAssetsResult?.rows?.length) {
      const rows = [...totalAssetsResult.rows] as Array<Record<string, unknown>>;
      rows.sort((a, b) => getDateFromRow(b).getTime() - getDateFromRow(a).getTime());

      const latest = getValueFromRow(rows[0], "total_assets", "total", "balance", "usd_value", "value");

      // Find value from ~30 days ago for delta
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const prevRow = rows.find(r => getDateFromRow(r) <= thirtyDaysAgo);
      const prevValue = prevRow ? getValueFromRow(prevRow, "total_assets", "total", "balance", "usd_value", "value") : null;

      if (latest !== null) {
        totalAssets = makeMetric(latest, prevValue);
      }
    }

    if (!result?.rows?.[0]) {
      return NextResponse.json({
        success: true,
        data: {
          dailyRevenue: nullMetric,
          monthlyRevenue: nullMetric,
          yearlyRevenue: nullMetric,
          totalAssets,
          ensPrice: nullMetric,
          dailyRegistrations: nullMetric,
          endowment: null,
          lastUpdated: new Date().toISOString(),
          dataSource: "ens_pulse_custom",
        } satisfies FinancialsResponse,
      });
    }

    const row = result.rows[0] as Record<string, unknown>;

    const dailyRegs = Number(row.daily_registrations) || null;
    const prevDailyRegs = Number(row.prev_daily_registrations) || null;
    const dailyRevenueUsd = Number(row.daily_revenue_usd) || null;
    const prevDailyRevenueUsd = Number(row.prev_daily_revenue_usd) || null;
    const monthlyRevenueUsd = Number(row.monthly_revenue_usd) || null;
    const prevMonthlyRevenueUsd = Number(row.prev_monthly_revenue_usd) || null;

    const response: FinancialsResponse = {
      dailyRevenue: makeMetric(dailyRevenueUsd, prevDailyRevenueUsd),
      monthlyRevenue: makeMetric(monthlyRevenueUsd, prevMonthlyRevenueUsd),
      yearlyRevenue: nullMetric, // Not in consolidated query (only 65 days of data)
      totalAssets,
      ensPrice: nullMetric,      // Now handled by CoinGecko via useMarketData
      dailyRegistrations: makeMetric(dailyRegs, prevDailyRegs),
      endowment: null,           // Not in consolidated query
      lastUpdated: new Date().toISOString(),
      dataSource: "ens_pulse_custom",
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error("Error fetching financials:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch financial data" },
      { status: 500 }
    );
  }
}
