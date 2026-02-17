"use client";

import { useQuery } from "@tanstack/react-query";
import { DelegateHighlights } from "@/features/delegates/components/DelegateHighlights";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { Users, TrendingUp, Vote, Search, ExternalLink } from "lucide-react";
import { formatNumber, formatPercent, formatAddress } from "@/shared/lib/utils";
import { useState } from "react";

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
    totalSupply: string;
    totalSupplyFormatted: string;
    totalDelegates: number;
    lastUpdated: string;
  };
}

async function fetchDelegates(): Promise<DelegatesResponse> {
  const res = await fetch("/api/governance/delegates?limit=50");
  if (!res.ok) throw new Error("Failed to fetch delegates");
  return res.json();
}

function DelegateTableRow({
  delegate,
  rank,
}: {
  delegate: Delegate;
  rank: number;
}) {
  const displayName = delegate.ensName || formatAddress(delegate.address, 6);
  const votingPower = parseFloat(delegate.votingPowerFormatted);

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      <td className="py-3 px-4 text-center text-muted-foreground">#{rank}</td>
      <td className="py-3 px-4">
        <a
          href={`https://etherscan.io/address/${delegate.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-ens-blue transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-ens-blue to-ens-purple flex items-center justify-center text-white text-xs font-medium">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <span className="font-medium">{displayName}</span>
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </a>
      </td>
      <td className="py-3 px-4 text-right font-medium">
        {formatNumber(votingPower)} ENS
      </td>
      <td className="py-3 px-4 text-right text-muted-foreground">
        {formatPercent(delegate.votingPowerPercent)}
      </td>
      <td className="py-3 px-4 text-center">
        <a
          href={`https://www.tally.xyz/gov/ens/delegate/${delegate.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ens-blue/10 text-ens-blue text-sm hover:bg-ens-blue/20 transition-colors"
        >
          Delegate
          <ExternalLink className="h-3 w-3" />
        </a>
      </td>
    </tr>
  );
}

export default function DelegatesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["all-delegates"],
    queryFn: fetchDelegates,
    refetchInterval: 300000, // 5 minutes
  });

  const filteredDelegates = data?.data.delegates.filter((d) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      d.address.toLowerCase().includes(query) ||
      d.ensName?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="animate-in stagger-1">
        <h1 className="text-3xl font-700 tracking-tight text-[var(--color-text-primary)]">Delegates</h1>
        <p className="label mt-2">
          Explore and discover ENS delegates by voting power
        </p>
        <div className="divider-ens mt-4" />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in stagger-2">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-ens-blue/10">
              <Users className="h-5 w-5 text-ens-blue" />
            </div>
            <div>
              <p className="text-2xl data-value text-[var(--color-text-primary)]">
                {data ? formatNumber(data.data.totalDelegates) : "..."}
              </p>
              <p className="label mt-0.5">Total Delegates</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-ens-purple/10">
              <TrendingUp className="h-5 w-5 text-ens-purple" />
            </div>
            <div>
              <p className="text-2xl data-value text-[var(--color-text-primary)]">
                {data ? formatNumber(parseFloat(data.data.totalSupplyFormatted) / 1e6) + "M" : "..."}
              </p>
              <p className="label mt-0.5">Total Supply</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Vote className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl data-value text-[var(--color-text-primary)]">78%</p>
              <p className="label mt-0.5">Delegated</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Users className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl data-value text-[var(--color-text-primary)]">47%</p>
              <p className="label mt-0.5">Top 10 Control</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Delegate Table */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-ens-blue" />
                <CardTitle>All Delegates</CardTitle>
              </div>
              {/* Search */}
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search delegates..."
                  className="w-full h-9 pl-9 pr-4 rounded-lg bg-muted border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ens-blue/50"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              )}

              {error && (
                <div className="text-center py-8 text-muted-foreground">
                  Failed to load delegates
                </div>
              )}

              {filteredDelegates && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border text-left text-sm text-muted-foreground">
                        <th className="py-3 px-4 text-center w-16">Rank</th>
                        <th className="py-3 px-4">Delegate</th>
                        <th className="py-3 px-4 text-right">Voting Power</th>
                        <th className="py-3 px-4 text-right">% of Supply</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDelegates.map((delegate, index) => (
                        <DelegateTableRow
                          key={delegate.address}
                          delegate={delegate}
                          rank={index + 1}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          <DelegateHighlights />
        </div>
      </div>
    </div>
  );
}
