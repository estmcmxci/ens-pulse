/**
 * Discourse API client for ENS forum
 * Fetches topics from discuss.ens.domains
 */

import { NormalizedDiscourseItem } from './types';
import { feedCache, CACHE_TTL } from './cache';

const DISCOURSE_BASE = 'https://discuss.ens.domains';

// ENS Forum category IDs
export const CATEGORIES = {
  DAO_WIDE: 33,
  GOVERNANCE: 34,
  TEMP_CHECK: 51,
  NEWSLETTER: 72,
} as const;

const CATEGORY_NAMES: Record<number, string> = {
  21: 'Governance',
  24: 'Dev',
  28: 'Meta-Governance',
  33: 'DAO-wide',
  34: 'Governance',
  50: 'Working Groups',
  51: 'Temp Check',
  64: 'Endowment',
  72: 'Newsletter',
};

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
  posters?: Array<{ user_id: number; description: string }>;
  last_poster_username?: string;
  excerpt?: string;
}

interface DiscourseResponse {
  topic_list?: {
    topics: DiscourseTopicRaw[];
  };
}

export async function fetchDiscourseTopics(
  limit = 10,
  _categoryIds = [CATEGORIES.DAO_WIDE, CATEGORIES.GOVERNANCE] // Kept for backwards compatibility
): Promise<NormalizedDiscourseItem[]> {
  const cacheKey = `discourse:topics:latest:${limit}`;
  const cached = feedCache.get<NormalizedDiscourseItem[]>(cacheKey);
  if (cached) return cached;

  // Fetch from /latest.json to get recent topics across all categories
  let allTopics: DiscourseTopicRaw[] = [];
  try {
    const res = await fetch(
      `${DISCOURSE_BASE}/latest.json`,
      { next: { revalidate: 900 } } // 15 min cache
    );
    if (res.ok) {
      const data: DiscourseResponse = await res.json();
      allTopics = data.topic_list?.topics || [];
    }
  } catch (error) {
    console.error('Error fetching latest topics:', error);
  }

  // Sort by last activity (most recent first), limit
  const sorted = allTopics
    .sort(
      (a, b) =>
        new Date(b.last_posted_at).getTime() - new Date(a.last_posted_at).getTime()
    )
    .slice(0, limit);

  // Fetch first post content for each (parallel)
  const withContent = await Promise.all(
    sorted.map(async (topic) => {
      const content = await fetchTopicFirstPost(topic.id, topic.slug);
      return normalizeDiscourseTopic(topic, content);
    })
  );

  // Cache result
  feedCache.set(cacheKey, withContent, CACHE_TTL.DISCOURSE_TOPICS);

  return withContent;
}

async function fetchTopicFirstPost(
  id: number,
  slug: string
): Promise<string> {
  const cacheKey = `discourse:content:${id}`;
  const cached = feedCache.get<string>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${DISCOURSE_BASE}/t/${slug}/${id}.json`, {
      next: { revalidate: 900 },
    });
    if (!res.ok) return '';

    const data = await res.json();
    const firstPost = data.post_stream?.posts?.[0];

    // Strip HTML tags and limit length
    const content = firstPost?.cooked
      ? stripHtml(firstPost.cooked).slice(0, 2000)
      : '';

    feedCache.set(cacheKey, content, CACHE_TTL.DISCOURSE_CONTENT);
    return content;
  } catch (error) {
    console.error(`Error fetching topic content ${id}:`, error);
    return '';
  }
}

function normalizeDiscourseTopic(
  topic: DiscourseTopicRaw,
  content: string
): NormalizedDiscourseItem {
  return {
    id: `discourse-${topic.id}`,
    source: 'discourse',
    url: `${DISCOURSE_BASE}/t/${topic.slug}/${topic.id}`,
    title: topic.title,
    author: topic.last_poster_username || 'unknown',
    createdAt: topic.created_at,
    lastActivityAt: topic.last_posted_at,
    category: topic.category_id?.toString() || '',
    categoryName: CATEGORY_NAMES[topic.category_id] || 'General',
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

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
