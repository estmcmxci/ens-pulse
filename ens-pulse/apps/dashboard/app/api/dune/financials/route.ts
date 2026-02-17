import { NextResponse } from "next/server";
import { getLatestQueryResults } from "@/shared/lib/dune/client";
import { DUNE_QUERIES } from "@/shared/config/dune-queries";
import { fetchEnsTreasury } from "@/shared/lib/defillama/client";

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
    // Fetch consolidated revenue stats (Dune) + treasury total (DefiLlama) in parallel
    const [result, treasury] = await Promise.all([
      getLatestQueryResults(DUNE_QUERIES.PULSE_REVENUE_STATS).catch(() => null),
      fetchEnsTreasury().catch(() => null),
    ]);

    // Parse DefiLlama treasury data
    let totalAssets: MetricWithDelta = nullMetric;
    let endowment: FinancialsResponse["endowment"] = null;

    if (treasury) {
      // Derive previous-day value from the 1-day percent change
      const prevValue = treasury.change1d !== null
        ? treasury.tvl / (1 + treasury.change1d / 100)
        : null;
      totalAssets = makeMetric(treasury.tvl, prevValue);

      endowment = {
        eth: treasury.tokenBreakdowns.majors,
        usdc: treasury.tokenBreakdowns.stablecoins,
        other: treasury.tokenBreakdowns.others,
        total: treasury.tvl,
      };
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
          endowment,
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
      endowment,
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
