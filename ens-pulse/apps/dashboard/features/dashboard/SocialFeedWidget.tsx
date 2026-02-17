"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  Widget,
  WidgetHeader,
  WidgetTitle,
  WidgetContent,
} from "@/shared/components/widgets";
import { useSocialFeed } from "@/shared/hooks/use-api-data";
import { formatTimeAgo } from "@/shared/lib/formatters";

/* ═══════════════════════════════════════════════════════════════════════════
   SOCIAL FEED WIDGET — Twitter/X posts from @ensdomains and @ens_dao (table format)
   ═══════════════════════════════════════════════════════════════════════════ */

export function SocialFeedWidget() {
  const { data, isLoading, error } = useSocialFeed(10); // 10 most recent tweets

  return (
    <Widget>
      <WidgetHeader>
        <WidgetTitle>SOCIAL</WidgetTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-tertiary)]">@ensdomains · @ens_dao</span>
          <Link
            href="https://x.com/ensdomains"
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
            No recent tweets
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[400px] scroll-container">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[var(--color-bg-raised)]">
                <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border-subtle)]">
                  <th className="text-left py-1.5 font-medium">Post</th>
                  <th className="text-right py-1.5 font-medium w-24">Author</th>
                  <th className="text-right py-1.5 font-medium w-12">Likes</th>
                  <th className="text-right py-1.5 font-medium w-12">RTs</th>
                  <th className="text-right py-1.5 font-medium w-20">Posted</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.slice(0, 10).map((item) => (
                  <tr key={item.id} className="border-b border-[var(--color-border-subtle)] last:border-0 align-top">
                    <td className="py-1.5">
                      <Link
                        href={item.url}
                        target="_blank"
                        className="block hover:text-[var(--color-ens-blue)] transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          {item.summary ? (
                            <span className="text-[var(--color-text-secondary)] line-clamp-1">
                              {item.summary}
                            </span>
                          ) : (
                            <span className="text-[var(--color-text-muted)] line-clamp-1">
                              {item.content?.text?.slice(0, 100) || "—"}
                            </span>
                          )}
                          {item.isRetweet && (
                            <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">RT</span>
                          )}
                          {item.isAnnouncement && (
                            <span className="text-[10px] px-1 py-0.5 rounded bg-[var(--color-info)]/20 text-[var(--color-info)] shrink-0">
                              Announce
                            </span>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="py-1.5 text-right text-[var(--color-text-muted)]">
                      @{item.author.handle}
                    </td>
                    <td className="py-1.5 text-right text-[var(--color-text-primary)] tabular-nums">
                      {item.stats.likes}
                    </td>
                    <td className="py-1.5 text-right text-[var(--color-text-primary)] tabular-nums">
                      {item.stats.retweets}
                    </td>
                    <td className="py-1.5 text-right text-[var(--color-text-muted)] tabular-nums">
                      {formatTimeAgo(item.createdAt)}
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

export default SocialFeedWidget;
