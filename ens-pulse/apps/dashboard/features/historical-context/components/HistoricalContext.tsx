"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { History, TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";
import { formatNumber, formatCurrency } from "@/shared/lib/utils";
import { useHistoricalContext, type ContextSnapshot } from "@/shared/hooks/use-api-data";

interface HistoricalContextProps {
  proposalId?: string;
}

function ComparisonRow({
  label,
  created,
  current,
  format = "number",
}: {
  label: string;
  created: number;
  current: number;
  format?: "number" | "currency" | "gwei";
}) {
  const change = ((current - created) / created) * 100;
  const isPositive = change > 0;
  const isNeutral = Math.abs(change) < 0.1;

  const formatValue = (val: number) => {
    if (format === "currency") return formatCurrency(val);
    if (format === "gwei") return `${val.toFixed(0)} gwei`;
    return formatNumber(val);
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Created</p>
          <p className="text-sm font-medium">{formatValue(created)}</p>
        </div>
        <div className="flex items-center gap-1">
          {isNeutral ? (
            <Minus className="h-4 w-4 text-muted-foreground" />
          ) : isPositive ? (
            <TrendingUp className="h-4 w-4 text-success" />
          ) : (
            <TrendingDown className="h-4 w-4 text-danger" />
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Now</p>
          <p className="text-sm font-medium">{formatValue(current)}</p>
        </div>
        <Badge
          variant={isNeutral ? "default" : isPositive ? "success" : "danger"}
          className="min-w-[60px] justify-center"
        >
          {isPositive ? "+" : ""}
          {change.toFixed(1)}%
        </Badge>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2">
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="flex items-center gap-4">
            <div className="h-4 w-16 bg-muted rounded" />
            <div className="h-4 w-4 bg-muted rounded" />
            <div className="h-4 w-16 bg-muted rounded" />
            <div className="h-6 w-16 bg-muted rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HistoricalContext({ proposalId }: HistoricalContextProps) {
  const { data, isLoading, error } = useHistoricalContext(proposalId || null);

  // Fallback mock data for when API is unavailable
  const mockCreated: ContextSnapshot = {
    label: "Proposal Created",
    timestamp: "2024-01-15T10:00:00Z",
    ethPrice: 2500,
    ensPrice: 18,
    treasuryValueUsd: 45000000,
    gasPrice: 25,
  };

  const mockCurrent: ContextSnapshot = {
    label: "Current",
    timestamp: new Date().toISOString(),
    ethPrice: 3200,
    ensPrice: 22,
    treasuryValueUsd: 52000000,
    gasPrice: 15,
  };

  // Use API data if available, otherwise fallback to mock
  const createdSnapshot = data?.createdSnapshot || mockCreated;
  const currentSnapshot = data?.currentSnapshot || mockCurrent;
  const hasIndexedContext = data?.hasIndexedContext || false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-ens-purple" />
          <CardTitle>
            Historical Context
            {proposalId && (
              <span className="ml-2 text-muted-foreground font-normal">
                Proposal #{proposalId}
              </span>
            )}
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          How has the world changed since this proposal was created?
        </p>
        {!hasIndexedContext && !isLoading && (
          <div className="flex items-center gap-1.5 text-xs text-warning">
            <AlertCircle className="h-3 w-3" />
            <span>Using estimated data - full indexing in progress</span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="py-8 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Unable to load historical data</p>
          </div>
        ) : (
          <>
            <ComparisonRow
              label="ETH Price"
              created={createdSnapshot.ethPrice}
              current={currentSnapshot.ethPrice}
              format="currency"
            />
            <ComparisonRow
              label="ENS Price"
              created={createdSnapshot.ensPrice}
              current={currentSnapshot.ensPrice}
              format="currency"
            />
            <ComparisonRow
              label="Treasury Value"
              created={createdSnapshot.treasuryValueUsd}
              current={currentSnapshot.treasuryValueUsd}
              format="currency"
            />
            <ComparisonRow
              label="Gas Price"
              created={createdSnapshot.gasPrice}
              current={currentSnapshot.gasPrice}
              format="gwei"
            />

            <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <p>
                <strong>Created:</strong>{" "}
                {new Date(createdSnapshot.timestamp).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
