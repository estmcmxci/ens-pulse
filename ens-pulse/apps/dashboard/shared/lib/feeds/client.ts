import Parser from "rss-parser";
import { RSS_FEEDS, FEED_CONFIGS, type FeedKey, type FeedConfig } from "@/shared/config/feeds";

// Raw item type from RSS parser with custom fields
interface RawFeedItem {
  title?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
  content?: string;
  contentSnippet?: string;
  contentEncoded?: string;
  creator?: string;
  categories?: string[];
  guid?: string;
}

const parser = new Parser<Record<string, unknown>, RawFeedItem>({
  customFields: {
    item: [
      ["content:encoded", "contentEncoded"],
      ["dc:creator", "creator"],
    ],
  },
});

export interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  contentSnippet: string;
  creator?: string;
  categories?: string[];
  guid: string;
}

export interface ParsedFeed {
  key: FeedKey;
  config: FeedConfig;
  title: string;
  description: string;
  link: string;
  lastBuildDate?: string;
  items: FeedItem[];
  fetchedAt: string;
}

interface FeedOutput {
  title?: string;
  description?: string;
  link?: string;
  lastBuildDate?: string;
  items: RawFeedItem[];
}

export async function fetchFeed(url: string): Promise<FeedOutput> {
  const result = await parser.parseURL(url);
  return result as FeedOutput;
}

export async function fetchFeedByKey(key: FeedKey): Promise<ParsedFeed | null> {
  const config = FEED_CONFIGS.find((c) => c.key === key);
  if (!config) {
    console.warn(`No config found for feed key: ${key}`);
    return null;
  }

  try {
    const feed = await fetchFeed(config.url);

    return {
      key,
      config,
      title: feed.title || config.name,
      description: feed.description || "",
      link: feed.link || "",
      lastBuildDate: feed.lastBuildDate,
      items: (feed.items || []).map((item) => ({
        title: item.title || "",
        link: item.link || "",
        pubDate: item.pubDate || item.isoDate || "",
        content: item.contentEncoded || item.content || "",
        contentSnippet: item.contentSnippet || "",
        creator: item.creator,
        categories: item.categories,
        guid: item.guid || item.link || "",
      })),
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching feed ${key}:`, error);
    return null;
  }
}

export async function fetchAllFeeds(): Promise<ParsedFeed[]> {
  const results = await Promise.allSettled(
    Object.keys(RSS_FEEDS).map((key) => fetchFeedByKey(key as FeedKey))
  );

  return results
    .filter((result) => result.status === "fulfilled" && result.value !== null)
    .map((result) => (result as PromiseFulfilledResult<ParsedFeed>).value);
}

export async function fetchFeedsByCategory(
  category: FeedConfig["category"]
): Promise<ParsedFeed[]> {
  const feedsInCategory = FEED_CONFIGS.filter((c) => c.category === category);
  const results = await Promise.allSettled(
    feedsInCategory.map((config) => fetchFeedByKey(config.key))
  );

  return results
    .filter((result) => result.status === "fulfilled" && result.value !== null)
    .map((result) => (result as PromiseFulfilledResult<ParsedFeed>).value);
}

export async function fetchNewsletterFeeds(): Promise<ParsedFeed[]> {
  return fetchFeedsByCategory("newsletter");
}

export function aggregateFeedItems(feeds: ParsedFeed[]): FeedItem[] {
  const allItems = feeds.flatMap((feed) =>
    feed.items.map((item) => ({
      ...item,
      source: feed.config.name,
      category: feed.config.category,
    }))
  );

  // Sort by date, newest first
  return allItems.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
}

export function searchFeedItems(
  items: FeedItem[],
  query: string
): FeedItem[] {
  const lowerQuery = query.toLowerCase();
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.contentSnippet.toLowerCase().includes(lowerQuery) ||
      item.content.toLowerCase().includes(lowerQuery)
  );
}
