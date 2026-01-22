# Automated Feeds Implementation Plan

## Overview

Design two automated content feeds for ENS Pulse, using patterns from the Editor MCP Server:

1. **Discourse Feed** - Forum discussions from `discuss.ens.domains`
2. **Social Feed** - Posts from `@ensdomains` and `@ens_dao`

Both feeds generate **280-character neutral summaries** optimized for clarity and skim-ability.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ENS PULSE DASHBOARD                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │  Discourse Feed  │    │   Social Feed    │    │   Existing Feeds │   │
│  │     Widget       │    │     Widget       │    │   (News, etc.)   │   │
│  └────────┬─────────┘    └────────┬─────────┘    └──────────────────┘   │
│           │                       │                                      │
│           ▼                       ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      SWR Data Hooks                               │   │
│  │   useDiscourseFeed()              useSocialFeed()                 │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API ROUTES                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  /api/feeds/discourse              /api/feeds/social                     │
│  ┌─────────────────────┐          ┌─────────────────────┐               │
│  │ 1. Check cache      │          │ 1. Check cache      │               │
│  │ 2. Fetch raw data   │          │ 2. Fetch raw data   │               │
│  │ 3. Normalize        │          │ 3. Normalize        │               │
│  │ 4. Summarize (LLM)  │          │ 4. Summarize (LLM)  │               │
│  │ 5. Cache & return   │          │ 5. Cache & return   │               │
│  └─────────────────────┘          └─────────────────────┘               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SHARED LIBRARIES                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  /shared/lib/feeds/                                                      │
│  ├── discourse-client.ts    # Discourse API wrapper                     │
│  ├── social-client.ts       # X/Twitter API wrapper                     │
│  ├── summarizer.ts          # LLM summarization (OpenAI/Anthropic)      │
│  ├── cache.ts               # In-memory + Redis-compatible cache        │
│  └── types.ts               # Shared type definitions                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Discourse Feed

### Data Source

| Property | Value |
|----------|-------|
| Base URL | `https://discuss.ens.domains` |
| API Endpoint | `/latest.json` (public, no auth required) |
| Category IDs | `33` (DAO-wide), `34` (Governance), `51` (Temp Check), `72` (Newsletter) |
| Rate Limit | 60 requests/minute (public API) |

### Fetch Strategy

```typescript
// Endpoint: GET /api/feeds/discourse?limit=10&categories=33,34

interface DiscourseTopicRaw {
  id: number;
  title: string;
  slug: string;
  created_at: string;
  last_posted_at: string;
  posts_count: number;
  reply_count: number;
  views: number;
  like_count: number;
  category_id: number;
  tags: string[];
  posters: Array<{ user_id: number; description: string }>;
  excerpt?: string;
}

// Fetch flow:
// 1. GET /latest.json?category={id}&order=created
// 2. For each topic, GET /t/{slug}/{id}.json for first post content
// 3. Extract: title, author, created_at, first_post_text, tags
```

### Parsing & Normalization

```typescript
interface NormalizedDiscourseItem {
  id: string;                    // `discourse-{topic_id}`
  source: 'discourse';
  url: string;                   // Full topic URL
  title: string;                 // Original title
  author: string;                // Username of OP
  authorAvatar: string;          // Avatar URL
  createdAt: string;             // ISO timestamp
  category: string;              // Category name
  tags: string[];                // Topic tags
  stats: {
    replies: number;
    views: number;
    likes: number;
  };
  rawContent: string;            // First post text (truncated to 2000 chars)
  summary: string;               // LLM-generated 280-char summary
}
```

### Summarization Prompt

```typescript
const DISCOURSE_SUMMARIZATION_PROMPT = `
You are a neutral governance analyst summarizing ENS DAO forum discussions.

TASK: Generate a concise, factual summary of this forum thread.

CONSTRAINTS:
- Maximum 280 characters (strict limit)
- Neutral, objective tone - no opinion or speculation
- Focus on: what is being proposed/discussed, who is involved, key implications
- No emojis, exclamation marks, or hype language
- Use present tense for ongoing discussions
- Include proposal numbers (EP/EIP) if mentioned

BANNED WORDS: exciting, amazing, groundbreaking, revolutionary, huge, massive

