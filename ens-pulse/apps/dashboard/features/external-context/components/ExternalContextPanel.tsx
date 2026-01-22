"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { Globe, TrendingUp, TrendingDown, Fuel, Activity } from "lucide-react";
import { formatTimeAgo } from "@/shared/lib/utils";
import { formatPrice, formatPriceChange, getPriceChangeColor } from "@/shared/lib/market/client";

interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
}

interface GasPrice {
  low: number;
  average: number;
  high: number;
}

interface StatusData {
  overall: string;
  components: Array<{
    name: string;
    status: string;
  }>;
}

interface MarketResponse {
  success: boolean;
  data: {
    prices: {
      eth: TokenPrice | null;
      ens: TokenPrice | null;
      btc: TokenPrice | null;
    };
    lastUpdated: string;
  };
}

interface GasResponse {
  success: boolean;
  data: {
    gas: GasPrice | null;
    lastUpdated: string;
  };
}

interface StatusResponse {
  success: boolean;
  data: StatusData;
}

async function fetchMarket(): Promise<MarketResponse> {
  const res = await fetch("/api/context/market");
  if (!res.ok) throw new Error("Failed to fetch market");
  return res.json();
}

async function fetchGas(): Promise<GasResponse> {
  const res = await fetch("/api/context/gas");
  if (!res.ok) throw new Error("Failed to fetch gas");
  return res.json();
}

async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch("/api/context/status");
  if (!res.ok) throw new Error("Failed to fetch status");
  return res.json();
}

function PriceDisplay({ token }: { token: TokenPrice | null }) {
  if (!token) return <span className="text-muted-foreground">--</span>;

  const isPositive = token.price_change_percentage_24h >= 0;

  return (
    <div className="flex items-center gap-2">
      <span className="font-medium">{formatPrice(token.current_price)}</span>
      <span
        className={`text-xs flex items-center gap-0.5 ${isPositive ? "text-success" : "text-danger"}`}
      >
        {isPositive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        {formatPriceChange(token.price_change_percentage_24h)}
      </span>
    </div>
  );
}

export function ExternalContextPanel() {
  const { data: marketData, isLoading: marketLoading } = useQuery({
    queryKey: ["market"],
    queryFn: fetchMarket,
    refetchInterval: 300000, // 5 minutes
  });

  const { data: gasData, isLoading: gasLoading } = useQuery({
    queryKey: ["gas"],
    queryFn: fetchGas,
    refetchInterval: 60000, // 1 minute
  });

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ["status"],
    queryFn: fetchStatus,
    refetchInterval: 60000, // 1 minute
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-ens-blue" />
          <CardTitle>World Context</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Market Prices */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">PRICES</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">ETH</span>
              {marketLoading ? (
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              ) : (
                <PriceDisplay token={marketData?.data.prices.eth ?? null} />
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">ENS</span>
              {marketLoading ? (
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              ) : (
                <PriceDisplay token={marketData?.data.prices.ens ?? null} />
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">BTC</span>
              {marketLoading ? (
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              ) : (
                <PriceDisplay token={marketData?.data.prices.btc ?? null} />
              )}
            </div>
          </div>
        </div>

        {/* Gas Prices */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Fuel className="h-3 w-3" />
            GAS (GWEI)
          </h4>
          <div className="flex justify-between">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Low</p>
              <p className="font-medium text-success">
                {gasLoading ? "--" : gasData?.data.gas?.low ?? "--"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Avg</p>
              <p className="font-medium text-warning">
                {gasLoading ? "--" : gasData?.data.gas?.average ?? "--"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">High</p>
              <p className="font-medium text-danger">
                {gasLoading ? "--" : gasData?.data.gas?.high ?? "--"}
              </p>
            </div>
          </div>
        </div>

        {/* Infrastructure Status */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Activity className="h-3 w-3" />
            INFRASTRUCTURE
          </h4>
          <div className="space-y-1.5">
            {statusLoading ? (
              <div className="h-4 w-full bg-muted animate-pulse rounded" />
            ) : (
              statusData?.data.components.map((component) => (
                <div key={component.name} className="flex justify-between items-center text-sm">
                  <span>{component.name}</span>
                  <Badge
                    variant={
                      component.status === "operational"
                        ? "success"
                        : component.status === "degraded"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {component.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
