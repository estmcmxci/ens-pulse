import { NextResponse } from 'next/server';
import { fetchTwitterPosts } from '@/shared/lib/feeds/social-client';
import { summarize } from '@/shared/lib/feeds/summarizer';

export const revalidate = 300; // 5 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);
    const includeSummaries = searchParams.get('summaries') !== 'false';

    const posts = await fetchTwitterPosts(['ensdomains', 'ens_dao'], limit);

    // Generate summaries in parallel if requested
    const withSummaries = includeSummaries
      ? await Promise.all(
          posts.map(async (post) => ({
            ...post,
            summary: await summarize(
              `@${post.author.handle}: ${post.content.text}`,
              'social',
              post.id
            ),
          }))
        )
      : posts;

    return NextResponse.json({
      success: true,
      data: {
        items: withSummaries,
        meta: {
          count: withSummaries.length,
          accounts: ['ensdomains', 'ens_dao'],
          source: 'twitter',
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