INPUT:
Title: {title}
Category: {category}
Author: {author}
Content: {content}

OUTPUT (280 chars max):
`;
```

### Caching Strategy

| Cache Layer | TTL | Purpose |
|-------------|-----|---------|
| API Response Cache | 15 min | Reduce Discourse API calls |
| Summarization Cache | 24 hours | Avoid re-summarizing same content |
| Client-side (SWR) | 5 min | Fast UI updates |

```typescript
// Cache key structure
const cacheKey = `discourse:${topicId}:${contentHash}`;

// Invalidation triggers:
// - New reply to topic (content hash changes)
// - Manual refresh request
```

### Error Handling

```typescript
// Graceful degradation hierarchy:
try {
  // 1. Try fetching fresh data + summaries
  return await fetchAndSummarize();
} catch (llmError) {
  // 2. If LLM fails, return without summaries
  return await fetchWithoutSummaries();
} catch (apiError) {
  // 3. If Discourse API fails, return cached data
  return getCachedData();
} catch (cacheError) {
  // 4. If cache fails, return empty with error flag
  return { items: [], error: 'Service temporarily unavailable' };
}
```

---

## 2. Social Feed

### Data Sources

| Platform | Accounts | Method |
|----------|----------|--------|
| X (Twitter) | `@ensdomains`, `@ens_dao` | Twitter API v2 |
| Farcaster (optional) | `@ens` | Neynar API |

### API Requirements

```typescript
// Twitter API v2 (requires Bearer Token)
// Endpoint: GET /2/users/{id}/tweets

// Required scopes: tweet.read, users.read
// Rate limit: 1500 requests/15 min (app-level)

interface TwitterConfig {
  bearerToken: string;           // TWITTER_BEARER_TOKEN env var
  userIds: {
    ensdomains: '2788237729',    // @ensdomains user ID
    ens_dao: '1457051534928605185' // @ens_dao user ID
  };
  maxResults: 10;
  excludeReplies: true;
  excludeRetweets: false;        // Include RTs for announcements
}
```

### Fetch Strategy

```typescript
// Endpoint: GET /api/feeds/social?accounts=ensdomains,ens_dao&limit=10

// Fetch flow:
// 1. GET tweets for each account (parallel)
// 2. Merge and sort by created_at (newest first)
// 3. Deduplicate (same content from RT)
// 4. Normalize and summarize
```

### Parsing & Normalization

```typescript
interface NormalizedSocialItem {
  id: string;                    // `twitter-{tweet_id}`
  source: 'twitter' | 'farcaster';
  platform: string;              // 'X' or 'Farcaster'
  url: string;                   // Direct link to post
  author: {
    handle: string;              // @ensdomains
    displayName: string;         // ENS
    avatar: string;              // Profile image
    verified: boolean;
  };
  createdAt: string;             // ISO timestamp
  content: {
    text: string;                // Original post text
    media: Array<{
      type: 'image' | 'video' | 'link';
      url: string;
      preview?: string;
    }>;
    mentions: string[];          // @mentions
    hashtags: string[];          // #hashtags
    urls: string[];              // Expanded URLs
  };
  stats: {
    likes: number;
    retweets: number;
    replies: number;
    views?: number;
  };
  isRetweet: boolean;
  isReply: boolean;
  isAnnouncement: boolean;       // Heuristic: links + media + high engagement
  summary: string;               // LLM-generated 280-char summary
}
```

### Summarization Prompt

```typescript
const SOCIAL_SUMMARIZATION_PROMPT = `
You are summarizing official ENS social media posts for a governance dashboard.

TASK: Generate a clear, informative summary preserving the original intent.

CONSTRAINTS:
- Maximum 280 characters (strict limit)
- Preserve announcements, deadlines, and calls-to-action
- Neutral tone - report what was said, not opinions about it
- Include specific details: dates, version numbers, links context
- For retweets, note "RT from @handle:" prefix
- No emojis unless quoting the original

CONTENT TYPES TO IDENTIFY:
- Announcement: New feature, release, or official statement
- Reminder: Deadline, vote ending, event coming up
- Thread: Part of longer discussion (note if thread)
- Engagement: Response to community question

