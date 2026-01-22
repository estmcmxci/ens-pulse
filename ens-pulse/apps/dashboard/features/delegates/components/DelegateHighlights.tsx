"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import { Users, ExternalLink } from "lucide-react";
import { formatNumber, formatAddress, formatPercent } from "@/shared/lib/utils";

interface Delegate {
  address: string;
  ensName: string | null;
  votingPower: string;
  votingPowerFormatted: string;
  votingPowerPercent: number;
  delegatorsCount: number;
}

interface DelegatesResponse {
  success: boolean;
  data: {
    delegates: Delegate[];
    totalDelegates: number;
    lastUpdated: string;
  };
}

async function fetchDelegates(): Promise<DelegatesResponse> {
  const res = await fetch("/api/governance/delegates?limit=5");
  if (!res.ok) throw new Error("Failed to fetch delegates");
  return res.json();
}

function DelegateRow({ delegate, rank }: { delegate: Delegate; rank: number }) {
  const displayName = delegate.ensName || formatAddress(delegate.address);

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <span className="w-5 text-center text-xs font-medium text-muted-foreground">
        #{rank}
      </span>
      <div className="flex-1 min-w-0">
        <a
          href={`https://etherscan.io/address/${delegate.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-sm hover:text-ens-blue transition-colors truncate block"
        >
          {displayName}
        </a>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">
          {formatNumber(parseFloat(delegate.votingPowerFormatted))} ENS
        </p>
        <p className="text-xs text-muted-foreground">
          {formatPercent(delegate.votingPowerPercent)}
        </p>
      </div>
    </div>
  );
}

export function DelegateHighlights() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["delegates"],
    queryFn: fetchDelegates,
    refetchInterval: 300000, // 5 minutes
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-ens-blue" />
          <CardTitle>Top Delegates</CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Unable to load delegates
          </div>
        )}

        {data && (
          <>
            <div className="space-y-1">
              {data.data.delegates.map((delegate, index) => (
                <DelegateRow
                  key={delegate.address}
                  delegate={delegate}
                  rank={index + 1}
                />
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <a
                href="https://www.tally.xyz/gov/ens/delegates"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 text-sm text-ens-blue hover:underline"
              >
                View all delegates
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
