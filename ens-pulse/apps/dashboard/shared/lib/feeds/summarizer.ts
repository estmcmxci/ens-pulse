/**
 * Claude-based summarization with caching
 * Generates 280-character neutral summaries for feed items
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// In-memory cache for summaries
const summaryCache = new Map<string, { summary: string; expires: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function summarize(
  content: string,
  type: 'discourse' | 'social' | 'proposal' | 'newsletter',
  cacheKey: string
): Promise<string> {
  // Check cache first
  const cached = summaryCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.summary;
  }

  const promptMap = {
    discourse: DISCOURSE_PROMPT,
    social: SOCIAL_PROMPT,
    proposal: PROPOSAL_PROMPT,
    newsletter: NEWSLETTER_PROMPT,
  };
  const prompt = promptMap[type];

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: prompt.replace('{content}', content.slice(0, 2000)),
        },
      ],
    });

    let summary =
      message.content[0].type === 'text' ? message.content[0].text.trim() : '';

    // Enforce 280 char limit
    if (summary.length > 280) {
      summary = summary.slice(0, 277) + '...';
    }

    // Cache result
    summaryCache.set(cacheKey, { summary, expires: Date.now() + CACHE_TTL });

    return summary;
  } catch (error) {
    console.error('Summarization error:', error);
    // Return empty string on error - will show original content
    return '';
  }
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

const PROPOSAL_PROMPT = `You are summarizing an ENS DAO governance proposal for a dashboard.

RULES:
- Maximum 280 characters (STRICT)
- Neutral, factual tone only
- Start with the key action: "Proposes to...", "Requests...", "Establishes..."
- Include specific numbers: amounts, percentages, durations if mentioned
- Note who benefits or is affected
- No emojis, exclamation marks, or hype language
- BANNED: exciting, amazing, groundbreaking, revolutionary, historic

PROPOSAL:
{content}

SUMMARY (280 chars max):`;

const NEWSLETTER_PROMPT = `Summarize this ENS DAO newsletter issue for a governance dashboard.

RULES:
- Maximum 280 characters (STRICT)
- Neutral, factual tone - report what was covered
- Highlight key topics: governance updates, protocol changes, ecosystem news
- Include specific details: proposal numbers, dates, amounts if mentioned
- No emojis, exclamation marks, or hype language
- BANNED: exciting, amazing, must-read, don't miss

NEWSLETTER:
{content}

SUMMARY (280 chars max):`;

// Clear expired cache entries periodically
export function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, value] of summaryCache.entries()) {
    if (value.expires < now) {
      summaryCache.delete(key);
    }
  }
}