INPUT:
Account: {account}
Type: {isRetweet ? 'Retweet' : 'Original'}
Text: {text}
Links: {urls}
Media: {mediaCount} attachments

OUTPUT (280 chars max):
`;
```

### Caching Strategy

| Cache Layer | TTL | Purpose |
|-------------|-----|---------|
| API Response Cache | 5 min | Respect Twitter rate limits |
| Summarization Cache | 12 hours | Tweets don't change |
| Client-side (SWR) | 2 min | Social is time-sensitive |

### Error Handling

```typescript
// Twitter-specific error handling
const handleTwitterError = (error: TwitterError) => {
  switch (error.code) {
    case 429: // Rate limited
      return { retryAfter: error.headers['x-rate-limit-reset'] };
    case 401: // Auth failed
      console.error('Twitter auth invalid - check TWITTER_BEARER_TOKEN');
      return { fallback: 'cache' };
    case 403: // Account suspended/protected
      return { skip: true, reason: 'Account unavailable' };
    default:
      return { fallback: 'empty' };
  }
};
```

---

## 3. API Endpoints

### Discourse Feed Endpoint

```typescript
// /api/feeds/discourse/route.ts

import { NextResponse } from 'next/server';
import { fetchDiscourseTopics, summarizeContent } from '@/shared/lib/feeds';

export const revalidate = 900; // 15 minutes

interface DiscourseParams {
  limit?: number;        // Default: 10, Max: 25
  categories?: string;   // Comma-separated category IDs
  includeSummaries?: boolean; // Default: true
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 25);
  const categories = searchParams.get('categories')?.split(',') || ['33', '34'];
  const includeSummaries = searchParams.get('summaries') !== 'false';

  try {
    const topics = await fetchDiscourseTopics({ limit, categories });

    const items = includeSummaries
      ? await Promise.all(topics.map(summarizeDiscourseItem))
      : topics.map(t => ({ ...t, summary: null }));

    return NextResponse.json({
      success: true,
      data: {
        items,
        meta: {
          count: items.length,
          source: 'discuss.ens.domains',
          categories,
          lastUpdated: new Date().toISOString(),
        }
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch discourse feed' },
      { status: 500 }
    );
  }
}
```

### Social Feed Endpoint

```typescript
// /api/feeds/social/route.ts

import { NextResponse } from 'next/server';
import { fetchTwitterTimeline, summarizeSocialPost } from '@/shared/lib/feeds';

export const revalidate = 300; // 5 minutes

interface SocialParams {
  accounts?: string;     // Comma-separated: 'ensdomains,ens_dao'
  limit?: number;        // Default: 10, Max: 25
  includeRetweets?: boolean; // Default: true
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accounts = searchParams.get('accounts')?.split(',') || ['ensdomains', 'ens_dao'];
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 25);
  const includeRetweets = searchParams.get('retweets') !== 'false';

  try {
    // Fetch from all accounts in parallel
    const allPosts = await Promise.all(
      accounts.map(account => fetchTwitterTimeline(account, { limit, includeRetweets }))
    );

    // Merge, dedupe, sort by date
    const merged = dedupeAndSort(allPosts.flat());
    const limited = merged.slice(0, limit);

    // Summarize
    const items = await Promise.all(limited.map(summarizeSocialPost));

    return NextResponse.json({
      success: true,
      data: {
        items,
        meta: {
          count: items.length,
          accounts,
          platforms: ['twitter'],
          lastUpdated: new Date().toISOString(),
        }
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch social feed' },
      { status: 500 }
    );
  }
}
```

---

## 4. Shared Libraries

### Summarizer (LLM Integration)

