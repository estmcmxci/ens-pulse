import { NextResponse } from "next/server";
import { getLatestQueryResults } from "@/shared/lib/dune/client";
import { DUNE_QUERIES } from "@/shared/config/dune-queries";
import { getSnapshotFromDaysAgo, getSnapshotCount } from "@/shared/lib/db/client";

export const revalidate = 3600; // 1 hour cache

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

export async function GET() {
  try {
    // Fetch current values AND time series from Dune
    const [
      ensCreatedResult,
      participantsResult,
      primaryNamesResult,
      registrationsResult,
      newAddressesResult,
      contentHashResult,
      monthlyPrimaryNamesResult,
    ] = await Promise.all([
      getLatestQueryResults(DUNE_QUERIES.TOTAL_ENS_NAMES).catch(() => null),
      getLatestQueryResults(DUNE_QUERIES.UNIQUE_PARTICIPANTS).catch(() => null),
      getLatestQueryResults(DUNE_QUERIES.PRIMARY_NAMES_SET).catch(() => null),
      getLatestQueryResults(DUNE_QUERIES.MONTHLY_REGISTRATIONS).catch(() => null),
      getLatestQueryResults(DUNE_QUERIES.MONTHLY_NEW_ADDRESSES).catch(() => null),
      getLatestQueryResults(DUNE_QUERIES.TOTAL_DWEB_SET).catch(() => null),
      getLatestQueryResults(DUNE_QUERIES.MONTHLY_PRIMARY_NAMES).catch(() => null),
    ]);

    // Extract single value from counter queries
    const extractValue = (result: Awaited<ReturnType<typeof getLatestQueryResults>>): number | null => {
      if (!result?.rows?.[0]) return null;
      const row = result.rows[0] as Record<string, unknown>;
      const value = row.count ?? row.total ?? row.cnt ?? row.value ?? Object.values(row)[0];
      return typeof value === "number" ? value : Number(value) || null;
    };

    // Helper to find date column value from a row
    const getDateFromRow = (row: Record<string, unknown>): Date => {
      // Try common date column names, then fall back to _col0, then first string that looks like a date
      const dateValue = row.month ?? row.date ?? row.period ?? row._col0 ??
                        Object.values(row).find(v => typeof v === "string" && v.includes("-"));
      return new Date(String(dateValue ?? ""));
    };

    // Helper to find numeric value from a row
    const getValueFromRow = (row: Record<string, unknown>): number | null => {
      const val = row.registrations ?? row.new_addresses ?? row.primary_names ??
                  row.count ?? row.value ?? row.total ?? row._col1 ??
                  Object.values(row).find(v => typeof v === "number");
      return typeof val === "number" ? val : Number(val) || null;
    };

    // For time series, get the most recent value
    const extractLatestFromSeries = (result: Awaited<ReturnType<typeof getLatestQueryResults>>): number | null => {
      if (!result?.rows?.length) return null;
      const rows = [...result.rows] as Array<Record<string, unknown>>;
      rows.sort((a, b) => getDateFromRow(b).getTime() - getDateFromRow(a).getTime());
      return getValueFromRow(rows[0]);
    };

    // Current values
    const currentValues = {
      totalEnsCreated: extractValue(ensCreatedResult),
      uniqueParticipants: extractValue(participantsResult),
      totalPrimaryNames: extractValue(primaryNamesResult),
      monthlyRegistrations: extractLatestFromSeries(registrationsResult),
      monthlyNewAddresses: extractLatestFromSeries(newAddressesResult),
      totalContentHash: extractValue(contentHashResult),
    };

    // Try to get snapshot from 30 days ago for delta calculation
    let snapshot30DaysAgo: Record<string, unknown> | null = null;
    let snapshotCount = 0;
    let useDatabase = false;

    try {
      snapshot30DaysAgo = await getSnapshotFromDaysAgo(30);
      snapshotCount = await getSnapshotCount();
      useDatabase = snapshotCount >= 30 && snapshot30DaysAgo !== null;
    } catch {
      // Database not available, will use Dune fallback
    }

    // Calculate delta using database snapshots
    const createMetricFromDatabase = (
      currentValue: number | null,
      snapshotKey: string
    ): MetricWithDelta => {
      if (currentValue === null || !snapshot30DaysAgo) {
        return { value: currentValue, previousValue: null, delta: null, deltaPercent: null };
      }

      const previousValue = snapshot30DaysAgo[snapshotKey] as number | null;
      if (previousValue === null || previousValue === 0) {
        return { value: currentValue, previousValue: null, delta: null, deltaPercent: null };
      }

      const delta = currentValue - previousValue;
      const deltaPercent = (delta / previousValue) * 100;

      return { value: currentValue, previousValue, delta, deltaPercent };
    };

    // Calculate delta using Dune time series (fallback) - estimates 30-day growth
    // For cumulative counters: growth % = recent_additions / previous_total
    const createMetricFromDune = (
      totalValue: number | null,
      monthlyResult: Awaited<ReturnType<typeof getLatestQueryResults>>
    ): MetricWithDelta => {
      if (totalValue === null || !monthlyResult?.rows?.length) {
        return { value: totalValue, previousValue: null, delta: null, deltaPercent: null };
      }

      const rows = [...monthlyResult.rows] as Array<Record<string, unknown>>;
      rows.sort((a, b) => getDateFromRow(b).getTime() - getDateFromRow(a).getTime());

      const recentAdditions = getValueFromRow(rows[0]);
      if (recentAdditions === null || recentAdditions <= 0) {
        return { value: totalValue, previousValue: null, delta: null, deltaPercent: null };
      }

      const previousTotal = totalValue - recentAdditions;
      if (previousTotal <= 0) {
        return { value: totalValue, previousValue: null, delta: null, deltaPercent: null };
      }

      const deltaPercent = (recentAdditions / previousTotal) * 100;

      return {
        value: totalValue,
        previousValue: previousTotal,
        delta: recentAdditions,
        deltaPercent,
      };
    };

    // Compare most recent month vs previous month
    const createMonthOverMonthMetric = (
      result: Awaited<ReturnType<typeof getLatestQueryResults>>
    ): MetricWithDelta => {
      if (!result?.rows?.length) {
        return { value: null, previousValue: null, delta: null, deltaPercent: null };
      }

      const rows = [...result.rows] as Array<Record<string, unknown>>;
      rows.sort((a, b) => getDateFromRow(b).getTime() - getDateFromRow(a).getTime());

      const currentValue = getValueFromRow(rows[0]);
      const previousValue = rows.length > 1 ? getValueFromRow(rows[1]) : null;

      if (currentValue === null) {
        return { value: null, previousValue: null, delta: null, deltaPercent: null };
      }

      if (previousValue === null || previousValue === 0) {
        return { value: currentValue, previousValue: null, delta: null, deltaPercent: null };
      }

      const delta = currentValue - previousValue;
      const deltaPercent = (delta / previousValue) * 100;

      return { value: currentValue, previousValue, delta, deltaPercent };
    };

    let stats: ENSStatsResponse;

    if (useDatabase) {
      // Use database snapshots for accurate 30-day deltas
      stats = {
        totalEnsCreated: createMetricFromDatabase(currentValues.totalEnsCreated, "total_ens_created"),
        uniqueParticipants: createMetricFromDatabase(currentValues.uniqueParticipants, "unique_participants"),
        totalPrimaryNames: createMetricFromDatabase(currentValues.totalPrimaryNames, "total_primary_names"),
        monthlyRegistrations: createMetricFromDatabase(currentValues.monthlyRegistrations, "monthly_registrations"),
        monthlyNewAddresses: createMetricFromDatabase(currentValues.monthlyNewAddresses, "monthly_new_addresses"),
        totalContentHash: createMetricFromDatabase(currentValues.totalContentHash, "total_content_hash"),
        lastUpdated: new Date().toISOString(),
        hasHistoricalData: true,
        daysOfHistory: snapshotCount,
        dataSource: "database",
      };
    } else {
      // Fall back to Dune time series
      // For cumulative totals: show growth % (additions / previous_total)
      // For rate metrics: show month-over-month % change

      const registrationsMoM = createMonthOverMonthMetric(registrationsResult);
      const newAddressesMoM = createMonthOverMonthMetric(newAddressesResult);
      const primaryNamesMoM = createMonthOverMonthMetric(monthlyPrimaryNamesResult);

      // Calculate growth of total for cumulative metrics
      const calcGrowthOfTotal = (
        currentTotal: number | null,
        recentAdditions: number | null
      ): MetricWithDelta => {
        if (currentTotal === null || recentAdditions === null || recentAdditions <= 0) {
          return { value: currentTotal, previousValue: null, delta: null, deltaPercent: null };
        }
        const previousTotal = currentTotal - recentAdditions;
        if (previousTotal <= 0) {
          return { value: currentTotal, previousValue: null, delta: null, deltaPercent: null };
        }
        const deltaPercent = (recentAdditions / previousTotal) * 100;
        return {
          value: currentTotal,
          previousValue: previousTotal,
          delta: recentAdditions,
          deltaPercent,
        };
      };

      stats = {
        // Cumulative totals - show growth % of the total
        totalEnsCreated: calcGrowthOfTotal(currentValues.totalEnsCreated, registrationsMoM.value),
        uniqueParticipants: calcGrowthOfTotal(currentValues.uniqueParticipants, newAddressesMoM.value),
        totalPrimaryNames: calcGrowthOfTotal(currentValues.totalPrimaryNames, primaryNamesMoM.value),
        // Rate metrics - show month-over-month % change
        monthlyRegistrations: registrationsMoM,
        monthlyNewAddresses: newAddressesMoM,
        // No monthly series for ContentHash
        totalContentHash: {
          value: currentValues.totalContentHash,
          previousValue: null,
          delta: null,
          deltaPercent: null
        },
        lastUpdated: new Date().toISOString(),
        hasHistoricalData: false,
        daysOfHistory: snapshotCount,
        dataSource: "dune_estimate",
      };
    }

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching ENS stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ENS stats" },
      { status: 500 }
    );
  }
}
