import { NextResponse } from "next/server";
import {
  fetchENSNodeHealth,
  type ENSNodeHealth,
} from "@/shared/lib/ensnode/client";

export const revalidate = 60; // 1 minute cache

/**
 * GET /api/context/protocol
 *
 * Returns ENS Node protocol health status including:
 * - Configuration info
 * - Indexing status across chains
 * - Overall health status
 * - API latency
 */
export async function GET() {
  try {
    const health = await fetchENSNodeHealth();

    // If ENS Node API is unavailable, return mock data for development
    if (!health.indexingStatus && !health.config) {
      const mockHealth: ENSNodeHealth = {
        config: {
          version: "1.0.0",
          networks: ["mainnet", "base", "linea"],
          features: ["subgraph-compat", "multichain"],
        },
        indexingStatus: {
          status: "following",
          omnichainIndexingCursor: Math.floor(Date.now() / 1000) - 10,
          slowestChainCursor: Math.floor(Date.now() / 1000) - 15,
          chains: [
            {
              chainId: "1",
              chainName: "Ethereum",
              status: "following",
              latestIndexedBlock: { number: 21850000, timestamp: Date.now() / 1000 - 12 },
              latestKnownBlock: { number: 21850001, timestamp: Date.now() / 1000 },
              progressPercent: 100,
              blocksRemaining: 1,
            },
            {
              chainId: "8453",
              chainName: "Base",
              status: "following",
              latestIndexedBlock: { number: 25600000, timestamp: Date.now() / 1000 - 8 },
              latestKnownBlock: { number: 25600002, timestamp: Date.now() / 1000 },
              progressPercent: 100,
              blocksRemaining: 2,
            },
            {
              chainId: "59144",
              chainName: "Linea",
              status: "following",
              latestIndexedBlock: { number: 15200000, timestamp: Date.now() / 1000 - 6 },
              latestKnownBlock: { number: 15200001, timestamp: Date.now() / 1000 },
              progressPercent: 100,
              blocksRemaining: 1,
            },
          ],
          lastUpdated: new Date().toISOString(),
        },
        isHealthy: true,
        latency: 150,
        lastUpdated: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        data: mockHealth,
        source: "mock",
      });
    }

    return NextResponse.json({
      success: true,
      data: health,
      source: "ensnode",
    });
  } catch (error) {
    console.error("Error fetching protocol health:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch protocol health" },
      { status: 500 }
    );
  }
}
