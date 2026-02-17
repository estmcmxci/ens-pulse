"use client";

import Link from "next/link";
import {
  Widget,
  WidgetHeader,
  WidgetTitle,
  WidgetContent,
} from "@/shared/components/widgets";
import { useTreasuryOverview, useMarketData } from "@/shared/hooks/use-api-data";
import { formatLargeNumber, formatCompact } from "@/shared/lib/formatters";

/* ═══════════════════════════════════════════════════════════════════════════
   TREASURY WIDGET — Asset breakdown table for 5 primary wallets
   ═══════════════════════════════════════════════════════════════════════════ */

export function TreasuryWidget() {
  const { data, isLoading } = useTreasuryOverview();
  const { data: marketData } = useMarketData();

  const ethPrice = data?.ethPrice || marketData?.prices?.eth?.current_price || 3000;
  const ensPrice = marketData?.prices?.ens?.current_price || 10;

  // Process wallet data with asset breakdown
  const wallets = data?.multisigs || [];
  const walletData = wallets.map((ms) => {
    const eth = Number(ms.calculatedBalances?.ethBalance || 0) / 1e18;
    const ens = Number(ms.calculatedBalances?.ensBalance || 0) / 1e18;
    const usdc = Number(ms.calculatedBalances?.usdcBalance || 0) / 1e6;
    const total = eth * ethPrice + ens * ensPrice + usdc;

    return {
      name: ms.name || "Unknown",
      address: ms.address,
      addressShort: `${ms.address.slice(0, 6)}...${ms.address.slice(-4)}`,
      eth,
      ens,
      usdc,
      total,
    };
  });

  // Sort by total value descending
  walletData.sort((a, b) => b.total - a.total);

  const grandTotal = walletData.reduce((sum, w) => sum + w.total, 0);

  return (
    <Widget>
      <WidgetHeader>
        <WidgetTitle>TREASURY</WidgetTitle>
        <span className="text-lg font-bold text-[var(--color-text-primary)] tabular-nums">
          ${formatLargeNumber(grandTotal)}
        </span>
      </WidgetHeader>
      <WidgetContent padding="sm">
        {isLoading ? (
          <div className="h-32 flex items-center justify-center text-[var(--color-text-muted)]">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border-subtle)]">
                  <th className="text-left py-1.5 font-medium">Wallet</th>
                  <th className="text-right py-1.5 font-medium">ETH</th>
                  <th className="text-right py-1.5 font-medium">USDC</th>
                  <th className="text-right py-1.5 font-medium">ENS</th>
                  <th className="text-right py-1.5 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {walletData.map((wallet) => (
                  <tr key={wallet.address} className="border-b border-[var(--color-border-subtle)] last:border-0">
                    <td className="py-1.5">
                      <Link
                        href={`https://etherscan.io/address/${wallet.address}`}
                        target="_blank"
                        className="flex items-center gap-1.5 hover:text-[var(--color-ens-blue)] transition-colors"
                      >
                        <span className="text-[var(--color-text-secondary)]">{wallet.name}</span>
                        <span className="text-[var(--color-text-muted)] font-mono text-[10px]">{wallet.addressShort}</span>
                      </Link>
                    </td>
                    <td className="py-1.5 text-right text-[var(--color-text-primary)] tabular-nums">
                      {wallet.eth > 0 ? formatCompact(wallet.eth) : "—"}
                    </td>
                    <td className="py-1.5 text-right text-[var(--color-text-primary)] tabular-nums">
                      {wallet.usdc > 0 ? `$${formatCompact(wallet.usdc)}` : "—"}
                    </td>
                    <td className="py-1.5 text-right text-[var(--color-text-primary)] tabular-nums">
                      {wallet.ens > 0 ? formatCompact(wallet.ens) : "—"}
                    </td>
                    <td className="py-1.5 text-right text-[var(--color-text-primary)] tabular-nums font-medium">
                      ${formatLargeNumber(wallet.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </WidgetContent>
    </Widget>
  );
}

export default TreasuryWidget;
