import { NextResponse } from "next/server";
import { getLatestQueryResults } from "@/shared/lib/dune/client";
import { DUNE_QUERIES } from "@/shared/config/dune-queries";

export const revalidate = 3600; // 1 hour cache

interface MetricWithDelta {
  value: number | null;
  previousValue: number | null;
  delta: number | null;
  deltaPercent: number | null;
}

interface FinancialsResponse {
  // Revenue metrics
  dailyRevenue: MetricWithDelta;
  monthlyRevenue: MetricWithDelta;
  yearlyRevenue: MetricWithDelta;
  // Treasury/Balance metrics
  totalAssets: MetricWithDelta;
  // ENS Price
  ensPrice: MetricWithDelta;
  // Daily registrations
  dailyRegistrations: MetricWithDelta;
  // Endowment breakdown
  endowment: {
    eth: number;
    usdc: number;
    other: number;
    total: number;
  } | null;
  // Metadata
  lastUpdated: string;
  dataSource: string;
}

export async function GET() {
  try {
    // Fetch from Steakhouse Dune queries in parallel
    const [
      dailyRevenuesResult,
      totalAssetsResult,
      endowmentResult,
      ensPriceResult,
      dailyRegistrationsResult,
    ] = await Promise.all([
      getLatestQueryResults(DUNE_QUERIES.STEAKHOUSE_DAILY_REVENUES).catch(() => null),
      getLatestQueryResults(DUNE_QUERIES.STEAKHOUSE_TOTAL_ASSETS).catch(() => null),
      getLatestQueryResults(DUNE_QUERIES.STEAKHOUSE_ENDOWMENT_COMPOSITION).catch(() => null),
      getLatestQueryResults(DUNE_QUERIES.STEAKHOUSE_ENS_PRICE).catch(() => null),
      getLatestQueryResults(DUNE_QUERIES.STEAKHOUSE_DAILY_REGISTRATIONS).catch(() => null),
    ]);

    // Helper to get date from row
    const getDateFromRow = (row: Record<string, unknown>): Date => {
      const dateValue = row.day ?? row.date ?? row.period ?? row.time ??
        Object.values(row).find(v => typeof v === "string" && v.includes("-"));
      return new Date(String(dateValue ?? ""));
    };

    // Helper to get numeric value from row
    const getValueFromRow = (row: Record<string, unknown>, ...keys: string[]): number | null => {
      for (const key of keys) {
        const val = row[key];
        if (val !== undefined && val !== null) {
          return typeof val === "number" ? val : Number(val) || null;
        }
      }
      // Fall back to first numeric value
      const numericVal = Object.values(row).find(v => typeof v === "number");
      return typeof numericVal === "number" ? numericVal : null;
    };

    // Process daily revenues - get most recent days
    // Note: The Steakhouse query returns columns: rk, item, period, amount
    // Multiple "item" types per period (Short Name Claims, Registrations, Renewals, etc.)
    // We need to aggregate by period to get total daily revenue
    let dailyRevenue: MetricWithDelta = { value: null, previousValue: null, delta: null, deltaPercent: null };
    let monthlyRevenue: MetricWithDelta = { value: null, previousValue: null, delta: null, deltaPercent: null };
    let yearlyRevenue: MetricWithDelta = { value: null, previousValue: null, delta: null, deltaPercent: null };

    if (dailyRevenuesResult?.rows?.length) {
      const rows = [...dailyRevenuesResult.rows] as Array<Record<string, unknown>>;

      // Aggregate all items by period (day) to get total daily revenue
      const dailyTotals = new Map<string, number>();
      for (const row of rows) {
        const period = String(row.period ?? "").split(" ")[0]; // Extract just the date part
        if (!period) continue;
        const amount = getValueFromRow(row, "amount") || 0;
        dailyTotals.set(period, (dailyTotals.get(period) || 0) + amount);
      }

      // Convert to sorted array (most recent first)
      const sortedDays = Array.from(dailyTotals.entries())
        .map(([period, total]) => ({ period, total, date: new Date(period) }))
        .filter(d => !isNaN(d.date.getTime()))
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      // Latest daily revenue (most recent day with actual data > 0)
      // Skip days with 0 revenue as they may be unpopulated
      const daysWithRevenue = sortedDays.filter(d => d.total > 0);
      if (daysWithRevenue.length > 0) {
        const latestDaily = daysWithRevenue[0].total;
        const prevDaily = daysWithRevenue.length > 1 ? daysWithRevenue[1].total : null;

        dailyRevenue = {
          value: latestDaily,
          previousValue: prevDaily,
          delta: prevDaily !== null ? latestDaily - prevDaily : null,
          deltaPercent: prevDaily !== null && prevDaily !== 0 ? ((latestDaily - prevDaily) / prevDaily) * 100 : null,
        };
      }

      // Calculate 30-day revenue (monthly proxy)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const last30Days = sortedDays.filter(d => d.date >= thirtyDaysAgo);
      const prev30Days = sortedDays.filter(d => d.date >= sixtyDaysAgo && d.date < thirtyDaysAgo);

      const currentMonthlySum = last30Days.reduce((sum, d) => sum + d.total, 0);
      const prevMonthlySum = prev30Days.reduce((sum, d) => sum + d.total, 0);

      if (currentMonthlySum > 0) {
        monthlyRevenue = {
          value: currentMonthlySum,
          previousValue: prevMonthlySum > 0 ? prevMonthlySum : null,
          delta: prevMonthlySum > 0 ? currentMonthlySum - prevMonthlySum : null,
          deltaPercent: prevMonthlySum > 0 ? ((currentMonthlySum - prevMonthlySum) / prevMonthlySum) * 100 : null,
        };
      }

      // Calculate yearly revenue (365 days)
      const oneYearAgo = new Date();
      oneYearAgo.setDate(oneYearAgo.getDate() - 365);
      const twoYearsAgo = new Date();
      twoYearsAgo.setDate(twoYearsAgo.getDate() - 730);

      const last365Days = sortedDays.filter(d => d.date >= oneYearAgo);
      const prev365Days = sortedDays.filter(d => d.date >= twoYearsAgo && d.date < oneYearAgo);

      const currentYearlySum = last365Days.reduce((sum, d) => sum + d.total, 0);
      const prevYearlySum = prev365Days.reduce((sum, d) => sum + d.total, 0);

      if (currentYearlySum > 0) {
        yearlyRevenue = {
          value: currentYearlySum,
          previousValue: prevYearlySum > 0 ? prevYearlySum : null,
          delta: prevYearlySum > 0 ? currentYearlySum - prevYearlySum : null,
          deltaPercent: prevYearlySum > 0 ? ((currentYearlySum - prevYearlySum) / prevYearlySum) * 100 : null,
        };
      }
    }

    // Process total assets
    let totalAssets: MetricWithDelta = { value: null, previousValue: null, delta: null, deltaPercent: null };

    if (totalAssetsResult?.rows?.length) {
      const rows = [...totalAssetsResult.rows] as Array<Record<string, unknown>>;
      rows.sort((a, b) => getDateFromRow(b).getTime() - getDateFromRow(a).getTime());

      const latest = getValueFromRow(rows[0], "total_assets", "total", "balance", "usd_value", "value");

      // Find value from ~30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const prevRow = rows.find(r => getDateFromRow(r) <= thirtyDaysAgo);
      const prevValue = prevRow ? getValueFromRow(prevRow, "total_assets", "total", "balance", "usd_value", "value") : null;

      if (latest !== null) {
        totalAssets = {
          value: latest,
          previousValue: prevValue,
          delta: prevValue !== null ? latest - prevValue : null,
          deltaPercent: prevValue !== null && prevValue !== 0 ? ((latest - prevValue) / prevValue) * 100 : null,
        };
      }
    }

    // Process endowment composition
    let endowment: FinancialsResponse["endowment"] = null;

    if (endowmentResult?.rows?.length) {
      const rows = endowmentResult.rows as Array<Record<string, unknown>>;

      // Try to extract by asset type
      let ethValue = 0;
      let usdcValue = 0;
      let otherValue = 0;

      for (const row of rows) {
        const asset = String(row.asset ?? row.token ?? row.symbol ?? "").toLowerCase();
        const value = getValueFromRow(row, "usd_value", "value", "balance", "amount") || 0;

        if (asset.includes("eth") && !asset.includes("steth")) {
          ethValue += value;
        } else if (asset.includes("usdc") || asset.includes("usdt") || asset.includes("dai")) {
          usdcValue += value;
        } else {
          otherValue += value;
        }
      }

      // If no categorized values, try to get total from first row
      if (ethValue === 0 && usdcValue === 0 && otherValue === 0 && rows[0]) {
        const total = getValueFromRow(rows[0], "total", "total_usd", "value");
        if (total) {
          otherValue = total;
        }
      }

      const total = ethValue + usdcValue + otherValue;
      if (total > 0) {
        endowment = { eth: ethValue, usdc: usdcValue, other: otherValue, total };
      }
    }

    // Process ENS price
    let ensPrice: MetricWithDelta = { value: null, previousValue: null, delta: null, deltaPercent: null };

    if (ensPriceResult?.rows?.length) {
      const rows = [...ensPriceResult.rows] as Array<Record<string, unknown>>;
      rows.sort((a, b) => getDateFromRow(b).getTime() - getDateFromRow(a).getTime());

      const latest = getValueFromRow(rows[0], "price", "ens_price", "close", "value");
      const prev = rows.length > 1 ? getValueFromRow(rows[1], "price", "ens_price", "close", "value") : null;

      if (latest !== null) {
        ensPrice = {
          value: latest,
          previousValue: prev,
          delta: prev !== null ? latest - prev : null,
          deltaPercent: prev !== null && prev !== 0 ? ((latest - prev) / prev) * 100 : null,
        };
      }
    }

    // Process daily registrations
    let dailyRegistrations: MetricWithDelta = { value: null, previousValue: null, delta: null, deltaPercent: null };

    if (dailyRegistrationsResult?.rows?.length) {
      const rows = [...dailyRegistrationsResult.rows] as Array<Record<string, unknown>>;
      rows.sort((a, b) => getDateFromRow(b).getTime() - getDateFromRow(a).getTime());

      const latest = getValueFromRow(rows[0], "registrations", "count", "daily_registrations", "value");
      const prev = rows.length > 1 ? getValueFromRow(rows[1], "registrations", "count", "daily_registrations", "value") : null;

      if (latest !== null) {
        dailyRegistrations = {
          value: latest,
          previousValue: prev,
          delta: prev !== null ? latest - prev : null,
          deltaPercent: prev !== null && prev !== 0 ? ((latest - prev) / prev) * 100 : null,
        };
      }
    }

    const response: FinancialsResponse = {
      dailyRevenue,
      monthlyRevenue,
      yearlyRevenue,
      totalAssets,
      ensPrice,
      dailyRegistrations,
      endowment,
      lastUpdated: new Date().toISOString(),
      dataSource: "steakhouse_dune",
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error fetching financials:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch financial data" },
      { status: 500 }
    );
  }
}
