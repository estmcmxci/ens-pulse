import { NextResponse } from 'next/server';
import { fetchDiscourseTopics, CATEGORIES } from '@/shared/lib/feeds/discourse-client';
import { summarize } from '@/shared/lib/feeds/summarizer';

export const revalidate = 900; // 15 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);
    const includeSummaries = searchParams.get('summaries') !== 'false';
    const daysParam = searchParams.get('days');
    const days = daysParam ? Math.min(parseInt(daysParam), 30) : null; // Max 30 days

    const topics = await fetchDiscourseTopics(limit * 2, [ // Fetch more to account for date filtering
      CATEGORIES.DAO_WIDE,
      CATEGORIES.GOVERNANCE,
    ]);

    // Filter by last activity date if days parameter is provided
    let filteredTopics = topics;
    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filteredTopics = topics.filter((topic) => {
        const activityDate = new Date(topic.lastActivityAt || topic.createdAt);
        return activityDate >= cutoffDate;
      });
    }

    // Apply limit after filtering
    filteredTopics = filteredTopics.slice(0, limit);

    // Generate summaries in parallel if requested
    const withSummaries = includeSummaries
      ? await Promise.all(
          filteredTopics.map(async (topic) => ({
            ...topic,
            summary: topic.rawContent
              ? await summarize(
                  `Title: ${topic.title}\n\n${topic.rawContent}`,
                  'discourse',
                  topic.id
                )
              : null,
          }))
        )
      : filteredTopics;

    return NextResponse.json({
      success: true,
      data: {
        items: withSummaries,
        meta: {
          count: withSummaries.length,
          source: 'discuss.ens.domains',
          lastUpdated: new Date().toISOString(),
          daysFilter: days,
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
