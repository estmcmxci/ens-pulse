import { NextResponse } from "next/server";
import { type ProposalStatus } from "@/shared/config/ens";
import {
  fetchTallyProposals,
  fetchTallyGovernor,
  mapTallyStatus,
  extractVoteCounts,
  type TallyProposal,
} from "@/shared/lib/tally/client";
import { summarize } from "@/shared/lib/feeds/summarizer";

export const revalidate = 60; // 1 minute cache

// Valid proposal statuses for validation
const VALID_STATUSES = ["pending", "active", "canceled", "defeated", "succeeded", "queued", "expired", "executed"] as const;

function isValidStatus(value: string | null): value is ProposalStatus {
  return value !== null && VALID_STATUSES.includes(value as ProposalStatus);
}

interface Proposal {
  id: string;
  onchainId: string;
  title: string;
  description: string;
  summary: string | null;
  status: ProposalStatus;
  proposer: {
    address: string;
    ensName: string | null;
    name: string | null;
  };
  votes: {
    for: string;
    against: string;
    abstain: string;
  };
  quorum: string;
  startBlock: number | null;
  endBlock: number | null;
  startTime: string | null;
  endTime: string | null;
  discourseUrl: string | null;
  createdAt: string | null;
}

/**
 * Transforms Tally proposal to API response format (without summary)
 */
function transformTallyProposal(p: TallyProposal): Omit<Proposal, 'summary'> {
  const votes = extractVoteCounts(p.voteStats);

  return {
    id: p.id,
    onchainId: p.onchainId,
    title: p.metadata.title || `Proposal ${p.onchainId}`,
    description: p.metadata.description || "",
    status: mapTallyStatus(p.status),
    proposer: {
      address: p.proposer.address,
      ensName: p.proposer.ens,
      name: p.proposer.name,
    },
    votes,
    quorum: p.quorum,
    startBlock: p.start?.number ?? null,
    endBlock: p.end?.number ?? null,
    startTime: p.start?.timestamp ?? null,
    endTime: p.end?.timestamp ?? null,
    discourseUrl: p.metadata.discourseURL,
    createdAt: p.start?.timestamp ?? null,
  };
}

/**
 * Generates a summary for a proposal using Claude
 */
async function generateProposalSummary(proposal: Omit<Proposal, 'summary'>): Promise<string | null> {
  // Create content for summarization: title + truncated description
  const content = `Title: ${proposal.title}\n\nDescription: ${proposal.description}`;
  const cacheKey = `proposal:${proposal.id}`;

  try {
    const summary = await summarize(content, 'proposal', cacheKey);
    return summary || null;
  } catch (error) {
    console.error(`Failed to summarize proposal ${proposal.id}:`, error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const limitParam = searchParams.get("limit");

    // Validate status parameter
    const status = isValidStatus(statusParam) ? statusParam : null;

    // Validate limit parameter (clamp to reasonable range)
    const limit = Math.min(Math.max(parseInt(limitParam || "20", 10) || 20, 1), 100);

    // Fetch from Tally API
    try {
      const [tallyResult, governor] = await Promise.all([
        fetchTallyProposals({ limit }),
        fetchTallyGovernor(),
      ]);

      let baseProposals = tallyResult.proposals.map(transformTallyProposal);

      // Filter by status if provided
      if (status) {
        baseProposals = baseProposals.filter((p) => p.status === status);
      }

      // Generate summaries in parallel (with concurrency limit)
      const proposals: Proposal[] = await Promise.all(
        baseProposals.map(async (p) => {
          const summary = await generateProposalSummary(p);
          return { ...p, summary };
        })
      );

      const activeCount = proposals.filter((p) => p.status === "active").length;
      const pendingCount = proposals.filter((p) => p.status === "pending").length;

      return NextResponse.json({
        success: true,
        data: {
          proposals,
          totalCount: governor.proposalStats.total,
          activeCount: governor.proposalStats.active,
          pendingCount,
          passedCount: governor.proposalStats.passed,
          failedCount: governor.proposalStats.failed,
          lastUpdated: new Date().toISOString(),
          source: "tally",
        },
      });
    } catch (tallyError) {
      console.error("Tally API error:", tallyError);

      // Return error response if Tally fails
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch proposals from Tally API",
          details: tallyError instanceof Error ? tallyError.message : "Unknown error",
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch proposals" },
      { status: 500 }
    );
  }
}
