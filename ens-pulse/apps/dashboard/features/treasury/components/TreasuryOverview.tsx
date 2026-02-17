"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { Wallet, AlertTriangle, ExternalLink } from "lucide-react";
import { formatNumber, formatAddress, formatTimeAgo } from "@/shared/lib/utils";

interface MultisigData {
  address: string;
  name: string;
  workingGroup: string;
  calculatedBalances: {
    ethBalance: string;
    ensBalance: string;
    usdcBalance: string;
  };
  pendingTransactions?: unknown[];
  threshold?: number;
  owners?: string[];
  ownerCount?: number;
  info?: {
    threshold: number;
    owners: string[];
  };
}

interface TreasuryResponse {
  success: boolean;
  data: {
    multisigs: MultisigData[];
    totals: {
      ethBalance: string;
      ensBalance: string;
      usdcBalance: string;
      pendingTransactions?: number;
      multisigCount: number;
    };
    lastUpdated: string;
  };
}

async function fetchTreasury(): Promise<TreasuryResponse> {
  const res = await fetch("/api/treasury/overview");
  if (!res.ok) throw new Error("Failed to fetch treasury");
  return res.json();
}

function MultisigCard({ multisig }: { multisig: MultisigData }) {
  const ethBalance = Number(BigInt(multisig.calculatedBalances.ethBalance)) / 1e18;
  const ensBalance = Number(BigInt(multisig.calculatedBalances.ensBalance)) / 1e18;
  const hasPending = (multisig.pendingTransactions?.length ?? 0) > 0;

  return (
    <div className="p-3 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{multisig.name}</span>
          {hasPending && (
            <Badge variant="warning" className="text-xs">
              {multisig.pendingTransactions!.length} pending
            </Badge>
          )}
        </div>
        <a
          href={`https://app.safe.global/eth:${multisig.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>{formatNumber(ethBalance)} ETH</span>
        <span>{formatNumber(ensBalance)} ENS</span>
        {(multisig.threshold || multisig.info?.threshold) && (
          <span className="ml-auto">
            {multisig.threshold ?? multisig.info?.threshold}/{multisig.ownerCount ?? multisig.owners?.length ?? multisig.info?.owners?.length ?? "?"} sig
          </span>
        )}
      </div>
    </div>
  );
}

export function TreasuryOverview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["treasury"],
    queryFn: fetchTreasury,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const totalEth = data
    ? Number(BigInt(data.data.totals.ethBalance)) / 1e18
    : 0;
  const totalEns = data
    ? Number(BigInt(data.data.totals.ensBalance)) / 1e18
    : 0;
  const totalUsdc = data
    ? Number(BigInt(data.data.totals.usdcBalance)) / 1e6
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-ens-purple" />
          <CardTitle>Treasury</CardTitle>
        </div>
        {data && (data.data.totals.pendingTransactions ?? 0) > 0 && (
          <Badge variant="warning">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {data.data.totals.pendingTransactions} Pending
          </Badge>
        )}
      </CardHeader>

      <CardContent>
        {/* Total Balances */}
        <div className="grid grid-cols-3 gap-4 mb-4 p-4 rounded-lg bg-gradient-to-r from-ens-blue/5 to-ens-purple/5 border border-border">
          <div>
            <p className="text-xs text-muted-foreground">ETH</p>
            <p className="text-lg font-semibold">
              {isLoading ? "..." : formatNumber(totalEth)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">ENS</p>
            <p className="text-lg font-semibold">
              {isLoading ? "..." : formatNumber(totalEns)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">USDC</p>
            <p className="text-lg font-semibold">
              {isLoading ? "..." : formatNumber(totalUsdc)}
            </p>
          </div>
        </div>

        {/* Multisig List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {isLoading && (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
              ))}
            </>
          )}

          {error && (
            <div className="text-center py-4 text-muted-foreground">
              Failed to load treasury data
            </div>
          )}

          {data &&
            data.data.multisigs.map((multisig) => (
              <MultisigCard key={multisig.address} multisig={multisig} />
            ))}
        </div>

        {data && (
          <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
            <span>
              {data.data.totals.multisigCount} multisigs · Last updated:{" "}
              {formatTimeAgo(data.data.lastUpdated)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
