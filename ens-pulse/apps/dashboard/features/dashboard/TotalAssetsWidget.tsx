"use client";

import { Widget, WidgetContent } from "@/shared/components/widgets";
import {
  useTreasuryOverview,
  useMarketData,
  useFinancials,
} from "@/shared/hooks/use-api-data";
import { formatValue } from "@/shared/lib/formatters";

/* ═══════════════════════════════════════════════════════════════════════════
   TOTAL ASSETS WIDGET — Treasury AUM with 3-part breakdown

   Headline:  Total AUM = Wallet balances + ENS holdings + Endowment DeFi
   Breakdown: 3-segment bar showing each layer
     - Wallet balances (excl. ENS): on-chain ETH + USDC
     - ENS holdings: on-chain ENS × CoinGecko price
     - Endowment DeFi: DefiLlama treasury total - on-chain non-ENS balances
   ═══════════════════════════════════════════════════════════════════════════ */

export function TotalAssetsWidget() {
  const { data: treasury, isLoading: treasuryLoading } = useTreasuryOverview();
  const { data: market, isLoading: marketLoading } = useMarketData();
  const { data: financials } = useFinancials();

  const isLoading = treasuryLoading || marketLoading;

  // Prices
  const ethPrice = treasury?.ethPrice || market?.prices?.eth?.current_price || 0;
  const ensPrice = market?.prices?.ens?.current_price || 0;

  // On-chain balances from primary wallets
  let onChainEthUsd = 0;
  let onChainEnsRaw = 0;
  let onChainUsdcUsd = 0;
  if (treasury?.multisigs) {
    for (const ms of treasury.multisigs) {
      onChainEthUsd += (Number(ms.calculatedBalances?.ethBalance || 0) / 1e18) * ethPrice;
      onChainEnsRaw += Number(ms.calculatedBalances?.ensBalance || 0) / 1e18;
      onChainUsdcUsd += Number(ms.calculatedBalances?.usdcBalance || 0) / 1e6;
    }
  }

  const ensValueUsd = onChainEnsRaw * ensPrice;
  const walletBalancesExclEns = onChainEthUsd + onChainUsdcUsd;

  // DefiLlama treasury total (excl. ENS tokens, includes DeFi positions)
  const treasuryTotal = financials?.totalAssets?.value ?? null;

  // Endowment DeFi = DefiLlama total - on-chain non-ENS wallet balances
  const endowmentDefi = treasuryTotal !== null
    ? Math.max(0, treasuryTotal - walletBalancesExclEns)
    : null;

  // Total AUM
  const totalAum = endowmentDefi !== null
    ? walletBalancesExclEns + ensValueUsd + endowmentDefi
    : walletBalancesExclEns + ensValueUsd;

  // Segment percentages
  const walletPct = totalAum > 0 ? (walletBalancesExclEns / totalAum) * 100 : 0;
  const ensPct = totalAum > 0 ? (ensValueUsd / totalAum) * 100 : 0;
  const defiPct = totalAum > 0 && endowmentDefi !== null ? (endowmentDefi / totalAum) * 100 : 0;

  return (
    <Widget
      className="hero-card card-depth-hero"
      tooltip="Treasury AUM and allocation across wallets, DAO, and grants."
    >
      <WidgetContent padding="md">
        {isLoading ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <div className="skeleton w-9 h-9 rounded-full" />
              <div className="skeleton h-2.5 w-20 rounded" />
            </div>
            <div className="skeleton h-9 w-28 rounded" />
            <div className="skeleton h-1.5 w-full rounded-full mt-4" />
            <div className="flex justify-between">
              <div className="skeleton h-3 w-14 rounded" />
              <div className="skeleton h-3 w-14 rounded" />
              <div className="skeleton h-3 w-14 rounded" />
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/dao-icon.svg"
                alt="DAO"
                className="w-9 h-9 shrink-0 rounded-full object-cover"
              />
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                Treasury AUM
              </span>
            </div>

            {/* Total AUM — headline */}
            <div className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums tracking-tight mb-4">
              ${formatValue(totalAum)}
            </div>

            {/* 3-segment bar */}
            <div className="flex h-1.5 rounded-full overflow-hidden bg-[var(--color-bg-overlay)] mb-3">
              {walletPct > 0 && (
                <div
                  className="rounded-l-full"
                  style={{
                    width: `${walletPct}%`,
                    background: "var(--color-ens-blue)",
                    opacity: 0.8,
                  }}
                />
              )}
              {ensPct > 0 && (
                <div
                  style={{
                    width: `${ensPct}%`,
                    background: "var(--color-ens-purple)",
                    opacity: 0.6,
                  }}
                />
              )}
              {defiPct > 0 && (
                <div
                  className="rounded-r-full"
                  style={{
                    width: `${defiPct}%`,
                    background: "var(--color-warm, #e8a946)",
                    opacity: 0.5,
                  }}
                />
              )}
            </div>

            {/* 3-column breakdown */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {/* Wallet balances */}
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-ens-blue)", opacity: 0.8 }} />
                  <span className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wide">Wallets</span>
                </div>
                <div className="text-xs font-medium text-[var(--color-text-primary)] tabular-nums">
                  ${formatValue(walletBalancesExclEns)}
                </div>
              </div>

              {/* ENS holdings */}
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-ens-purple)", opacity: 0.6 }} />
                  <span className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wide">ENS</span>
                </div>
                <div className="text-xs font-medium text-[var(--color-text-primary)] tabular-nums">
                  ${formatValue(ensValueUsd)}
                </div>
              </div>

              {/* Endowment DeFi */}
              <div className="text-right">
                <div className="flex items-center gap-1.5 mb-0.5 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-warm, #e8a946)", opacity: 0.5 }} />
                  <span className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wide">Endowment</span>
                </div>
                <div className="text-xs font-medium text-[var(--color-text-primary)] tabular-nums">
                  {endowmentDefi !== null ? `$${formatValue(endowmentDefi)}` : "—"}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-end justify-between">
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">
                {treasury?.multisigs?.length ?? 0} wallets
              </div>
              <div className="text-[10px] text-[var(--color-ens-blue)]/60 uppercase tracking-wide">
                {treasuryTotal !== null ? "via DefiLlama + RPC" : "on-chain"}
              </div>
            </div>
          </>
        )}
      </WidgetContent>
    </Widget>
  );
}

export default TotalAssetsWidget;
