import { NextResponse } from "next/server";
import { fetchNewsletterFeeds, aggregateFeedItems, searchFeedItems } from "@/shared/lib/feeds/client";

export const revalidate = 900; // 15 minute cache

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Fetch all newsletter feeds
    const feeds = await fetchNewsletterFeeds();
    let items = aggregateFeedItems(feeds);

    // Apply search if query provided
    if (query.trim()) {
      items = searchFeedItems(items, query);
    }

    // Apply pagination
    const totalCount = items.length;
    const paginatedItems = items.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        items: paginatedItems,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
        query,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error searching newsletters:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search newsletters" },
      { status: 500 }
    );
  }
}
