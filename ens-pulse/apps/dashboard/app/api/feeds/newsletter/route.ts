import { NextResponse } from 'next/server';
import { fetchFeedByKey } from '@/shared/lib/feeds/client';
import { summarize } from '@/shared/lib/feeds/summarizer';

export const revalidate = 3600; // 1 hour (newsletters don't change frequently)

export interface NewsletterItem {
  id: string;
  url: string;
  title: string;
  author: string;
  publishedAt: string;
  excerpt: string;
  summary: string | null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);
    const includeSummaries = searchParams.get('summaries') !== 'false';

    // Fetch the Paragraph newsletter feed
    const feed = await fetchFeedByKey('NEWSLETTER_PARAGRAPH');

    if (!feed) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch newsletter feed' },
        { status: 500 }
      );
    }

    // Transform to newsletter format
    const items: NewsletterItem[] = feed.items.slice(0, limit).map((item) => ({
      id: item.guid || item.link,
      url: item.link,
      title: item.title,
      author: item.creator || 'ENS DAO',
      publishedAt: item.pubDate,
      excerpt: item.contentSnippet?.slice(0, 300) || '',
      summary: null,
    }));

    // Generate summaries in parallel if requested
    const withSummaries = includeSummaries
      ? await Promise.all(
          items.map(async (item) => ({
            ...item,
            summary: await summarize(
              `Newsletter: ${item.title}\n\n${item.excerpt}`,
              'newsletter',
              item.id
            ),
          }))
        )
      : items;

    return NextResponse.json({
      success: true,
      data: {
        items: withSummaries,
        meta: {
          count: withSummaries.length,
          source: 'paragraph.xyz/@ensdao',
          feedTitle: feed.title,
          lastUpdated: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Newsletter feed error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch newsletter feed' },
      { status: 500 }
    );
  }
}
