import { NextResponse } from "next/server";
import { getLatestQueryResults } from "@/shared/lib/dune/client";
import { DUNE_QUERIES } from "@/shared/config/dune-queries";
import { initializeDatabase, saveSnapshot } from "@/shared/lib/db/client";

// Vercel Cron: Run daily at midnight UTC
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Protect the endpoint with a secret (optional but recommended)
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  // Verify cron secret if configured
  if (CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    // Initialize database (creates table if not exists)
    const dbReady = await initializeDatabase();
    if (!dbReady) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 }
      );
    }

    // Fetch current values from Dune
    const [
      ensCreatedResult,
      participantsResult,
      primaryNamesResult,
      registrationsResult,
      newAddressesResult,
      contentHashResult,
    ] = await Promise.all([
      getLatestQueryResults(DUNE_QUERIES.TOTAL_ENS_NAMES).catch(() => null),
      getLatestQueryResults(DUNE_QUERIES.UNIQUE_PARTICIPANTS).catch(() => null),
      getLatestQueryResults(DUNE_QUERIES.PRIMARY_NAMES_SET).catch(() => null),
      getLatestQueryResults(DUNE_QUERIES.MONTHLY_REGISTRATIONS).catch(() => null),
      getLatestQueryResults(DUNE_QUERIES.MONTHLY_NEW_ADDRESSES).catch(() => null),
      getLatestQueryResults(DUNE_QUERIES.TOTAL_DWEB_SET).catch(() => null),
    ]);

    // Extract values
    const extractValue = (result: Awaited<ReturnType<typeof getLatestQueryResults>>): number | null => {
      if (!result?.rows?.[0]) return null;
      const row = result.rows[0] as Record<string, unknown>;
      const value = row.count ?? row.total ?? row.cnt ?? row.value ?? Object.values(row)[0];
      return typeof value === "number" ? value : Number(value) || null;
    };

    // For time series, get the most recent complete month's value
    const extractLatestFromSeries = (result: Awaited<ReturnType<typeof getLatestQueryResults>>): number | null => {
      if (!result?.rows?.length) return null;
      const rows = [...result.rows] as Array<Record<string, unknown>>;
      rows.sort((a, b) => {
        const dateA = new Date(String(a.month ?? a.date ?? a.period ?? "")).getTime();
        const dateB = new Date(String(b.month ?? b.date ?? b.period ?? "")).getTime();
        return dateB - dateA;
      });
      const row = rows[0];
      const val = row.registrations ?? row.new_addresses ?? row.count ?? row.value ??
                  Object.values(row).find(v => typeof v === "number");
      return typeof val === "number" ? val : Number(val) || null;
    };

    const snapshot = {
      totalEnsCreated: extractValue(ensCreatedResult),
      uniqueParticipants: extractValue(participantsResult),
      totalPrimaryNames: extractValue(primaryNamesResult),
      monthlyRegistrations: extractLatestFromSeries(registrationsResult),
      monthlyNewAddresses: extractLatestFromSeries(newAddressesResult),
      totalContentHash: extractValue(contentHashResult),
    };

    // Save to database
    await saveSnapshot(snapshot);

    return NextResponse.json({
      success: true,
      message: "Snapshot saved successfully",
      data: snapshot,
      date: new Date().toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Error saving ENS stats snapshot:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save snapshot" },
      { status: 500 }
    );
  }
}