```typescript
// /shared/lib/feeds/summarizer.ts

import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'crypto';

const anthropic = new Anthropic();

// In-memory cache (upgrade to Redis for production)
const summaryCache = new Map<string, { summary: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function generateSummary(
  content: string,
  prompt: string,
  options: { maxLength?: number; cacheKey?: string } = {}
): Promise<string> {
  const { maxLength = 280, cacheKey } = options;

  // Check cache
  if (cacheKey) {
    const cached = summaryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.summary;
    }
  }

  // Generate with Claude
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: prompt.replace('{content}', content)
    }]
  });

  let summary = message.content[0].type === 'text'
    ? message.content[0].text
    : '';

  // Enforce character limit
  if (summary.length > maxLength) {
    summary = summary.slice(0, maxLength - 3) + '...';
  }

  // Cache result
  if (cacheKey) {
    summaryCache.set(cacheKey, { summary, timestamp: Date.now() });
  }

  return summary;
}

// Batch summarization for efficiency
export async function batchSummarize(
  items: Array<{ id: string; content: string }>,
  promptTemplate: string
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  // Process in parallel batches of 5
  const BATCH_SIZE = 5;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const summaries = await Promise.all(
      batch.map(item =>
        generateSummary(item.content, promptTemplate, { cacheKey: item.id })
      )
    );
    batch.forEach((item, idx) => results.set(item.id, summaries[idx]));
  }

  return results;
}
```

### Discourse Client

```typescript
// /shared/lib/feeds/discourse-client.ts

const DISCOURSE_BASE = 'https://discuss.ens.domains';

interface FetchOptions {
  limit: number;
  categories: string[];
}

export async function fetchDiscourseTopics(options: FetchOptions) {
  const { limit, categories } = options;

  // Fetch latest topics for each category
  const topicPromises = categories.map(async (categoryId) => {
    const response = await fetch(
      `${DISCOURSE_BASE}/c/${categoryId}.json?order=created`,
      { next: { revalidate: 900 } } // 15 min cache
    );

    if (!response.ok) throw new Error(`Discourse API error: ${response.status}`);

    const data = await response.json();
    return data.topic_list.topics.slice(0, limit);
  });

  const allTopics = (await Promise.all(topicPromises)).flat();

  // Sort by created_at, take top N
  return allTopics
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)
    .map(normalizeDiscourseTopic);
}

async function fetchTopicContent(topicId: number, slug: string): Promise<string> {
  const response = await fetch(
    `${DISCOURSE_BASE}/t/${slug}/${topicId}.json`,
    { next: { revalidate: 900 } }
  );

  if (!response.ok) return '';

  const data = await response.json();
  const firstPost = data.post_stream?.posts?.[0];

  // Extract text, strip HTML, limit length
  return firstPost?.cooked
    ? stripHtml(firstPost.cooked).slice(0, 2000)
    : '';
}

function normalizeDiscourseTopic(topic: any): NormalizedDiscourseItem {
  return {
    id: `discourse-${topic.id}`,
    source: 'discourse',
    url: `${DISCOURSE_BASE}/t/${topic.slug}/${topic.id}`,
    title: topic.title,
    author: topic.posters?.[0]?.user?.username || 'unknown',
    createdAt: topic.created_at,
    category: topic.category_id.toString(),
    tags: topic.tags || [],
    stats: {
      replies: topic.reply_count,
      views: topic.views,
      likes: topic.like_count,
    },
    rawContent: '', // Fetched separately
    summary: '',    // Generated separately
  };
}
```

### Social Client (Twitter)

