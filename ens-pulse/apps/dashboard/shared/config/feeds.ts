export const RSS_FEEDS = {
  // ENS Newsletter sources
  NEWSLETTER_FORUM: "https://discuss.ens.domains/c/dao-wide/newsletter/72.rss",
  NEWSLETTER_PARAGRAPH: "https://paragraph.xyz/@ensdao/feed.xml",

  // ENS Blog
  ENS_BLOG: "https://blog.ens.domains/feed",

  // DNS/Naming News
  ICANN_NEWS: "https://www.icann.org/news/rss",
  CIRCLEID: "https://circleid.com/rss/posts",

  // Crypto/Ethereum News
  ETHEREUM_BLOG: "https://blog.ethereum.org/feed.xml",
  VITALIK_BLOG: "https://vitalik.eth.limo/feed.xml",

  // Regulatory
  SEC_NEWS: "https://www.sec.gov/rss/news/pressreleases.xml",
} as const;

export type FeedKey = keyof typeof RSS_FEEDS;
export type FeedUrl = (typeof RSS_FEEDS)[FeedKey];

export interface FeedConfig {
  key: FeedKey;
  url: FeedUrl;
  name: string;
  category: "newsletter" | "ens" | "dns" | "crypto" | "regulatory";
  refreshInterval: number; // in minutes
  priority: "high" | "medium" | "low";
}

export const FEED_CONFIGS: FeedConfig[] = [
  {
    key: "NEWSLETTER_FORUM",
    url: RSS_FEEDS.NEWSLETTER_FORUM,
    name: "ENS Newsletter (Forum)",
    category: "newsletter",
    refreshInterval: 60,
    priority: "high",
  },
  {
    key: "NEWSLETTER_PARAGRAPH",
    url: RSS_FEEDS.NEWSLETTER_PARAGRAPH,
    name: "ENS Newsletter (Paragraph)",
    category: "newsletter",
    refreshInterval: 60,
    priority: "high",
  },
  {
    key: "ENS_BLOG",
    url: RSS_FEEDS.ENS_BLOG,
    name: "ENS Blog",
    category: "ens",
    refreshInterval: 60,
    priority: "high",
  },
  {
    key: "ICANN_NEWS",
    url: RSS_FEEDS.ICANN_NEWS,
    name: "ICANN News",
    category: "dns",
    refreshInterval: 360,
    priority: "medium",
  },
  {
    key: "CIRCLEID",
    url: RSS_FEEDS.CIRCLEID,
    name: "CircleID",
    category: "dns",
    refreshInterval: 360,
    priority: "low",
  },
  {
    key: "ETHEREUM_BLOG",
    url: RSS_FEEDS.ETHEREUM_BLOG,
    name: "Ethereum Blog",
    category: "crypto",
    refreshInterval: 120,
    priority: "medium",
  },
  {
    key: "VITALIK_BLOG",
    url: RSS_FEEDS.VITALIK_BLOG,
    name: "Vitalik's Blog",
    category: "crypto",
    refreshInterval: 1440,
    priority: "low",
  },
  {
    key: "SEC_NEWS",
    url: RSS_FEEDS.SEC_NEWS,
    name: "SEC Press Releases",
    category: "regulatory",
    refreshInterval: 360,
    priority: "medium",
  },
];

export function getFeedsByCategory(
  category: FeedConfig["category"]
): FeedConfig[] {
  return FEED_CONFIGS.filter((feed) => feed.category === category);
}

export function getHighPriorityFeeds(): FeedConfig[] {
  return FEED_CONFIGS.filter((feed) => feed.priority === "high");
}
