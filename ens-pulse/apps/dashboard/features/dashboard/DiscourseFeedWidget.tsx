"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  Widget,
  WidgetHeader,
  WidgetTitle,
  WidgetContent,
} from "@/shared/components/widgets";
import { useDiscourseFeed } from "@/shared/hooks/use-api-data";
import { formatTimeAgo } from "@/shared/lib/formatters";

/* ═══════════════════════════════════════════════════════════════════════════
   DISCOURSE FEED WIDGET — Forum discussions from last 7 days (table format)
   ═══════════════════════════════════════════════════════════════════════════ */

export function DiscourseFeedWidget() {
  const { data, isLoading, error } = useDiscourseFeed(10, 7); // Last 7 days of activity

  return (
    <Widget>
      <WidgetHeader>
        <WidgetTitle>FORUM</WidgetTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-tertiary)]">Last 7 days</span>
          <Link
            href="https://discuss.ens.domains"
            target="_blank"
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </WidgetHeader>
      <WidgetContent padding="sm">
        {isLoading ? (
          <div className="h-32 flex items-center justify-center text-[var(--color-text-muted)]">Loading...</div>
        ) : error ? (
          <div className="text-sm text-[var(--color-negative)]">Failed to load</div>
        ) : data?.items.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-sm text-[var(--color-text-muted)]">
            No discussions in the last 7 days
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[400px] scroll-container">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[var(--color-bg-raised)]">
                <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border-subtle)]">
                  <th className="text-left py-1.5 font-medium">Topic</th>
                  <th className="text-right py-1.5 font-medium w-16">Replies</th>
                  <th className="text-right py-1.5 font-medium w-16">Views</th>
                  <th className="text-right py-1.5 font-medium w-20">Activity</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.slice(0, 10).map((item) => (
                  <tr key={item.id} className="border-b border-[var(--color-border-subtle)] last:border-0 align-top">
                    <td className="py-1.5">
                      <Link
                        href={item.url}
                        target="_blank"
                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-ens-blue)] transition-colors line-clamp-1"
                        title={item.title}
                      >
                        {item.title}
                      </Link>
                      {item.summary && (
                        <p className="text-[10px] text-[var(--color-text-muted)] line-clamp-1 mt-0.5">
                          {item.summary}
                        </p>
                      )}
                    </td>
                    <td className="py-1.5 text-right text-[var(--color-text-primary)] tabular-nums">
                      {item.stats.replies}
                    </td>
                    <td className="py-1.5 text-right text-[var(--color-text-primary)] tabular-nums">
                      {item.stats.views}
                    </td>
                    <td className="py-1.5 text-right text-[var(--color-text-muted)] tabular-nums">
                      {formatTimeAgo(item.lastActivityAt)}
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

export default DiscourseFeedWidget;
