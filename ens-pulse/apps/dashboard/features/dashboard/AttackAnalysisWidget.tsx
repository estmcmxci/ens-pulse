"use client";

import {
  Widget,
  WidgetHeader,
  WidgetTitle,
  WidgetContent,
} from "@/shared/components/widgets";
import {
  useTreasuryOverview,
  useMarketData,
  useDelegates,
  useFinancials,
} from "@/shared/hooks/use-api-data";
import { formatLargeNumber } from "@/shared/lib/formatters";

/* ═══════════════════════════════════════════════════════════════════════════
   ATTACK PROFITABILITY ANALYSIS WIDGET
   Calculates economic security of the DAO based on treasury value vs attack cost
   ═══════════════════════════════════════════════════════════════════════════ */

export function AttackAnalysisWidget() {
  const { data: treasuryData, isLoading: treasuryLoading } = useTreasuryOverview();
  const { data: marketData, isLoading: marketLoading } = useMarketData();
  const { data: delegatesData, isLoading: delegatesLoading } = useDelegates(1);
  const { data: financialsData } = useFinancials();

  const isLoading = treasuryLoading || marketLoading || delegatesLoading;

  // Get prices
  const ethPrice = marketData?.prices?.eth?.current_price || 0;
  const ensPrice = marketData?.prices?.ens?.current_price || 0;

  // Calculate treasury value
  const treasuryTotals = treasuryData?.totals;
  const ethBalance = treasuryTotals ? Number(treasuryTotals.ethBalance) / 1e18 : 0;
  const ensBalance = treasuryTotals ? Number(treasuryTotals.ensBalance) / 1e18 : 0;
  const usdcBalance = treasuryTotals ? Number(treasuryTotals.usdcBalance) / 1e6 : 0;

  // Treasury value from our calculated balances
  const treasuryValueUsd = (ethBalance * ethPrice) + (ensBalance * ensPrice) + usdcBalance;

  // Use Steakhouse total assets if available (includes all assets)
  const totalAssetsUsd = financialsData?.totalAssets?.value || treasuryValueUsd;

  // Governance parameters
  const totalSupply = delegatesData?.totalSupply ? Number(delegatesData.totalSupply) / 1e18 : 0;
  const totalDelegatedVotes = delegatesData?.totalDelegatesVotesCount
    ? Number(delegatesData.totalDelegatesVotesCount) / 1e18
    : 0;
  const quorum = delegatesData?.quorum ? Number(delegatesData.quorum) / 1e18 : 0;

  // Calculate attack economics
  const MAJORITY_PCT = 0.5; // 50% needed to pass
  const quorumPct = totalSupply > 0 ? quorum / totalSupply : 0;

  // Votes needed = max(quorum, totalDelegatedVotes * majority)
  // This represents the worst case: either meet quorum OR beat majority of all possible votes
  const votesNeededWorstCase = Math.max(quorum, totalDelegatedVotes * MAJORITY_PCT);
  const votesNeededBestCase = quorum; // If no one else votes

  // Attack costs
  const attackCostWorstCase = votesNeededWorstCase * ensPrice;
  const attackCostBestCase = votesNeededBestCase * ensPrice;

  // Incentive multiples (how many times over the attack cost is the treasury)
  const incentiveMultipleWorstCase = attackCostWorstCase > 0 ? totalAssetsUsd / attackCostWorstCase : 0;
  const incentiveMultipleBestCase = attackCostBestCase > 0 ? totalAssetsUsd / attackCostBestCase : 0;

  // Risk assessment based on worst case
  const getRiskLabel = (multiple: number): { label: string; color: string; description: string } => {
    if (multiple > 1) {
      return {
        label: "Economically Attackable",
        color: "var(--color-negative)",
        description: `Treasury is ${multiple.toFixed(1)}× the attack cost`,
      };
    } else if (multiple === 1) {
      return {
        label: "Neutral",
        color: "var(--color-warning)",
        description: "Treasury equals attack cost",
      };
    } else {
      return {
        label: "Economically Secure",
        color: "var(--color-positive)",
        description: `Attack costs ${(1 / multiple).toFixed(1)}× the treasury value`,
      };
    }
  };

  const riskAssessment = getRiskLabel(incentiveMultipleWorstCase);

  return (
    <Widget>
      <WidgetHeader>
        <WidgetTitle>ATTACK PROFITABILITY ANALYSIS</WidgetTitle>
        <div
          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm"
          style={{
            backgroundColor: `color-mix(in srgb, ${riskAssessment.color} 15%, transparent)`,
            color: riskAssessment.color,
            border: `1px solid color-mix(in srgb, ${riskAssessment.color} 25%, transparent)`,
            boxShadow: `0 0 12px color-mix(in srgb, ${riskAssessment.color} 10%, transparent)`,
          }}
        >
          {riskAssessment.label}
        </div>
      </WidgetHeader>
      <WidgetContent padding="sm">
        {isLoading ? (
          <div className="h-20 flex items-center justify-center text-[var(--color-text-muted)]">
            Calculating attack economics...
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            {/* Treasury Value */}
            <div>
              <div className="label mb-1.5">
                Treasury Value
              </div>
              <div className="text-xl data-value text-[var(--color-text-primary)]">
                ${formatLargeNumber(totalAssetsUsd)}
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Total DAO assets
              </div>
            </div>

            {/* Attack Cost (Worst Case) */}
            <div>
              <div className="label mb-1.5">
                Attack Cost (Worst Case)
              </div>
              <div className="text-xl data-value text-[var(--color-text-primary)]">
                ${formatLargeNumber(attackCostWorstCase)}
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {formatLargeNumber(votesNeededWorstCase)} ENS @ ${ensPrice.toFixed(2)}
              </div>
            </div>

            {/* Incentive Multiple */}
            <div>
              <div className="label mb-1.5">
                Incentive Multiple
              </div>
              <div
                className="text-2xl data-value"
                style={{
                  color: riskAssessment.color,
                  textShadow: `0 0 20px color-mix(in srgb, ${riskAssessment.color} 30%, transparent)`,
                }}
              >
                {incentiveMultipleWorstCase.toFixed(2)}×
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Treasury ÷ Attack Cost
              </div>
            </div>

            {/* Governance Parameters */}
            <div>
              <div className="label mb-1.5">
                Governance Parameters
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Quorum</span>
                  <span className="text-[var(--color-text-primary)] tabular-nums">
                    {formatLargeNumber(quorum)} ({(quorumPct * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Delegated</span>
                  <span className="text-[var(--color-text-primary)] tabular-nums">
                    {formatLargeNumber(totalDelegatedVotes)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Majority</span>
                  <span className="text-[var(--color-text-primary)] tabular-nums">50%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formula explanation */}
        {!isLoading && (
          <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-muted)]">
                Votes needed = max(quorum, delegated × 50%) = {formatLargeNumber(votesNeededWorstCase)} ENS
              </span>
              <span className="text-[var(--color-text-tertiary)]">
                Best case (quorum only): ${formatLargeNumber(attackCostBestCase)} ({incentiveMultipleBestCase.toFixed(2)}×)
              </span>
            </div>
          </div>
        )}
      </WidgetContent>
    </Widget>
  );
}

export default AttackAnalysisWidget;
