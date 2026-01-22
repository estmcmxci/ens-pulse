"use client";

import { useState } from "react";
import {
  Widget,
  WidgetHeader,
  WidgetTitle,
  WidgetContent,
  WidgetFooter,
  WidgetActions,
  WidgetActionButton,
  EmptyWidgetCell,
  PriceCard,
  ProposalCard,
  TreasuryWidget,
  CompactTreasuryCard,
  PriceStatusBar,
  PriceTickerWidget,
} from "@/shared/components/widgets";
import { Card, CardHeader, CardTitle, CardLabel, CardContent, CardValue, CardFooter } from "@/shared/components/ui/Card";
import { Badge, StatusBadge } from "@/shared/components/ui/Badge";

/* ═══════════════════════════════════════════════════════════════════
   Custom Dashboard Page — Arkham-Style Widget Grid
   Demonstrates all widget types and the customizable grid system
   ═══════════════════════════════════════════════════════════════════ */

// Mock data
const MOCK_TOKENS = {
  ens: {
    symbol: "ENS",
    name: "Ethereum Name Service",
    price: 9.23,
    volume24h: 21_846_566,
    change1d: -2.6,
    change7d: -10.7,
    sparkline: [9.8, 9.6, 9.4, 9.5, 9.3, 9.1, 9.4, 9.2, 9.0, 9.1, 9.3, 9.2, 9.23],
  },
  eth: {
    symbol: "ETH",
    name: "Ethereum",
    price: 3088.06,
    volume24h: 22_563_970_614,
    change1d: -4.1,
    change7d: -1.4,
    sparkline: [3100, 3080, 3050, 3070, 3090, 3060, 3040, 3080, 3070, 3088],
  },
  btc: {
    symbol: "BTC",
    name: "Bitcoin",
    price: 91050.10,
    volume24h: 39_705_912_220,
    change1d: -2.0,
    change7d: -0.9,
    sparkline: [92000, 91500, 91000, 91200, 90800, 91100, 90900, 91050],
  },
};

const MOCK_PROPOSALS = [
  {
    id: "1",
    number: 6.7,
    title: "Fund Public Goods Working Group Q1 2025",
    status: "active" as const,
    votesFor: 1_200_000,
    votesAgainst: 580_000,
    votesAbstain: 45_000,
    quorum: 1_000_000,
    totalVoted: 1_825_000,
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
  },
  {
    id: "2",
    number: 6.6,
    title: "ENS Labs Ecosystem Development Initiative",
    status: "succeeded" as const,
    votesFor: 2_100_000,
    votesAgainst: 320_000,
    votesAbstain: 80_000,
    quorum: 1_000_000,
    totalVoted: 2_500_000,
  },
  {
    id: "3",
    number: 6.5,
    title: "Metagov Steward Elections - Term 5",
    status: "executed" as const,
    votesFor: 1_800_000,
    votesAgainst: 150_000,
    votesAbstain: 50_000,
    quorum: 1_000_000,
    totalVoted: 2_000_000,
  },
];

const MOCK_TREASURY = {
  name: "DAO Wallet",
  address: "0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7",
  totalValueUsd: 12_400_000,
  tokens: [
    { symbol: "ETH", balance: 2450, valueUsd: 8_100_000 },
    { symbol: "ENS", balance: 890_000, valueUsd: 4_200_000 },
    { symbol: "USDC", balance: 45_000, valueUsd: 45_000 },
    { symbol: "DAI", balance: 55_000, valueUsd: 55_000 },
  ],
  pendingTxCount: 2,
};

const MOCK_MEETINGS = [
  { name: "Metagov WG Call", time: "Today, 4:00 PM UTC", attendees: 12 },
  { name: "Ecosystem WG Sync", time: "Tomorrow, 2:00 PM UTC", attendees: 8 },
  { name: "Public Goods Review", time: "Thu, 5:00 PM UTC", attendees: 15 },
];

const MOCK_NEWS = [
  { title: "ICANN 82 Meeting Concludes with DNS Policy Updates", source: "ICANN", time: "2h ago" },
  { title: "ENS Newsletter #94: Year in Review", source: "ENS DAO", time: "1d ago" },
  { title: "EU Digital Identity Framework Advances", source: "Regulatory", time: "2d ago" },
];

