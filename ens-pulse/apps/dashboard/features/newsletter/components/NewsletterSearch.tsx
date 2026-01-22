"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { Newspaper, Search, ExternalLink, ChevronRight } from "lucide-react";
import { formatTimeAgo } from "@/shared/lib/utils";

interface NewsletterItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
}

interface NewsletterResponse {
  success: boolean;
  data: {
    items: NewsletterItem[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    query: string;
    lastUpdated: string;
  };
}

async function searchNewsletters(query: string): Promise<NewsletterResponse> {
  const params = new URLSearchParams({ limit: "10" });
  if (query) params.set("q", query);

  const res = await fetch(`/api/newsletter/search?${params}`);
  if (!res.ok) throw new Error("Failed to search newsletters");
  return res.json();
}

function NewsletterCard({ item }: { item: NewsletterItem }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 rounded-lg bg-muted/50 border border-border hover:border-ens-blue/50 hover:bg-muted transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
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

export function NewsletterSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["newsletters", debouncedQuery],
    queryFn: () => searchNewsletters(debouncedQuery),
    refetchInterval: 900000, // 15 minutes
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(searchQuery);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-ens-blue" />
          <CardTitle>Newsletter Archive</CardTitle>
        </div>
        <Badge variant="info">90+ Newsletters</Badge>
      </CardHeader>

      <CardContent>
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search newsletters..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-muted border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ens-blue/50"
            />
          </div>
        </form>

        {/* Results */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {isLoading && (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
              ))}
            </>
          )}

          {error && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Failed to load newsletters
            </div>
          )}

          {data && data.data.items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {debouncedQuery
                ? `No results for "${debouncedQuery}"`
                : "No newsletters found"}
            </div>
          )}

          {data &&
            data.data.items.map((item, index) => (
              <NewsletterCard key={`${item.link}-${index}`} item={item} />
            ))}
        </div>

        {data && data.data.pagination.hasMore && (
          <div className="mt-4 pt-4 border-t border-border">
            <Button variant="ghost" className="w-full">
              Load more
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
