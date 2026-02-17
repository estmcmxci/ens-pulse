"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalContextPanel } from "@/features/external-context/components/ExternalContextPanel";
import { UpcomingMeetings } from "@/features/external-context/components/UpcomingMeetings";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { Globe, Newspaper, ExternalLink, Rss } from "lucide-react";
import { ProtocolHealthWidget } from "@/shared/components/widgets";
import { formatTimeAgo } from "@/shared/lib/utils";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
  source?: string;
  category?: string;
}

interface NewsResponse {
  success: boolean;
  data: {
    items: NewsItem[];
    lastUpdated: string;
  };
}

async function fetchNews(): Promise<NewsResponse> {
  const res = await fetch("/api/context/news?limit=10");
  if (!res.ok) throw new Error("Failed to fetch news");
  return res.json();
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 rounded-lg bg-muted/50 border border-border hover:border-ens-blue/50 transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {item.source && (
              <Badge variant="default" className="text-xs">
                {item.source}
              </Badge>
            )}
            {item.category && (
              <Badge variant="ens" className="text-xs">
                {item.category}
              </Badge>
            )}
          </div>
          <h4 className="font-medium text-sm group-hover:text-ens-blue transition-colors line-clamp-2">
            {item.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {item.contentSnippet}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {formatTimeAgo(item.pubDate)}
          </p>
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-ens-blue transition-colors flex-shrink-0" />
      </div>
    </a>
  );
}

export default function ContextPage() {
  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ["news-all"],
    queryFn: fetchNews,
    refetchInterval: 900000, // 15 minutes
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="animate-in stagger-1">
        <h1 className="text-3xl font-700 tracking-tight text-[var(--color-text-primary)]">World Context</h1>
        <p className="label mt-2">
          External signals that matter for ENS governance decisions
        </p>
        <div className="divider-ens mt-4" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Market & Status */}
        <div className="space-y-6">
          <ExternalContextPanel />
          <ProtocolHealthWidget />
          <UpcomingMeetings />
        </div>

        {/* Right Column - News Feed */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-ens-blue" />
                <CardTitle>Latest News & Updates</CardTitle>
              </div>
              <Badge variant="info">
                <Rss className="h-3 w-3 mr-1" />
                Live Feeds
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {newsLoading && (
                  <>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
                    ))}
                  </>
                )}

                {newsData && newsData.data.items.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No news available</p>
                  </div>
                )}

                {newsData &&
                  newsData.data.items.map((item, index) => (
                    <NewsCard key={`${item.link}-${index}`} item={item} />
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feed Sources */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-ens-purple" />
            <CardTitle>Monitored Sources</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "ENS Newsletter", category: "ens" },
              { name: "ENS Blog", category: "ens" },
              { name: "ENS Node", category: "protocol" },
              { name: "ICANN News", category: "dns" },
              { name: "CircleID", category: "dns" },
              { name: "Ethereum Blog", category: "crypto" },
              { name: "SEC Press", category: "regulatory" },
              { name: "Cloudflare Status", category: "infra" },
              { name: "Etherscan Gas", category: "infra" },
            ].map((source) => (
              <div
                key={source.name}
                className="p-3 rounded-lg bg-muted/50 border border-border"
              >
                <p className="font-medium text-sm">{source.name}</p>
                <Badge variant="default" className="text-xs mt-1">
                  {source.category}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
