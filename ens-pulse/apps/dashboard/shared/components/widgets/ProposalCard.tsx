"use client";

import { cn } from "@/shared/lib/utils";
import { type ProposalStatus } from "@/shared/config/ens";
import {
  Widget,
  WidgetContent,
} from "./Widget";

/* ═══════════════════════════════════════════════════════════════════
   Proposal Card Widget — Single governance proposal display
   Shows: ID, status, title, voting bar, participation, deadline
   ═══════════════════════════════════════════════════════════════════ */

interface ProposalCardProps {
  proposal: {
    id: string;
    number?: number;
    title: string;
    status: ProposalStatus;
    votesFor: number;
    votesAgainst: number;
    votesAbstain?: number;
    quorum: number;
    totalVoted: number;
    deadline?: Date;
  };
  onClick?: () => void;
  className?: string;
}

export function ProposalCard({ proposal, onClick, className }: ProposalCardProps) {
  const totalVotes = proposal.votesFor + proposal.votesAgainst + (proposal.votesAbstain || 0);
  const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;
  const abstainPercentage = totalVotes > 0 ? ((proposal.votesAbstain || 0) / totalVotes) * 100 : 0;
  const quorumMet = proposal.totalVoted >= proposal.quorum;

  return (
    <Widget
      className={cn(
        onClick && "cursor-pointer hover:bg-[var(--color-bg-elevated)] transition-colors",
        className
      )}
      onClick={onClick}
    >
      <WidgetContent padding="md">
        {/* Header: ID, Status, Countdown */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {proposal.number && (
              <span className="text-xs font-medium text-[var(--color-text-tertiary)]">
                EP {proposal.number}
              </span>
            )}
            <StatusBadge status={proposal.status} />
          </div>
          {proposal.deadline && proposal.status === "active" && (
            <Countdown deadline={proposal.deadline} />
          )}
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3 line-clamp-2">
          {proposal.title}
        </h4>

        {/* Vote Bar */}
        <div className="mb-2">
          <VoteBar
            forPercent={forPercentage}
            againstPercent={againstPercentage}
            abstainPercent={abstainPercentage}
          />
        </div>

        {/* Vote Stats */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--color-text-secondary)]">
            {formatVotePower(proposal.totalVoted)} ENS voted
          </span>
          <span
            className={cn(
              "flex items-center gap-1",
              quorumMet ? "text-[var(--color-positive)]" : "text-[var(--color-text-tertiary)]"
            )}
          >
            Quorum: {formatVotePower(proposal.quorum)}
            {quorumMet && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </span>
        </div>
      </WidgetContent>
    </Widget>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Status Badge
   ═══════════════════════════════════════════════════════════════════ */

interface StatusBadgeProps {
  status: ProposalStatus;
}

const statusStyles: Record<ProposalStatus, string> = {
  active: "bg-[var(--color-info-muted)] text-[var(--color-info)]",
  pending: "bg-[var(--color-warning-muted)] text-[var(--color-warning)]",
  succeeded: "bg-[var(--color-positive-muted)] text-[var(--color-positive)]",
  defeated: "bg-[var(--color-negative-muted)] text-[var(--color-negative)]",
  canceled: "bg-[var(--color-negative-muted)] text-[var(--color-negative)]",
  expired: "bg-[var(--color-negative-muted)] text-[var(--color-negative)]",
  queued: "bg-[var(--color-bg-overlay)] text-[var(--color-text-secondary)]",
  executed: "bg-[var(--color-positive-muted)] text-[var(--color-positive)]",
};

const statusLabels: Record<ProposalStatus, string> = {
  active: "Active",
  pending: "Pending",
  succeeded: "Passed",
  defeated: "Failed",
  canceled: "Canceled",
  expired: "Expired",
  queued: "Queued",
  executed: "Executed",
};

function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "px-2 py-0.5 text-[10px] font-medium rounded uppercase tracking-wide",
        statusStyles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Vote Bar
   ═══════════════════════════════════════════════════════════════════ */

interface VoteBarProps {
  forPercent: number;
  againstPercent: number;
  abstainPercent?: number;
}

function VoteBar({ forPercent, againstPercent, abstainPercent = 0 }: VoteBarProps) {
  return (
    <div className="space-y-1">
      {/* Bar */}
      <div className="h-1.5 bg-[var(--color-bg-overlay)] rounded-full overflow-hidden flex">
        <div
          className="h-full bg-[var(--color-positive)] transition-all"
          style={{ width: `${forPercent}%` }}
        />
        <div
          className="h-full bg-[var(--color-negative)] transition-all"
          style={{ width: `${againstPercent}%` }}
        />
        {abstainPercent > 0 && (
          <div
            className="h-full bg-[var(--color-text-tertiary)] transition-all"
            style={{ width: `${abstainPercent}%` }}
          />
        )}
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[var(--color-positive)] font-medium">
          {forPercent.toFixed(0)}% For
        </span>
        <span className="text-[var(--color-negative)] font-medium">
          {againstPercent.toFixed(0)}% Against
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Countdown
   ═══════════════════════════════════════════════════════════════════ */

interface CountdownProps {
  deadline: Date;
}

function Countdown({ deadline }: CountdownProps) {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();

  if (diff <= 0) {
    return (
      <span className="text-xs text-[var(--color-text-tertiary)]">Ended</span>
    );
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return (
    <span className="text-xs font-medium text-[var(--color-warning)] tabular-nums">
      {days > 0 ? `${days}d ` : ""}{hours}h
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Formatters
   ═══════════════════════════════════════════════════════════════════ */

function formatVotePower(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}