export default function CustomDashboardPage() {
  const [dashboardName] = useState("GOVERNANCE HQ");

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <DashboardHeader name={dashboardName} />

      {/* Price Ticker */}
      <PriceTickerWidget />

      {/* Widget Grid */}
      <div className="grid grid-cols-4 gap-3">
        {/* Row 1: Price Status Bars */}
        <PriceStatusBar symbol="ENS" />
        <PriceStatusBar symbol="ETH" />
        <PriceStatusBar symbol="BTC" />
        <CompactTreasuryCard
          name="Total Treasury"
          totalValueUsd={47_800_000}
          changePercent={-3.2}
        />

        {/* Row 2: Active Proposal (spans 2) + Treasury Detail */}
        <div className="col-span-2">
          <ProposalCard proposal={MOCK_PROPOSALS[0]} />
        </div>
        <TreasuryWidget {...MOCK_TREASURY} />

        {/* Row 3: Proposal List (spans 2) + Calendar + News */}
        <Widget colSpan={2} rowSpan={2}>
          <WidgetHeader>
            <WidgetTitle>Active Proposals</WidgetTitle>
            <Badge variant="outline" size="sm">3</Badge>
          </WidgetHeader>
          <WidgetContent padding="none">
            <ProposalTable proposals={MOCK_PROPOSALS} />
          </WidgetContent>
        </Widget>

        <CalendarWidget meetings={MOCK_MEETINGS} />

        <NewsFeedWidget news={MOCK_NEWS} />

        {/* Row 4: Delegate Spotlight + Gas + Empty */}
        <DelegateSpotlight />

        <Widget>
          <WidgetHeader>
            <WidgetTitle>Gas Tracker</WidgetTitle>
          </WidgetHeader>
          <WidgetContent>
            <div className="space-y-2">
              <GasRow label="Low" gwei={12} time="~10 min" />
              <GasRow label="Average" gwei={15} time="~3 min" />
              <GasRow label="Fast" gwei={18} time="~30 sec" />
            </div>
          </WidgetContent>
        </Widget>

        <EmptyWidgetCell />
        <EmptyWidgetCell />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Dashboard Header
   ═══════════════════════════════════════════════════════════════════ */

function DashboardHeader({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{name}</h1>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
          <span>CREATED BY</span>
          <span className="text-[var(--color-interactive)]">@ENSPULSE</span>
          <span>LAST UPDATED</span>
          <span className="text-[var(--color-text-secondary)]">2 HOURS AGO</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-tertiary)] border border-[var(--color-border-subtle)] rounded hover:border-[var(--color-border-default)] hover:text-[var(--color-text-secondary)] transition-colors">
          CHOOSE THUMBNAIL
        </button>
        <button className="px-3 py-1.5 text-xs font-medium bg-[var(--color-interactive)] text-white rounded hover:bg-[var(--color-interactive-hover)] transition-colors">
          SAVE
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Proposal Table
   ═══════════════════════════════════════════════════════════════════ */

function ProposalTable({ proposals }: { proposals: typeof MOCK_PROPOSALS }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-[var(--color-border-subtle)]">
          <th className="px-4 py-2 text-left text-[11px] font-medium tracking-[0.05em] uppercase text-[var(--color-text-tertiary)]">
            Proposal
          </th>
          <th className="px-4 py-2 text-left text-[11px] font-medium tracking-[0.05em] uppercase text-[var(--color-text-tertiary)]">
            Status
          </th>
          <th className="px-4 py-2 text-right text-[11px] font-medium tracking-[0.05em] uppercase text-[var(--color-text-tertiary)]">
            For
          </th>
          <th className="px-4 py-2 text-right text-[11px] font-medium tracking-[0.05em] uppercase text-[var(--color-text-tertiary)]">
            Against
          </th>
        </tr>
      </thead>
      <tbody>
        {proposals.map((proposal) => {
          const total = proposal.votesFor + proposal.votesAgainst;
          const forPct = total > 0 ? (proposal.votesFor / total) * 100 : 0;
          const againstPct = total > 0 ? (proposal.votesAgainst / total) * 100 : 0;

          return (
            <tr
              key={proposal.id}
              className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-elevated)] cursor-pointer transition-colors"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-text-tertiary)]">
                    EP {proposal.number}
                  </span>
                  <span className="text-sm text-[var(--color-text-primary)] truncate max-w-[200px]">
                    {proposal.title}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <ProposalStatusBadge status={proposal.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm text-[var(--color-positive)] tabular-nums">
                  {forPct.toFixed(0)}%
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm text-[var(--color-negative)] tabular-nums">
                  {againstPct.toFixed(0)}%
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ProposalStatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "success" | "warning" | "info" | "danger" | "default"; label: string }> = {
    active: { variant: "info", label: "Active" },
    pending: { variant: "warning", label: "Pending" },
    passed: { variant: "success", label: "Passed" },
    failed: { variant: "danger", label: "Failed" },
    executed: { variant: "success", label: "Executed" },
    queued: { variant: "default", label: "Queued" },
  };
  const { variant, label } = config[status] || config.pending;
  return <Badge variant={variant} size="sm">{label}</Badge>;
}

/* ═══════════════════════════════════════════════════════════════════
   Calendar Widget
   ═══════════════════════════════════════════════════════════════════ */

function CalendarWidget({ meetings }: { meetings: typeof MOCK_MEETINGS }) {
  return (
    <Widget>
      <WidgetHeader>
        <WidgetTitle>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Upcoming Meetings
        </WidgetTitle>
      </WidgetHeader>
      <WidgetContent padding="sm">
        <div className="space-y-2">
          {meetings.map((meeting, i) => (
            <div
              key={i}
              className="p-2 rounded bg-[var(--color-bg-overlay)] hover:bg-[var(--color-bg-elevated)] transition-colors cursor-pointer"
            >
              <div className="text-sm text-[var(--color-text-primary)]">{meeting.name}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-[var(--color-text-tertiary)]">{meeting.time}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{meeting.attendees} attending</span>
              </div>
            </div>
          ))}
        </div>
      </WidgetContent>
    </Widget>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   News Feed Widget
   ═══════════════════════════════════════════════════════════════════ */

function NewsFeedWidget({ news }: { news: typeof MOCK_NEWS }) {
  return (
    <Widget>
      <WidgetHeader>
        <WidgetTitle>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          News Feed
        </WidgetTitle>
      </WidgetHeader>
      <WidgetContent padding="sm">
        <div className="space-y-2">
          {news.map((item, i) => (
            <div
              key={i}
              className="p-2 rounded hover:bg-[var(--color-bg-overlay)] transition-colors cursor-pointer"
            >
              <div className="text-sm text-[var(--color-text-primary)] line-clamp-2">{item.title}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[var(--color-interactive)]">{item.source}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </WidgetContent>
    </Widget>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Delegate Spotlight Widget
   ═══════════════════════════════════════════════════════════════════ */

function DelegateSpotlight() {
  return (
    <Widget>
      <WidgetHeader>
        <WidgetTitle>Top Delegate</WidgetTitle>
      </WidgetHeader>
      <WidgetContent>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-ens-blue)] to-[var(--color-ens-purple)] flex items-center justify-center text-white font-bold">
            F
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--color-text-primary)]">fireyes.eth</div>
            <div className="text-xs text-[var(--color-text-tertiary)]">Active voter</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded bg-[var(--color-bg-overlay)]">
            <div className="text-lg font-semibold text-[var(--color-text-primary)] tabular-nums">2.1M</div>
            <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase">Voting Power</div>
          </div>
          <div className="p-2 rounded bg-[var(--color-bg-overlay)]">
            <div className="text-lg font-semibold text-[var(--color-positive)] tabular-nums">98%</div>
            <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase">Participation</div>
          </div>
        </div>
      </WidgetContent>
    </Widget>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Gas Row
   ═══════════════════════════════════════════════════════════════════ */

function GasRow({ label, gwei, time }: { label: string; gwei: number; time: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-[var(--color-text-tertiary)]">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-[var(--color-text-primary)] tabular-nums">{gwei} gwei</span>
        <span className="text-xs text-[var(--color-text-muted)]">{time}</span>
      </div>
    </div>
  );
}
