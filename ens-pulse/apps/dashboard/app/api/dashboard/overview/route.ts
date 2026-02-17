import { NextResponse } from "next/server";
import { getDashboardInitialData } from "@/shared/lib/data/dashboard";

// Dynamic route - fetch fresh data on each request
export const dynamic = "force-dynamic";

/**
 * Aggregated dashboard API endpoint
 * Fetches all initial dashboard data in parallel for optimal performance
 */
export async function GET() {
  try {
    const data = await getDashboardInitialData();

    return NextResponse.json({
      success: true,
      data,
      lastUpdated: data.fetchedAt,
    });
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
