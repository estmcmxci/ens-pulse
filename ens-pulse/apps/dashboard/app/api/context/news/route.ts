import { NextResponse } from "next/server";
import { fetchAllFeeds, fetchFeedsByCategory, aggregateFeedItems } from "@/shared/lib/feeds/client";
import type { FeedConfig } from "@/shared/config/feeds";

export const revalidate = 900; // 15 minute cache

// Valid categories for feed filtering
const VALID_CATEGORIES = ["newsletter", "ens", "dns", "crypto", "regulatory"] as const;

function isValidCategory(value: string | null): value is FeedConfig["category"] {
  return value !== null && VALID_CATEGORIES.includes(value as FeedConfig["category"]);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get("category");
    const limitParam = searchParams.get("limit");

    // Validate category parameter
    const category = isValidCategory(categoryParam) ? categoryParam : null;

    // Validate limit parameter (clamp to reasonable range)
    const limit = Math.min(Math.max(parseInt(limitParam || "20", 10) || 20, 1), 100);

    let feeds;
    if (category) {
      feeds = await fetchFeedsByCategory(category);
    } else {
      feeds = await fetchAllFeeds();
    }

    const items = aggregateFeedItems(feeds).slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        feeds: feeds.map((feed) => ({
          key: feed.key,
          name: feed.config.name,
          category: feed.config.category,
          itemCount: feed.items.length,
          lastBuildDate: feed.lastBuildDate,
        })),
        items,
        totalItems: items.length,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch news feeds" },
      { status: 500 }
    );
  }
}
