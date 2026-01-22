import { NextRequest, NextResponse } from "next/server";
import {
  fetchProposalContext,
  isPonderAvailable,
} from "@/shared/lib/ponder/client";
import { fetchTokenPrices, fetchGasPrices } from "@/shared/lib/market/client";

export const revalidate = 300; // 5 minute cache

export interface ContextSnapshot {
  label: string;
  timestamp: string;
  ethPrice: number;
  ensPrice: number;
  treasuryValueUsd: number;
  gasPrice: number;
}

export interface HistoricalContextResponse {
  proposalId: string;
  hasIndexedContext: boolean;
  createdSnapshot: ContextSnapshot;
  currentSnapshot: ContextSnapshot;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const proposalId = searchParams.get("proposalId");

  if (!proposalId) {
    return NextResponse.json(
      { success: false, error: "proposalId is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch current market data for comparison
    const [currentPrices, currentGas] = await Promise.all([
      fetchTokenPrices().catch(() => ({ eth: null, ens: null, btc: null })),
      fetchGasPrices().catch(() => null),
    ]);

    // Build current snapshot
    const currentSnapshot: ContextSnapshot = {
      label: "Current",
      timestamp: new Date().toISOString(),
      ethPrice: currentPrices?.eth?.current_price || 3200,
      ensPrice: currentPrices?.ens?.current_price || 22,
      treasuryValueUsd: 52000000, // This would come from treasury API in production
      gasPrice: currentGas?.average || 15,
    };

    // Try to fetch indexed context from Ponder
    const ponderAvailable = await isPonderAvailable();

    if (ponderAvailable) {
      try {
        const contextResponse = await fetchProposalContext(proposalId);

        if (contextResponse.success && contextResponse.data.hasContext) {
          const ctx = contextResponse.data.context!;

          // Convert bigint strings to numbers (prices stored as wei/gwei scaled)
          const createdSnapshot: ContextSnapshot = {
            label: "Proposal Created",
            timestamp: new Date(
              Number(ctx.createdTimestamp) * 1000
            ).toISOString(),
            ethPrice: Number(ctx.createdEthPrice) / 1e8, // Chainlink 8 decimals
            ensPrice: Number(ctx.createdEnsPrice) / 1e8,
            treasuryValueUsd: Number(ctx.createdTreasuryUsd) / 1e6, // USD 6 decimals
            gasPrice: Number(ctx.createdGasPrice) / 1e9, // gwei
          };

          return NextResponse.json({
            success: true,
            data: {
              proposalId,
              hasIndexedContext: true,
              createdSnapshot,
              currentSnapshot,
            } as HistoricalContextResponse,
          });
        }
      } catch (error) {
        console.warn("Failed to fetch Ponder context:", error);
      }
    }

    // Fallback: Return mock created snapshot when Ponder data unavailable
    const mockCreatedSnapshot: ContextSnapshot = {
      label: "Proposal Created",
      timestamp: "2024-01-15T10:00:00Z",
      ethPrice: 2500,
      ensPrice: 18,
      treasuryValueUsd: 45000000,
      gasPrice: 25,
    };

    return NextResponse.json({
      success: true,
      data: {
        proposalId,
        hasIndexedContext: false,
        createdSnapshot: mockCreatedSnapshot,
        currentSnapshot,
      } as HistoricalContextResponse,
    });
  } catch (error) {
    console.error("Error fetching historical context:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch historical context" },
      { status: 500 }
    );
  }
}
