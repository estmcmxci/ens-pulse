import { NextResponse } from "next/server";

export const revalidate = 60; // 1 minute cache

/**
 * Pending transactions endpoint
 * Note: Currently returns empty data since we use direct on-chain reads
 * for multisig data instead of Safe Transaction Service API.
 *
 * To get pending transactions, we would need to re-enable Safe API
 * or implement an alternative solution.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      transactions: [],
      totalCount: 0,
      note: "Pending transactions require Safe Transaction Service API integration",
      lastUpdated: new Date().toISOString(),
    },
  });
}
