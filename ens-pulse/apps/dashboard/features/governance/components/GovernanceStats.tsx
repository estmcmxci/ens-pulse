"use client";

import { Card } from "@/shared/components/ui/Card";
import { Vote, BarChart3, Users, Clock } from "lucide-react";
import { useProposals, useDelegates } from "@/shared/hooks/use-api-data";
import { formatDistanceToNow } from "date-fns";

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  iconBg: string;
  isLoading?: boolean;
}

function StatCard({ icon, value, label, iconBg, isLoading }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
        <div>
          {isLoading ? (
            <div className="h-8 w-16 animate-pulse bg-muted rounded" />
          ) : (
            <p className="text-2xl font-bold">{value}</p>
          )}
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}

export function GovernanceStats() {
  const { data: proposalsData, isLoading: proposalsLoading } = useProposals();
  const { data: delegatesData, isLoading: delegatesLoading } = useDelegates();

  // Calculate stats from real data
  const proposals = proposalsData?.proposals || [];
  const delegates = delegatesData?.delegates || [];

  const activeProposals = proposals.filter((p) => p.status === "active");
  const totalProposals = proposals.length;
  const totalDelegates = delegates.length;

  // Find the nearest ending vote (from active proposals)
  let timeUntilVoteEnds = "No active votes";
  if (activeProposals.length > 0) {
    // First try to use endTime if available
    const proposalsWithEndTime = activeProposals.filter((p) => p.endTime);
    if (proposalsWithEndTime.length > 0) {
      const sortedByTime = [...proposalsWithEndTime].sort(
        (a, b) => new Date(a.endTime!).getTime() - new Date(b.endTime!).getTime()
      );
      const nearestEnd = sortedByTime[0];
      if (nearestEnd?.endTime) {
        timeUntilVoteEnds = formatDistanceToNow(new Date(nearestEnd.endTime), { addSuffix: false });
      }
    } else {
      // Fall back to block-based estimation
      const proposalsWithBlocks = activeProposals.filter(
        (p) => p.endBlock !== null && p.startBlock !== null
      );
      if (proposalsWithBlocks.length > 0) {
        const sortedActive = [...proposalsWithBlocks].sort(
          (a, b) => (a.endBlock ?? 0) - (b.endBlock ?? 0)
        );
        const nearestEnd = sortedActive[0];
        if (nearestEnd?.endBlock && nearestEnd?.startBlock) {
          const blocksRemaining = nearestEnd.endBlock - nearestEnd.startBlock;
          if (blocksRemaining > 0) {
            const secondsRemaining = blocksRemaining * 12;
            const days = Math.floor(secondsRemaining / 86400);
            if (days > 0) {
              timeUntilVoteEnds = `${days} day${days !== 1 ? "s" : ""}`;
            } else {
              const hours = Math.floor(secondsRemaining / 3600);
              timeUntilVoteEnds = `${hours} hour${hours !== 1 ? "s" : ""}`;
            }
          }
        }
      }
    }
  }

  // Format delegate count
  const formatDelegateCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        icon={<Vote className="h-5 w-5 text-ens-blue" />}
        value={activeProposals.length}
        label="Active Proposals"
        iconBg="bg-ens-blue/10"
        isLoading={proposalsLoading}
      />
      <StatCard
        icon={<BarChart3 className="h-5 w-5 text-success" />}
        value={totalProposals || "—"}
        label="Total Proposals"
        iconBg="bg-success/10"
        isLoading={proposalsLoading}
      />
      <StatCard
        icon={<Users className="h-5 w-5 text-ens-purple" />}
        value={formatDelegateCount(totalDelegates) || "—"}
        label="Total Delegates"
        iconBg="bg-ens-purple/10"
        isLoading={delegatesLoading}
      />
      <StatCard
        icon={<Clock className="h-5 w-5 text-warning" />}
        value={timeUntilVoteEnds}
        label="Until Vote Ends"
        iconBg="bg-warning/10"
        isLoading={proposalsLoading}
      />
    </div>
  );
}
