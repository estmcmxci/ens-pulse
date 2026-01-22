import { NextResponse } from "next/server";
import { fetchGasPrices } from "@/shared/lib/market/client";

export const revalidate = 60; // 1 minute cache

export async function GET() {
  try {
    const gas = await fetchGasPrices();

    return NextResponse.json({
      success: true,
      data: {
        gas,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching gas prices:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch gas prices" },
      { status: 500 }
    );
  }
}
