# ENS Pulse: Automated Feeds Implementation Task

> **For Ralph-Loop Execution** — All environment variables are pre-configured in `.env`

---

## Objective

Implement two automated content feeds for the ENS Pulse dashboard:

1. **Discourse Feed** — Forum discussions from `discuss.ens.domains`
2. **Social Feed** — Posts from `@ensdomains` and `@ens_dao` on X/Twitter

Both feeds generate **280-character neutral summaries** using Claude, optimized for clarity and skim-ability.

---

## Project Context

- **Working Directory:** `ens-pulse/apps/dashboard`
- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Data Fetching:** SWR hooks pattern (see `/shared/hooks/use-api-data.ts`)
- **Existing Feeds:** News/RSS feeds exist at `/api/context/news` — use similar patterns
- **Environment:** All API keys pre-configured in `.env` (TWITTER_BEARER_TOKEN, ANTHROPIC_API_KEY)

---

## Implementation Checklist

### Phase 1: Core Infrastructure

Create `/shared/lib/feeds/` directory with:

- [ ] **`types.ts`** — Shared type definitions for both feeds
- [ ] **`summarizer.ts`** — Claude-based summarization with 24hr caching
- [ ] **`cache.ts`** — Simple in-memory cache utility with TTL

### Phase 2: Discourse Feed

- [ ] **`/shared/lib/feeds/discourse-client.ts`** — Fetch from Discourse API
- [ ] **`/app/api/feeds/discourse/route.ts`** — API endpoint
- [ ] **`useDiscourseFeed()` hook** — Add to `/shared/hooks/use-api-data.ts`
- [ ] **`DiscourseFeedWidget`** — Add to `/app/page.tsx`

### Phase 3: Social Feed

- [ ] **`/shared/lib/feeds/social-client.ts`** — Fetch from Twitter API v2
- [ ] **`/app/api/feeds/social/route.ts`** — API endpoint
- [ ] **`useSocialFeed()` hook** — Add to `/shared/hooks/use-api-data.ts`
- [ ] **`SocialFeedWidget`** — Add to `/app/page.tsx`

### Phase 4: Dashboard Integration

- [ ] Add both widgets to dashboard layout (after News widget row)
- [ ] Implement loading skeletons
- [ ] Add error states with graceful fallbacks
- [ ] Test end-to-end

---

## Technical Specifications

### 1. Types (`/shared/lib/feeds/types.ts`)

```typescript
export interface NormalizedDiscourseItem {
  id: string;                    // `discourse-{topic_id}`
  source: 'discourse';
  url: string;                   // Full topic URL
  title: string;
  author: string;
  authorAvatar?: string;
  createdAt: string;             // ISO timestamp
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
```

### 2. Summarizer (`/shared/lib/feeds/summarizer.ts`)

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();
const cache = new Map<string, { summary: string; expires: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function summarize(
  content: string,
  type: 'discourse' | 'social',
  cacheKey: string
): Promise<string> {
  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.summary;
  }

  const prompt = type === 'discourse'
    ? DISCOURSE_PROMPT
    : SOCIAL_PROMPT;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: prompt.replace('{content}', content.slice(0, 2000))
    }]
  });

  let summary = message.content[0].type === 'text'
    ? message.content[0].text.trim()
    : '';

  // Enforce 280 char limit
  if (summary.length > 280) {
    summary = summary.slice(0, 277) + '...';
  }

  // Cache result
  cache.set(cacheKey, { summary, expires: Date.now() + CACHE_TTL });

  return summary;
}

const DISCOURSE_PROMPT = `You are a neutral governance analyst. Summarize this ENS DAO forum discussion.

RULES:
- Maximum 280 characters (STRICT)
- Neutral, factual tone only
- Focus on: what is proposed/discussed, who is involved, key implications
- No emojis, exclamation marks, or hype language
- Include proposal numbers (EP/EIP) if mentioned
- BANNED: exciting, amazing, groundbreaking, revolutionary, huge

CONTENT:
{content}

SUMMARY (280 chars max):`;

