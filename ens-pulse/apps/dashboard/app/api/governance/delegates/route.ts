import { NextResponse } from "next/server";
import { formatEther } from "viem";
import {
  fetchTallyDelegates,
  fetchTallyGovernor,
  type TallyDelegate,
} from "@/shared/lib/tally/client";

export const revalidate = 300; // 5 minute cache

export interface Delegate {
  address: string;
  ensName: string | null;
  name: string | null;
  bio: string | null;
  picture: string | null;
  votingPower: string;
  votingPowerFormatted: string;
  votingPowerPercent: number;
  delegatorsCount: number;
  statement: string | null;
  isSeekingDelegation: boolean;
}

/**
 * Transforms Tally delegate to API response format
 */
function transformTallyDelegate(
  d: TallyDelegate,
  totalSupply: bigint
): Delegate {
  const votingPowerBigInt = BigInt(d.votesCount);
  const votingPowerPercent = totalSupply > 0n
    ? (Number(votingPowerBigInt) / Number(totalSupply)) * 100
    : 0;

  return {
    address: d.account.address,
    ensName: d.account.ens,
    name: d.account.name,
    bio: d.account.bio,
    picture: d.account.picture,
    votingPower: d.votesCount,
    votingPowerFormatted: formatEther(votingPowerBigInt),
    votingPowerPercent,
    delegatorsCount: d.delegatorsCount,
    statement: d.statement?.statementSummary || d.statement?.statement || null,
    isSeekingDelegation: d.statement?.isSeekingDelegation ?? false,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1), 100);

    // Fetch delegates and governor info from Tally
    try {
      const [delegatesResult, governor] = await Promise.all([
        fetchTallyDelegates({ limit }),
        fetchTallyGovernor(),
      ]);

      // Get total supply from governor token info
      const totalSupply = BigInt(governor.token.supply);

      const delegates = delegatesResult.delegates.map((d) =>
        transformTallyDelegate(d, totalSupply)
      );

      return NextResponse.json({
        success: true,
        data: {
          delegates,
          totalSupply: totalSupply.toString(),
          totalSupplyFormatted: formatEther(totalSupply),
          totalDelegates: governor.delegatesCount,
          totalDelegatesVotesCount: governor.delegatesVotesCount,
          tokenOwnersCount: governor.tokenOwnersCount,
          // Governance parameters for attack analysis
          quorum: governor.quorum,
          quorumFormatted: formatEther(BigInt(governor.quorum)),
          proposalStats: governor.proposalStats,
          lastUpdated: new Date().toISOString(),
          source: "tally",
        },
      });
    } catch (tallyError) {
      console.error("Tally API error:", tallyError);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch delegates from Tally API",
          details: tallyError instanceof Error ? tallyError.message : "Unknown error",
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Error fetching delegates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch delegates" },
      { status: 500 }
    );
  }
}
