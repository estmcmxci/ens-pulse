/**
 * Twitter API v2 client for ENS social feeds
 * Fetches posts from @ensdomains and @ens_dao
 */

import { NormalizedSocialItem } from './types';
import { feedCache, CACHE_TTL } from './cache';

const TWITTER_API = 'https://api.twitter.com/2';

// ENS official Twitter account IDs (updated 2026-01-21)
const ENS_ACCOUNTS: Record<string, string> = {
  ensdomains: '996321865311358976',
  ens_dao: '1460209825422327809',
};

interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    impression_count?: number;
  };
  entities?: {
    urls?: Array<{ expanded_url: string }>;
    mentions?: Array<{ username: string }>;
    hashtags?: Array<{ tag: string }>;
  };
  referenced_tweets?: Array<{ type: string; id: string }>;
  attachments?: {
    media_keys?: string[];
  };
}

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
  verified?: boolean;
}

interface TwitterResponse {
  data?: TwitterTweet[];
  includes?: {
    users?: TwitterUser[];
    media?: Array<{ media_key: string; type: string; url?: string }>;
  };
}

export async function fetchTwitterPosts(
  accounts = ['ensdomains', 'ens_dao'],
  limit = 10
): Promise<NormalizedSocialItem[]> {
  const cacheKey = `twitter:posts:${accounts.join(',')}:${limit}`;
  const cached = feedCache.get<NormalizedSocialItem[]>(cacheKey);
  if (cached) return cached;

  // Support both env var names for backward compatibility
  // URL-decode the token in case it has encoded characters
  const rawToken = process.env.TWITTER_BEARER_TOKEN || process.env.X_BEARER_TOKEN;
  if (!rawToken) {
    console.error('TWITTER_BEARER_TOKEN or X_BEARER_TOKEN not configured');
    return [];
  }
  const token = decodeURIComponent(rawToken);

  // Fetch from each account in parallel
  const postPromises = accounts.map(async (account) => {
    const userId = ENS_ACCOUNTS[account];
    if (!userId) return [];

    try {
      const params = new URLSearchParams({
        max_results: Math.max(5, Math.min(limit, 10)).toString(), // Twitter requires min 5, max 100
        'tweet.fields': 'created_at,public_metrics,entities,referenced_tweets',
        'user.fields': 'name,username,profile_image_url,verified',
        expansions: 'author_id',
      });

      const res = await fetch(
        `${TWITTER_API}/users/${userId}/tweets?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          next: { revalidate: 300 }, // 5 min cache
        }
      );

      if (!res.ok) {
        const errorBody = await res.text();
        console.error(`Twitter API error for ${account}:`, res.status, errorBody);
        return [];
      }

      const data: TwitterResponse = await res.json();
      return (data.data || []).map((tweet) =>
        normalizeTwitterPost(tweet, data.includes, account)
      );
    } catch (error) {
      console.error(`Error fetching tweets for ${account}:`, error);
      return [];
    }
  });

  const allPosts = (await Promise.all(postPromises)).flat();

  // Sort by date, limit
  const sorted = allPosts
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, limit);

  // Cache result
  feedCache.set(cacheKey, sorted, CACHE_TTL.SOCIAL_POSTS);

  return sorted;
}

function normalizeTwitterPost(
  tweet: TwitterTweet,
  includes: TwitterResponse['includes'],
  account: string
): NormalizedSocialItem {
  const author = includes?.users?.find((u) => u.id === tweet.author_id);
  const metrics = tweet.public_metrics || {
    like_count: 0,
    retweet_count: 0,
    reply_count: 0,
  };
  const isRetweet =
    tweet.referenced_tweets?.some((r) => r.type === 'retweeted') || false;

  return {
    id: `twitter-${tweet.id}`,
    source: 'twitter',
    platform: 'X',
    url: `https://x.com/${author?.username || account}/status/${tweet.id}`,
    author: {
      handle: author?.username || account,
      displayName: author?.name || account,
      avatar: author?.profile_image_url || '',
      verified: author?.verified || false,
    },
    createdAt: tweet.created_at,
    content: {
      text: tweet.text,
      urls: tweet.entities?.urls?.map((u) => u.expanded_url) || [],
      mentions: tweet.entities?.mentions?.map((m) => m.username) || [],
      hashtags: tweet.entities?.hashtags?.map((h) => h.tag) || [],
    },
    stats: {
      likes: metrics.like_count || 0,
      retweets: metrics.retweet_count || 0,
      replies: metrics.reply_count || 0,
    },
    isRetweet,
    isAnnouncement: detectAnnouncement(tweet, metrics),
    summary: null,
  };
}

function detectAnnouncement(
  tweet: TwitterTweet,
  metrics: TwitterTweet['public_metrics']
): boolean {
  const hasLinks = (tweet.entities?.urls?.length || 0) > 0;
  const highEngagement = (metrics?.like_count || 0) > 50;
  return hasLinks && highEngagement;
}