const SOCIAL_PROMPT = `Summarize this official ENS social media post for a governance dashboard.

RULES:
- Maximum 280 characters (STRICT)
- Preserve announcements, deadlines, calls-to-action
- Neutral tone - report what was said
- Include specific details: dates, versions, links context
- No emojis unless quoting original
- For retweets, note "RT from @handle:"

CONTENT:
{content}

SUMMARY (280 chars max):`;
```

### 3. Discourse Client (`/shared/lib/feeds/discourse-client.ts`)

```typescript
const DISCOURSE_BASE = 'https://discuss.ens.domains';

// ENS Forum category IDs
const CATEGORIES = {
  DAO_WIDE: 33,
  GOVERNANCE: 34,
  TEMP_CHECK: 51,
  NEWSLETTER: 72,
};

export async function fetchDiscourseTopics(
  limit = 10,
  categoryIds = [CATEGORIES.DAO_WIDE, CATEGORIES.GOVERNANCE]
): Promise<NormalizedDiscourseItem[]> {

  // Fetch latest topics from each category
  const topicPromises = categoryIds.map(async (catId) => {
    const res = await fetch(
      `${DISCOURSE_BASE}/c/${catId}.json?order=created`,
      { next: { revalidate: 900 } } // 15 min cache
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.topic_list?.topics || [];
  });

  const allTopics = (await Promise.all(topicPromises)).flat();

  // Sort by date, dedupe, limit
  const sorted = allTopics
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);

  // Fetch first post content for each (parallel, max 5)
  const withContent = await Promise.all(
    sorted.map(async (topic) => {
      const content = await fetchTopicFirstPost(topic.id, topic.slug);
      return normalizeDiscourseTopic(topic, content);
    })
  );

  return withContent;
}

async function fetchTopicFirstPost(id: number, slug: string): Promise<string> {
  try {
    const res = await fetch(
      `${DISCOURSE_BASE}/t/${slug}/${id}.json`,
      { next: { revalidate: 900 } }
    );
    if (!res.ok) return '';
    const data = await res.json();
    const firstPost = data.post_stream?.posts?.[0];
    // Strip HTML tags
    return firstPost?.cooked?.replace(/<[^>]*>/g, ' ').slice(0, 2000) || '';
  } catch {
    return '';
  }
}

function normalizeDiscourseTopic(topic: any, content: string): NormalizedDiscourseItem {
  return {
    id: `discourse-${topic.id}`,
    source: 'discourse',
    url: `${DISCOURSE_BASE}/t/${topic.slug}/${topic.id}`,
    title: topic.title,
    author: topic.last_poster_username || 'unknown',
    createdAt: topic.created_at,
    category: topic.category_id?.toString() || '',
    categoryName: getCategoryName(topic.category_id),
    tags: topic.tags || [],
    stats: {
      replies: topic.reply_count || 0,
      views: topic.views || 0,
      likes: topic.like_count || 0,
    },
    rawContent: content,
    summary: null,
  };
}

function getCategoryName(id: number): string {
  const names: Record<number, string> = {
    33: 'DAO-wide',
    34: 'Governance',
    51: 'Temp Check',
    72: 'Newsletter',
  };
  return names[id] || 'General';
}
```

### 4. Social Client (`/shared/lib/feeds/social-client.ts`)

```typescript
const TWITTER_API = 'https://api.twitter.com/2';

const ENS_ACCOUNTS: Record<string, string> = {
  ensdomains: '2788237729',
  ens_dao: '1457051534928605185',
};

