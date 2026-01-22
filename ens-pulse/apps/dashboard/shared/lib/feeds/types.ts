/**
 * Shared type definitions for Discourse and Social feeds
 */

export interface NormalizedDiscourseItem {
  id: string;                    // `discourse-{topic_id}`
  source: 'discourse';
  url: string;                   // Full topic URL
  title: string;
  author: string;
  authorAvatar?: string;
  createdAt: string;             // ISO timestamp (topic creation)
  lastActivityAt: string;        // ISO timestamp (last reply/post)
  category: string;
  categoryName: string;
  tags: string[];
  stats: {
    replies: number;
    views: number;
    likes: number;
  };
  rawContent: string;            // First post text (max 2000 chars)
  summary: string | null;        // LLM-generated 280-char summary
}

export interface NormalizedSocialItem {
  id: string;                    // `twitter-{tweet_id}`
  source: 'twitter';
  platform: 'X';
  url: string;
  author: {
    handle: string;
    displayName: string;
    avatar: string;
    verified: boolean;
  };
  createdAt: string;
  content: {
    text: string;
    urls: string[];
    mentions: string[];
    hashtags: string[];
  };
  stats: {
    likes: number;
    retweets: number;
    replies: number;
  };
  isRetweet: boolean;
  isAnnouncement: boolean;       // Has links + high engagement
  summary: string | null;
}

export interface FeedMeta {
  count: number;
  lastUpdated: string;
  source: string;
}

export interface DiscourseFeedResponse {
  items: NormalizedDiscourseItem[];
  meta: FeedMeta;
}

export interface SocialFeedResponse {
  items: NormalizedSocialItem[];
  meta: FeedMeta & {
    accounts: string[];
  };
}