```typescript
// /shared/lib/feeds/social-client.ts

const TWITTER_API = 'https://api.twitter.com/2';

const USER_IDS: Record<string, string> = {
  ensdomains: '2788237729',
  ens_dao: '1457051534928605185',
};

interface TwitterOptions {
  limit: number;
  includeRetweets: boolean;
}

export async function fetchTwitterTimeline(
  account: string,
  options: TwitterOptions
): Promise<NormalizedSocialItem[]> {
  const userId = USER_IDS[account];
  if (!userId) throw new Error(`Unknown account: ${account}`);

  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) throw new Error('TWITTER_BEARER_TOKEN not configured');

  const params = new URLSearchParams({
    max_results: options.limit.toString(),
    'tweet.fields': 'created_at,public_metrics,entities,referenced_tweets',
    'user.fields': 'name,username,profile_image_url,verified',
    expansions: 'author_id,attachments.media_keys',
    'media.fields': 'url,preview_image_url,type',
  });

  if (!options.includeRetweets) {
    params.set('exclude', 'retweets');
  }

  const response = await fetch(
    `${TWITTER_API}/users/${userId}/tweets?${params}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 }, // 5 min cache
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Twitter API error: ${error.detail || response.status}`);
  }

  const data = await response.json();
  return (data.data || []).map((tweet: any) =>
    normalizeTwitterPost(tweet, data.includes, account)
  );
}

function normalizeTwitterPost(
  tweet: any,
  includes: any,
  account: string
): NormalizedSocialItem {
  const author = includes?.users?.find((u: any) => u.id === tweet.author_id);
  const media = includes?.media?.filter((m: any) =>
    tweet.attachments?.media_keys?.includes(m.media_key)
  ) || [];

  const isRetweet = tweet.referenced_tweets?.some((r: any) => r.type === 'retweeted');
  const metrics = tweet.public_metrics || {};

  return {
    id: `twitter-${tweet.id}`,
    source: 'twitter',
    platform: 'X',
    url: `https://x.com/${account}/status/${tweet.id}`,
    author: {
      handle: author?.username || account,
      displayName: author?.name || account,
      avatar: author?.profile_image_url || '',
      verified: author?.verified || false,
    },
    createdAt: tweet.created_at,
    content: {
      text: tweet.text,
      media: media.map((m: any) => ({
        type: m.type,
        url: m.url || m.preview_image_url,
      })),
      mentions: tweet.entities?.mentions?.map((m: any) => m.username) || [],
      hashtags: tweet.entities?.hashtags?.map((h: any) => h.tag) || [],
      urls: tweet.entities?.urls?.map((u: any) => u.expanded_url) || [],
    },
    stats: {
      likes: metrics.like_count || 0,
      retweets: metrics.retweet_count || 0,
      replies: metrics.reply_count || 0,
      views: metrics.impression_count,
    },
    isRetweet,
    isReply: tweet.referenced_tweets?.some((r: any) => r.type === 'replied_to'),
    isAnnouncement: detectAnnouncement(tweet, metrics),
    summary: '',
  };
}

function detectAnnouncement(tweet: any, metrics: any): boolean {
  // Heuristic: has links + media + above-average engagement
  const hasLinks = tweet.entities?.urls?.length > 0;
  const hasMedia = tweet.attachments?.media_keys?.length > 0;
  const highEngagement = (metrics.like_count || 0) > 50;

  return hasLinks && (hasMedia || highEngagement);
}
```

---

## 5. Dashboard Hooks

```typescript
// /shared/hooks/use-api-data.ts (additions)

export interface DiscourseItem {
  id: string;
  url: string;
  title: string;
  author: string;
  createdAt: string;
  category: string;
  tags: string[];
  stats: { replies: number; views: number; likes: number };
  summary: string | null;
}

export interface SocialItem {
  id: string;
  url: string;
  platform: string;
  author: { handle: string; displayName: string; avatar: string };
  createdAt: string;
  content: { text: string };
  stats: { likes: number; retweets: number; replies: number };
  isAnnouncement: boolean;
  summary: string | null;
}

export interface DiscourseFeedData {
  items: DiscourseItem[];
  meta: { count: number; lastUpdated: string };
}

export interface SocialFeedData {
  items: SocialItem[];
  meta: { count: number; accounts: string[]; lastUpdated: string };
}

export function useDiscourseFeed(limit = 10) {
  return useSWR<DiscourseFeedData>(
    `/api/feeds/discourse?limit=${limit}`,
    fetcher,
    { refreshInterval: 900000 } // 15 minutes
  );
}

export function useSocialFeed(limit = 10) {
  return useSWR<SocialFeedData>(
    `/api/feeds/social?limit=${limit}`,
    fetcher,
    { refreshInterval: 300000 } // 5 minutes
  );
}
```

---

## 6. Environment Variables

```env
# .env.local (additions)

# Discourse (optional - public API works without auth)
DISCOURSE_API_KEY=           # For higher rate limits
DISCOURSE_API_USERNAME=      # Required if using API key

# Twitter/X API v2
TWITTER_BEARER_TOKEN=        # Required for social feed

# LLM for summarization
ANTHROPIC_API_KEY=           # For Claude summarization
# OR
OPENAI_API_KEY=              # For GPT-4 summarization