export async function fetchTwitterPosts(
  accounts = ['ensdomains', 'ens_dao'],
  limit = 10
): Promise<NormalizedSocialItem[]> {
  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) throw new Error('TWITTER_BEARER_TOKEN not configured');

  // Fetch from each account in parallel
  const postPromises = accounts.map(async (account) => {
    const userId = ENS_ACCOUNTS[account];
    if (!userId) return [];

    const params = new URLSearchParams({
      max_results: Math.min(limit, 10).toString(),
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
      console.error(`Twitter API error for ${account}:`, res.status);
      return [];
    }

    const data = await res.json();
    return (data.data || []).map((tweet: any) =>
      normalizeTwitterPost(tweet, data.includes, account)
    );
  });

  const allPosts = (await Promise.all(postPromises)).flat();

  // Sort by date, limit
  return allPosts
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

function normalizeTwitterPost(tweet: any, includes: any, account: string): NormalizedSocialItem {
  const author = includes?.users?.find((u: any) => u.id === tweet.author_id);
  const metrics = tweet.public_metrics || {};
  const isRetweet = tweet.referenced_tweets?.some((r: any) => r.type === 'retweeted');

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
      urls: tweet.entities?.urls?.map((u: any) => u.expanded_url) || [],
      mentions: tweet.entities?.mentions?.map((m: any) => m.username) || [],
      hashtags: tweet.entities?.hashtags?.map((h: any) => h.tag) || [],
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

function detectAnnouncement(tweet: any, metrics: any): boolean {
  const hasLinks = (tweet.entities?.urls?.length || 0) > 0;
  const highEngagement = (metrics.like_count || 0) > 50;
  return hasLinks && highEngagement;
}
```

### 5. API Routes

**`/app/api/feeds/discourse/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { fetchDiscourseTopics } from '@/shared/lib/feeds/discourse-client';
import { summarize } from '@/shared/lib/feeds/summarizer';

export const revalidate = 900; // 15 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

    const topics = await fetchDiscourseTopics(limit);

    // Generate summaries in parallel
    const withSummaries = await Promise.all(
      topics.map(async (topic) => ({
        ...topic,
        summary: topic.rawContent
          ? await summarize(
              `Title: ${topic.title}\n\n${topic.rawContent}`,
              'discourse',
              topic.id
            )
          : null,
      }))
    );

    return NextResponse.json({
      success: true,
      data: {
        items: withSummaries,
        meta: {
          count: withSummaries.length,
          source: 'discuss.ens.domains',
          lastUpdated: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Discourse feed error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch discourse feed' },
      { status: 500 }
    );
  }
}
```

**`/app/api/feeds/social/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { fetchTwitterPosts } from '@/shared/lib/feeds/social-client';
import { summarize } from '@/shared/lib/feeds/summarizer';

export const revalidate = 300; // 5 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

    const posts = await fetchTwitterPosts(['ensdomains', 'ens_dao'], limit);

    // Generate summaries in parallel
    const withSummaries = await Promise.all(
      posts.map(async (post) => ({
        ...post,
        summary: await summarize(
          `@${post.author.handle}: ${post.content.text}`,
          'social',
          post.id
        ),
      }))
    );

    return NextResponse.json({
      success: true,
      data: {
        items: withSummaries,
        meta: {
          count: withSummaries.length,
          accounts: ['ensdomains', 'ens_dao'],
          lastUpdated: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Social feed error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch social feed' },
      { status: 500 }
    );
  }
}
```

### 6. SWR Hooks (add to `/shared/hooks/use-api-data.ts`)

```typescript
// Add these interfaces and hooks

export interface DiscourseItem {
  id: string;
  url: string;
  title: string;
  author: string;
  createdAt: string;
  category: string;
  categoryName: string;
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
  isRetweet: boolean;
  isAnnouncement: boolean;
  summary: string | null;
}

export interface DiscourseFeedData {
  items: DiscourseItem[];
  meta: { count: number; source: string; lastUpdated: string };
}

export interface SocialFeedData {
  items: SocialItem[];
  meta: { count: number; accounts: string[]; lastUpdated: string };
}

export function useDiscourseFeed(limit = 5) {
  return useSWR<DiscourseFeedData>(
    `/api/feeds/discourse?limit=${limit}`,
    fetcher,
    { refreshInterval: 900000 } // 15 minutes
  );
}

export function useSocialFeed(limit = 5) {
  return useSWR<SocialFeedData>(
    `/api/feeds/social?limit=${limit}`,
    fetcher,
    { refreshInterval: 300000 } // 5 minutes
  );
}
```

### 7. Dashboard Widgets (add to `/app/page.tsx`)

Add after the existing News widget section in the layout:

```typescript
{/* ROW: DISCOURSE (1 col) | SOCIAL (1 col) */}
<div className="grid grid-cols-2 gap-3">
  <DiscourseFeedWidget />
  <SocialFeedWidget />
</div>
```

**DiscourseFeedWidget:**

```typescript
function DiscourseFeedWidget() {
  const { data, isLoading, error } = useDiscourseFeed(5);

  return (
    <Widget>
      <WidgetHeader>
        <WidgetTitle>FORUM DISCUSSIONS</WidgetTitle>
        <Link
          href="https://discuss.ens.domains"
          target="_blank"
          className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </WidgetHeader>
      <WidgetContent padding="sm">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 w-3/4 bg-[var(--color-bg-overlay)] rounded mb-2" />
                <div className="h-3 w-full bg-[var(--color-bg-overlay)] rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-sm text-[var(--color-negative)]">Failed to load</div>
        ) : (
          <div className="space-y-3">
            {data?.items.map((item) => (
              <Link
                key={item.id}
                href={item.url}
                target="_blank"
                className="block p-2 -mx-2 rounded hover:bg-[var(--color-bg-overlay)] transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-[var(--color-text-primary)] line-clamp-1">
                    {item.title}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)] shrink-0">
                    {item.categoryName}
                  </span>
                </div>
                {item.summary && (
                  <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2 mt-1">
                    {item.summary}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[var(--color-text-tertiary)]">
                  <span>{item.author}</span>
                  <span>💬 {item.stats.replies}</span>
                  <span>👁 {item.stats.views}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </WidgetContent>
    </Widget>
  );
}
```

**SocialFeedWidget:**

```typescript
function SocialFeedWidget() {
  const { data, isLoading, error } = useSocialFeed(5);

  return (
    <Widget>
      <WidgetHeader>
        <WidgetTitle>SOCIAL</WidgetTitle>
        <Link
          href="https://x.com/ensdomains"
          target="_blank"
          className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </WidgetHeader>
      <WidgetContent padding="sm">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 w-1/2 bg-[var(--color-bg-overlay)] rounded mb-2" />
                <div className="h-3 w-full bg-[var(--color-bg-overlay)] rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-sm text-[var(--color-negative)]">Failed to load</div>
        ) : (
          <div className="space-y-3">
            {data?.items.map((item) => (
              <Link
                key={item.id}
                href={item.url}
                target="_blank"
                className="block p-2 -mx-2 rounded hover:bg-[var(--color-bg-overlay)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  {item.author.avatar && (
                    <img
                      src={item.author.avatar}
                      alt=""
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">
                    @{item.author.handle}
                  </span>
                  {item.isAnnouncement && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-info)]/20 text-[var(--color-info)]">
                      Announce
                    </span>
                  )}
                  {item.isRetweet && (
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">RT</span>
                  )}
                </div>
                {item.summary && (
                  <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2 mt-1">
                    {item.summary}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[var(--color-text-tertiary)]">
                  <span>❤️ {item.stats.likes}</span>
                  <span>🔄 {item.stats.retweets}</span>
                  <span>💬 {item.stats.replies}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </WidgetContent>
    </Widget>
  );
}
```

---

## File Structure Summary

```
/shared/lib/feeds/
├── types.ts              # Shared type definitions
├── summarizer.ts         # Claude summarization with cache
├── discourse-client.ts   # Discourse API wrapper
└── social-client.ts      # Twitter API wrapper

/app/api/feeds/
├── discourse/route.ts    # GET /api/feeds/discourse
└── social/route.ts       # GET /api/feeds/social

/shared/hooks/
└── use-api-data.ts       # Add useDiscourseFeed, useSocialFeed

/app/
└── page.tsx              # Add DiscourseFeedWidget, SocialFeedWidget
```

---

## Environment Variables (Pre-configured)

```env
# Already set in .env
TWITTER_BEARER_TOKEN=xxx      # Twitter API v2
ANTHROPIC_API_KEY=xxx         # Claude for summarization
```

---

## Success Criteria

1. **Discourse Feed Widget** displays 5 recent forum topics with:
   - Title, category badge, author
   - 280-char AI summary
   - Reply/view counts
   - Links to full discussion

2. **Social Feed Widget** displays 5 recent posts with:
   - Avatar, handle, announcement badge
   - 280-char AI summary
   - Engagement stats (likes, RTs, replies)
   - Links to original post

3. **Performance:**
   - Discourse: 15-min refresh, summaries cached 24hr
   - Social: 5-min refresh, summaries cached 12hr
   - Graceful fallbacks on API errors

4. **Quality:**
   - Summaries are neutral, factual, ≤280 chars
   - No TypeScript errors
   - Consistent with existing widget styling
