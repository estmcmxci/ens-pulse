"use client";

import { useQuery } from "@tanstack/react-query";
import { TreasuryOverview } from "@/features/treasury/components/TreasuryOverview";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { Wallet, TrendingUp, AlertTriangle, Clock, ExternalLink } from "lucide-react";
import { formatNumber, formatCurrency, formatTimeAgo, formatAddress } from "@/shared/lib/utils";

interface PendingTransaction {
  safeTxHash: string;
  to: string;
  value: string;
  multisigName: string;
  multisigAddress: string;
  workingGroup: string;
  signaturesNeeded: number;
  submissionDate: string;
  confirmations: Array<{ owner: string }>;
}

interface PendingResponse {
  success: boolean;
  data: {
    transactions: PendingTransaction[];
    totalCount: number;
    lastUpdated: string;
  };
}

async function fetchPendingTransactions(): Promise<PendingResponse> {
  const res = await fetch("/api/treasury/pending");
  if (!res.ok) throw new Error("Failed to fetch pending");
  return res.json();
}

function PendingTransactionRow({ tx }: { tx: PendingTransaction }) {
  const value = Number(BigInt(tx.value || "0")) / 1e18;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border hover:border-warning/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-warning/10">
          <AlertTriangle className="h-5 w-5 text-warning" />
        </div>
        <div>
          <p className="font-medium">{tx.multisigName}</p>
          <p className="text-sm text-muted-foreground">
            To: {formatAddress(tx.to)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium">{formatNumber(value)} ETH</p>
        <p className="text-sm text-muted-foreground">
          {tx.confirmations.length} / {tx.confirmations.length + tx.signaturesNeeded} signatures
        </p>
      </div>
      <div className="text-right text-sm text-muted-foreground">
        <p>{formatTimeAgo(tx.submissionDate)}</p>
        <a
          href={`https://app.safe.global/eth:${tx.multisigAddress}/transactions/queue`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-ens-blue hover:underline"
        >
          View <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

export default function TreasuryPage() {
  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ["pending-transactions"],
    queryFn: fetchPendingTransactions,
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Treasury</h1>
        <p className="text-muted-foreground mt-1">
          Real-time monitoring of ENS DAO multisig wallets
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-ens-blue/10">
              <Wallet className="h-5 w-5 text-ens-blue" />
            </div>
            <div>
              <p className="text-2xl font-bold">$52M</p>
              <p className="text-xs text-muted-foreground">Total Value</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">+15.3%</p>
              <p className="text-xs text-muted-foreground">30d Change</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {pendingData?.data.totalCount ?? "..."}
              </p>
              <p className="text-xs text-muted-foreground">Pending Txs</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-ens-purple/10">
              <Clock className="h-5 w-5 text-ens-purple" />
            </div>
            <div>
              <p className="text-2xl font-bold">9</p>
              <p className="text-xs text-muted-foreground">Multisigs</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TreasuryOverview />

        {/* Pending Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <CardTitle>Pending Transactions</CardTitle>
            </div>
            {pendingData && pendingData.data.totalCount > 0 && (
              <Badge variant="warning">{pendingData.data.totalCount} Pending</Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pendingLoading && (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                  ))}
                </>
              )}

              {pendingData && pendingData.data.transactions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No pending transactions</p>
                </div>
              )}

              {pendingData &&
                pendingData.data.transactions.map((tx) => (
                  <PendingTransactionRow key={tx.safeTxHash} tx={tx} />
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Treasury History Chart Placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            <CardTitle>Treasury Value Over Time</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>Treasury history chart will be displayed here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
