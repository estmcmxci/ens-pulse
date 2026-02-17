"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { Vote, Clock, CheckCircle2, XCircle } from "lucide-react";
import { formatNumber, formatTimeAgo } from "@/shared/lib/utils";
import { PROPOSAL_STATUS_COLORS, type ProposalStatus } from "@/shared/config/ens";

interface Proposal {
  id: string;
  onchainId: string;
  title: string;
  description: string;
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
}

interface ProposalsResponse {
  success: boolean;
  data: {
    proposals: Proposal[];
    totalCount: number;
    activeCount: number;
    pendingCount: number;
    lastUpdated: string;
    source: string;
  };
}

async function fetchProposals(): Promise<ProposalsResponse> {
  const res = await fetch("/api/governance/proposals?limit=5");
  if (!res.ok) throw new Error("Failed to fetch proposals");
  return res.json();
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  const totalVotes =
    BigInt(proposal.votes.for) +
    BigInt(proposal.votes.against) +
    BigInt(proposal.votes.abstain);

  const forPercent =
    totalVotes > 0n
      ? (Number(BigInt(proposal.votes.for) * 10000n / totalVotes) / 100)
      : 0;
  const againstPercent =
    totalVotes > 0n
      ? (Number(BigInt(proposal.votes.against) * 10000n / totalVotes) / 100)
      : 0;

  // Format proposer display
  const proposerDisplay = proposal.proposer.ensName
    || proposal.proposer.name
    || `${proposal.proposer.address.slice(0, 6)}...${proposal.proposer.address.slice(-4)}`;

  // Format end time
  const endTimeDisplay = proposal.endTime
    ? new Date(proposal.endTime).toLocaleDateString()
    : null;

  return (
    <div className="p-4 rounded-lg bg-muted/50 border border-border hover:border-ens-blue/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]" title={`EP ${proposal.onchainId}`}>
              EP {proposal.onchainId.length > 10 ? `${proposal.onchainId.slice(0, 6)}...${proposal.onchainId.slice(-4)}` : proposal.onchainId}
            </span>
            <Badge variant={PROPOSAL_STATUS_COLORS[proposal.status] as "success" | "warning" | "danger" | "info"}>
              {proposal.status}
            </Badge>
          </div>
          <p className="font-medium text-sm line-clamp-2">{proposal.title}</p>
          <p className="text-xs text-muted-foreground mt-1">
            by {proposerDisplay}
          </p>
        </div>
      </div>

      {/* Vote bar */}
      <div className="space-y-2 mt-3">
        <div className="flex justify-between text-xs">
          <span className="text-success">For: {forPercent.toFixed(1)}%</span>
          <span className="text-danger">Against: {againstPercent.toFixed(1)}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden flex">
          <div
            className="bg-success h-full transition-all"
            style={{ width: `${forPercent}%` }}
          />
          <div
            className="bg-danger h-full transition-all"
            style={{ width: `${againstPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Total: {formatNumber(Number(totalVotes) / 1e18)} ENS</span>
          {endTimeDisplay && proposal.status === "active" && (
            <span>Ends: {endTimeDisplay}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function GovernanceOverview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["proposals"],
    queryFn: fetchProposals,
    refetchInterval: 60000, // Refetch every minute
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Vote className="h-5 w-5 text-ens-blue" />
          <CardTitle>Active Governance</CardTitle>
        </div>
        {data && (
          <Badge variant="info">{data.data.activeCount} Active</Badge>
        )}
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-muted-foreground">
            <XCircle className="h-8 w-8 mx-auto mb-2 text-danger" />
            <p>Failed to load proposals</p>
          </div>
        )}

        {data && (
          <div className="space-y-3">
            {data.data.proposals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                <p>No active proposals</p>
              </div>
            ) : (
              data.data.proposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))
            )}
          </div>
        )}

        {data && (
          <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
            <span>Last updated: {formatTimeAgo(data.data.lastUpdated)}</span>
            <a
              href="https://tally.xyz/gov/ens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ens-blue hover:underline"
            >
              View all on Tally →
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