# Optional: Redis cache
REDIS_URL=                   # For production caching
```

---

## 7. Implementation Phases

### Phase 1: Core Infrastructure (Day 1)
- [ ] Create `/shared/lib/feeds/` directory structure
- [ ] Implement base types (`types.ts`)
- [ ] Implement summarizer with caching (`summarizer.ts`)
- [ ] Add environment variable validation

### Phase 2: Discourse Feed (Day 2)
- [ ] Implement Discourse client (`discourse-client.ts`)
- [ ] Create API route (`/api/feeds/discourse/route.ts`)
- [ ] Add `useDiscourseFeed` hook
- [ ] Create basic Discourse widget component

### Phase 3: Social Feed (Day 3)
- [ ] Implement Twitter client (`social-client.ts`)
- [ ] Create API route (`/api/feeds/social/route.ts`)
- [ ] Add `useSocialFeed` hook
- [ ] Create basic Social widget component

### Phase 4: Polish & Integration (Day 4)
- [ ] Add error boundaries to widgets
- [ ] Implement loading skeletons
- [ ] Add manual refresh capability
- [ ] Test rate limit handling
- [ ] Add widgets to dashboard layout

---

## 8. Widget Designs

### Discourse Feed Widget

```
┌─────────────────────────────────────────────────────────────┐
│ FORUM DISCUSSIONS                            🔄 15m ago     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [EP5.2] Increase Quorum to 2%              DAO-wide     │ │
│ │ Proposal to increase quorum threshold from 1M to 2M     │ │
│ │ ENS tokens, citing low participation in recent votes... │ │
│ │ 👤 nick.eth · 💬 23 · 👁 1.2K            2 hours ago    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Working Group Budget Q1 2025               Governance   │ │
│ │ Meta-governance WG requests 150K USDC for Q1 ops,       │ │
│ │ including steward compensation and tooling upgrades...  │ │
│ │ 👤 avsa.eth · 💬 45 · 👁 3.4K            5 hours ago    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ENSv2 Technical Roadmap Discussion         DAO-wide     │ │
│ │ ENS Labs outlines migration path to L2, targeting Q3    │ │
│ │ testnet launch with mainnet following in Q4 2025...     │ │
│ │ 👤 jeff.eth · 💬 67 · 👁 5.1K            1 day ago      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                    View all on Forum →                      │
└─────────────────────────────────────────────────────────────┘
```

### Social Feed Widget

```
┌─────────────────────────────────────────────────────────────┐
│ SOCIAL                                       🔄 5m ago      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🖼 @ensdomains                              📢 Announce │ │
│ │ ENS Labs releases v0.3.0 of ENSjs with full L2 support  │ │
│ │ and improved resolution performance. Upgrade guide at   │ │
│ │ docs.ens.domains/migration                              │ │
│ │ ❤️ 234 · 🔄 89 · 💬 12                    30 min ago    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🖼 @ens_dao                                              │ │
│ │ Reminder: EP5.3 vote ends in 48 hours. Current turnout  │ │
│ │ at 2.1M ENS (52% For). Cast your vote on Tally before   │ │
│ │ Thursday 18:00 UTC.                                     │ │
│ │ ❤️ 156 · 🔄 67 · 💬 8                     2 hours ago   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🖼 @ensdomains · RT @vitalik.eth                        │ │
│ │ RT: Vitalik discusses ENS as critical infrastructure    │ │
│ │ for Ethereum identity layer, emphasizing importance of  │ │
│ │ decentralized naming for wallet UX.                     │ │
│ │ ❤️ 1.2K · 🔄 456 · 💬 89                  4 hours ago   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│               @ensdomains · @ens_dao on X →                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Rate Limit Budget

| Service | Limit | Our Usage | Headroom |
|---------|-------|-----------|----------|
| Discourse API | 60/min | ~4/15min | 93% |
| Twitter API v2 | 1500/15min | ~20/5min | 96% |
| Claude API | 1000/min | ~10/15min | 99% |

---

## 10. Future Enhancements

1. **Farcaster Integration** - Add `/fc` channel monitoring
2. **Sentiment Analysis** - Tag items as positive/negative/neutral
3. **Threading** - Link related discussions across platforms
4. **Alerts** - Push notifications for high-signal items
5. **Historical Archive** - Store summaries for trend analysis
6. **Custom Filters** - User-defined topic preferences
