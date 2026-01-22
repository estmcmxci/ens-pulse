import { NextResponse } from "next/server";
import { fetchTokenPrices } from "@/shared/lib/market/client";

export const revalidate = 300; // 5 minute cache

export async function GET() {
  try {
    const prices = await fetchTokenPrices();

    return NextResponse.json({
      success: true,
      data: {
        prices,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching market data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}
